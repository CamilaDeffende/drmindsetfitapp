const PLAN_DURATION_DAYS: Record<string, number> = {
  mensal: 30,
  semestral: 183,
  anual: 365,
};

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

async function upsertSubscription(userId: string, planId: string, paymentId: string, paymentStatus: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin credentials not configured");
  }

  const days = PLAN_DURATION_DAYS[planId] ?? 30;
  const period = addDaysIso(days);

  const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      status: paymentStatus === "approved" ? "active" : "free",
      plan: paymentStatus === "approved" ? "premium" : "free",
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: false,
      stripe_subscription_id: `mp:${paymentId}`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase upsert failed: ${errorBody}`);
  }
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
    const body = await readBody(request);
    const resourceId =
      body?.data?.id ??
      body?.id ??
      request.query?.id ??
      request.query?.["data.id"] ??
      null;
    const eventType = String(body?.type ?? request.query?.type ?? request.query?.topic ?? "");

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
    const userId = String(payment?.external_reference ?? payment?.metadata?.user_id ?? "").trim();
    const planId = String(payment?.metadata?.plan_id ?? "mensal").toLowerCase();

    if (!userId) {
      return sendJson(response, 200, {
        ok: true,
        ignored: true,
        reason: "Payment without external_reference/user_id",
      });
    }

    if (paymentStatus === "approved") {
      await upsertSubscription(userId, planId, String(resourceId), paymentStatus);
    }

    return sendJson(response, 200, {
      ok: true,
      paymentStatus,
      userId,
      planId,
    });
  } catch (error: any) {
    return sendJson(response, 500, {
      error: "Mercado Pago webhook processing failed",
      details: String(error?.message ?? error),
    });
  }
}
