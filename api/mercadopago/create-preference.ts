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
      external_reference: userId || undefined,
      metadata: {
        user_id: userId || null,
        plan_id: planId,
        source,
      },
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: `${appUrl}/checkout?status=success&provider=mercadopago&plan=${planId}`,
        failure: `${appUrl}/checkout?status=failure&provider=mercadopago&plan=${planId}`,
        pending: `${appUrl}/checkout?status=pending&provider=mercadopago&plan=${planId}`,
      },
      auto_return: "approved",
    };

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
      return sendJson(response, mpResponse.status, {
        error: "Mercado Pago preference creation failed",
        details: mpData,
      });
    }

    return sendJson(response, 200, {
      id: mpData.id,
      initPoint: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point,
    });
  } catch (error: any) {
    return sendJson(response, 500, {
      error: "Unexpected Mercado Pago preference error",
      details: String(error?.message ?? error),
    });
  }
}
