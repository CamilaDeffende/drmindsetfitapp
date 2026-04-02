import crypto from "node:crypto";

const PLAN_DURATION_DAYS: Record<string, number> = {
  mensal: 30,
  semestral: 183,
  anual: 365,
};

const TRANSIENT_STATUSES = new Set(["pending", "in_process"]);
const TERMINAL_FAILURE_STATUSES = new Set(["rejected", "cancelled", "refunded", "charged_back"]);

type JsonRecord = Record<string, unknown>;

function sendJson(response: any, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

async function readBody(request: any): Promise<any> {
  if (typeof request.body === "object" && request.body !== null) {
    return request.body;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function getSupabaseAdminConfig() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin credentials not configured");
  }

  return { supabaseUrl, serviceRoleKey };
}

async function supabaseAdminRequest(path: string, init: RequestInit) {
  const { supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig();
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function addDaysIso(days: number) {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return {
    start: now.toISOString(),
    end: end.toISOString(),
  };
}

async function fetchMercadoPagoPayment(paymentId: string) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error("Mercado Pago access token not configured");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Mercado Pago payment fetch failed: ${JSON.stringify(payload)}`);
  }

  return payload;
}

function parseSignatureHeader(rawHeader: string) {
  const entries = String(rawHeader || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split("=", 2);
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {});

  return {
    ts: entries.ts,
    v1: entries.v1,
  };
}

function buildManifest(params: { dataId: string; requestId: string; ts: string }) {
  return `id:${params.dataId};request-id:${params.requestId};ts:${params.ts};`;
}

function safeTimingEqual(a: string, b: string) {
  try {
    const left = Buffer.from(a, "utf8");
    const right = Buffer.from(b, "utf8");
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function validateWebhookSignature(request: any) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("Mercado Pago webhook secret not configured");
  }

  const signatureHeader = String(request.headers["x-signature"] ?? "").trim();
  const requestId = String(request.headers["x-request-id"] ?? "").trim();
  const { ts, v1 } = parseSignatureHeader(signatureHeader);
  const dataId = String(request.query?.["data.id"] ?? request.query?.id ?? "").trim();

  if (!signatureHeader || !requestId || !ts || !v1 || !dataId) {
    return {
      valid: false,
      reason: "missing_signature_headers",
    };
  }

  const manifest = buildManifest({ dataId, requestId, ts });
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return {
    valid: safeTimingEqual(expected, v1),
    reason: "signature_checked",
    manifest,
  };
}

async function upsertTransactionByExternalReference(externalReference: string, payload: JsonRecord) {
  const response = await supabaseAdminRequest("payment_transactions", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      external_reference: externalReference,
      provider: "mercadopago",
      updated_at: new Date().toISOString(),
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase payment transaction upsert failed: ${await response.text()}`);
  }

  return response.json();
}

