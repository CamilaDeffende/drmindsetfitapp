export type PaymentProvider = "stripe" | "mercadopago" | "manual";

const env = import.meta.env as ImportMetaEnv & {
  VITE_PAYMENT_PROVIDER?: string;
  VITE_STRIPE_PUBLIC_KEY?: string;
  VITE_SUBSCRIPTION_PRICE_ID?: string;
  VITE_MERCADO_PAGO_PUBLIC_KEY?: string;
};

function normalizeProvider(value: unknown): PaymentProvider {
  const raw = String(value ?? "").trim().toLowerCase();

  if (raw === "stripe") return "stripe";
  if (raw === "mercadopago" || raw === "mercado_pago" || raw === "mp") {
    return "mercadopago";
  }

  return "manual";
}

export function readPaymentProvider(): PaymentProvider {
  return normalizeProvider(env.VITE_PAYMENT_PROVIDER);
}

export function getPaymentProviderLabel(provider = readPaymentProvider()): string {
  if (provider === "stripe") return "Stripe";
  if (provider === "mercadopago") return "Mercado Pago";
  return "pagamento manual";
}

export function hasStripeCheckoutConfig(): boolean {
  return Boolean(env.VITE_STRIPE_PUBLIC_KEY && env.VITE_SUBSCRIPTION_PRICE_ID);
}

export function hasMercadoPagoFrontendConfig(): boolean {
  return Boolean(env.VITE_MERCADO_PAGO_PUBLIC_KEY);
}

export function hasConfiguredPaymentProvider(): boolean {
  const provider = readPaymentProvider();

  if (provider === "stripe") return hasStripeCheckoutConfig();
  if (provider === "mercadopago") return hasMercadoPagoFrontendConfig();

  return false;
}
