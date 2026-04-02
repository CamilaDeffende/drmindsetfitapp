const PLAN_CONFIG = {
  mensal: {
    title: "MindsetFit Premium Mensal",
    unitPrice: 49.9,
    description: "Acesso premium por 30 dias.",
  },
  semestral: {
    title: "MindsetFit Premium Semestral",
    unitPrice: 249.9,
    description: "Acesso premium por 6 meses.",
  },
  anual: {
    title: "MindsetFit Premium Anual",
    unitPrice: 399.9,
    description: "Acesso premium por 12 meses.",
  },
} as const;

type PlanId = keyof typeof PLAN_CONFIG;

type JsonRecord = Record<string, unknown>;

function getAppUrl(request: any): string {
  const configured = process.env.VITE_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const protocol = request.headers["x-forwarded-proto"] ?? "https";
  const host = request.headers["x-forwarded-host"] ?? request.headers.host ?? "localhost:3000";
  return `${protocol}://${host}`;
}

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
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  return response;
}

async function createPendingTransaction(input: {
  userId: string;
  planId: PlanId;
  source: string;
  externalReference: string;
  payerEmail: string;
}) {
  const response = await supabaseAdminRequest("payment_transactions", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: input.userId,
      plan_id: input.planId,
      provider: "mercadopago",
      external_reference: input.externalReference,
      status: "pending",
      status_detail: `checkout_created:${input.source || "premium"}`,
      payer_email: input.payerEmail || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase insert payment_transactions failed: ${await response.text()}`);
  }

  return response.json();
}

async function updateTransactionByExternalReference(externalReference: string, payload: JsonRecord) {
  const response = await supabaseAdminRequest(
    `payment_transactions?external_reference=eq.${encodeURIComponent(externalReference)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        ...payload,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase update payment_transactions failed: ${await response.text()}`);
  }

  return response.json();
}

function logCreatePreference(stage: string, payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      scope: "mercadopago:create-preference",
      stage,
      ...payload,
    }),
  );
}

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return sendJson(response, 500, {
      error: "Mercado Pago access token not configured",
    });
  }

  try {
    const body = await readBody(request);
    const rawPlanId = String(body?.planId ?? "mensal").toLowerCase();
    const planId: PlanId = rawPlanId === "anual" || rawPlanId === "semestral" ? rawPlanId : "mensal";
    const plan = PLAN_CONFIG[planId];
    const appUrl = getAppUrl(request);

    const payerEmail = String(body?.email ?? "").trim();
    const payerName = String(body?.name ?? "").trim();
    const source = String(body?.source ?? "premium").trim();
    const userId = String(body?.userId ?? "").trim();

    if (!userId) {
      return sendJson(response, 400, { error: "Missing userId" });
    }

    const externalReference = `mf_mp_${crypto.randomUUID()}`;

    logCreatePreference("request_received", {
      userId,
      planId,
      source,
      hasPayerEmail: Boolean(payerEmail),
    });

    await createPendingTransaction({
      userId,
      planId,
      source,
      externalReference,
      payerEmail,
    });

    const preferencePayload = {
      items: [
        {
          id: `mindsetfit-${planId}`,
          title: plan.title,
          description: plan.description,
          quantity: 1,
          currency_id: "BRL",
          unit_price: plan.unitPrice,
        },
      ],
      payer: {
        ...(payerEmail ? { email: payerEmail } : {}),
        ...(payerName ? { name: payerName } : {}),
      },
      external_reference: externalReference,
      metadata: {
        user_id: userId,
        plan_id: planId,
        source,
        external_reference: externalReference,
      },
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: `${appUrl}/checkout?status=success&provider=mercadopago&plan=${planId}`,
        failure: `${appUrl}/checkout?status=failure&provider=mercadopago&plan=${planId}`,
        pending: `${appUrl}/checkout?status=pending&provider=mercadopago&plan=${planId}`,
      },
      auto_return: "approved",
    };

    logCreatePreference("creating_preference", {
      userId,
      planId,
      externalReference,
      notificationUrl: preferencePayload.notification_url,
    });

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpData = await mpResponse.json();
    if (!mpResponse.ok) {
      await updateTransactionByExternalReference(externalReference, {
        status: "error",
        status_detail: String(mpData?.message ?? "preference_creation_failed"),
        raw_preference: mpData,
      });

      logCreatePreference("preference_failed", {
        userId,
        planId,
        externalReference,
        responseStatus: mpResponse.status,
        details: mpData,
      });

      return sendJson(response, mpResponse.status, {
        error: "Mercado Pago preference creation failed",
        details: mpData,
      });
    }

    await updateTransactionByExternalReference(externalReference, {
      preference_id: String(mpData?.id ?? ""),
      raw_preference: mpData,
    });

    logCreatePreference("preference_created", {
      userId,
      planId,
      externalReference,
      preferenceId: mpData?.id ?? null,
      hasInitPoint: Boolean(mpData?.init_point),
    });

    return sendJson(response, 200, {
      id: mpData.id,
      externalReference,
      preferenceId: mpData.id,
      initPoint: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point,
    });
  } catch (error: any) {
    logCreatePreference("unexpected_error", {
      error: String(error?.message ?? error),
    });

    return sendJson(response, 500, {
      error: "Unexpected Mercado Pago preference error",
      details: String(error?.message ?? error),
    });
  }
}