async function findTransaction(filters: { externalReference?: string; paymentId?: string }) {
  const clauses: string[] = [];
  if (filters.externalReference) {
    clauses.push(`external_reference.eq.${encodeURIComponent(filters.externalReference)}`);
  }
  if (filters.paymentId) {
    clauses.push(`payment_id.eq.${encodeURIComponent(filters.paymentId)}`);
  }
  if (!clauses.length) return null;

  const response = await supabaseAdminRequest(
    `payment_transactions?select=*&or=(${clauses.join(",")})&limit=1`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error(`Supabase payment transaction lookup failed: ${await response.text()}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function syncApprovedSubscription(userId: string, paymentId: string, planId: string) {
  const days = PLAN_DURATION_DAYS[planId] ?? 30;
  const period = addDaysIso(days);

  const response = await supabaseAdminRequest("subscriptions", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      status: "active",
      plan: "premium",
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: false,
      stripe_subscription_id: `mp:${paymentId}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase subscription upsert failed: ${await response.text()}`);
  }

  return response.json();
}

function logWebhook(stage: string, payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      scope: "mercadopago:webhook",
      stage,
      ...payload,
    }),
  );
}

export default async function handler(request: any, response: any) {
  if (request.method === "GET") {
    return sendJson(response, 200, { ok: true, mode: "mercadopago-webhook" });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const signature = validateWebhookSignature(request);
    if (!signature.valid) {
      logWebhook("invalid_signature", {
        reason: signature.reason,
        hasSignature: Boolean(request.headers["x-signature"]),
        hasRequestId: Boolean(request.headers["x-request-id"]),
        queryDataId: request.query?.["data.id"] ?? null,
      });

      return sendJson(response, 401, {
        error: "Invalid Mercado Pago webhook signature",
        reason: signature.reason,
      });
    }

    const body = await readBody(request);
    const resourceId =
      body?.data?.id ??
      body?.id ??
      request.query?.id ??
      request.query?.["data.id"] ??
      null;
    const eventType = String(body?.type ?? request.query?.type ?? request.query?.topic ?? "");

    logWebhook("notification_received", {
      method: request.method,
      eventType,
      resourceId,
      query: request.query ?? {},
    });

    if (!resourceId) {
      return sendJson(response, 200, {
        ok: true,
        ignored: true,
        reason: "Missing resource id",
      });
    }

    if (eventType && eventType !== "payment") {
      return sendJson(response, 200, {
        ok: true,
        ignored: true,
        reason: `Unsupported topic: ${eventType}`,
      });
    }

    const payment = await fetchMercadoPagoPayment(String(resourceId));
    const paymentStatus = String(payment?.status ?? "").toLowerCase();
    const statusDetail = String(payment?.status_detail ?? "").trim() || null;
    const externalReference = String(
      payment?.external_reference ?? payment?.metadata?.external_reference ?? "",
    ).trim();
    const userId = String(payment?.metadata?.user_id ?? "").trim();
    const planId = String(payment?.metadata?.plan_id ?? "mensal").toLowerCase();
    const payerEmail = String(payment?.payer?.email ?? "").trim() || null;
    const paymentId = String(payment?.id ?? resourceId).trim();
    const merchantOrderId = payment?.order?.id ? String(payment.order.id) : null;
    const amount = Number(payment?.transaction_amount ?? NaN);

    logWebhook("payment_loaded", {
      paymentId,
      paymentStatus,
      externalReference,
      userId,
      planId,
      merchantOrderId,
    });

    if (!externalReference) {
      return sendJson(response, 200, {
        ok: true,
        ignored: true,
        reason: "Payment without external_reference",
      });
    }

    const existing = await findTransaction({ externalReference, paymentId });
    const transactionUserId = String(existing?.user_id ?? userId).trim();
    const transactionPlanId = String(existing?.plan_id ?? planId).trim() || "mensal";

    await upsertTransactionByExternalReference(externalReference, {
      user_id: transactionUserId || null,
      plan_id: transactionPlanId,
      payment_id: paymentId,
      merchant_order_id: merchantOrderId,
      status: paymentStatus || "pending",
      status_detail: statusDetail,
      amount: Number.isFinite(amount) ? amount : null,
      payer_email: payerEmail,
      raw_payment: payment,
    });

    if (paymentStatus === "approved") {
      if (!transactionUserId) {
        throw new Error("Approved payment without user_id linkage");
      }

      await syncApprovedSubscription(transactionUserId, paymentId, transactionPlanId);
    }

    return sendJson(response, 200, {
      ok: true,
      paymentStatus,
      externalReference,
      transient: TRANSIENT_STATUSES.has(paymentStatus),
      terminalFailure: TERMINAL_FAILURE_STATUSES.has(paymentStatus),
    });
  } catch (error: any) {
    logWebhook("processing_failed", {
      error: String(error?.message ?? error),
    });

    return sendJson(response, 500, {
      error: "Mercado Pago webhook processing failed",
      details: String(error?.message ?? error),
    });
  }
}
