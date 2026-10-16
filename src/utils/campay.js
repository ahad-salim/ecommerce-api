import jwt from "jsonwebtoken"

const REQUEST_TIMEOUT_MS = 15000;

async function campayRequest(path, { method = "GET", body } = {}) {
  const baseUrl = process.env.CAMPAY_BASE_URL;
  const token = process.env.PAYMENT_SECRET;

  if (!baseUrl || !token) {
    throw new Error("Campay is not configured (CAMPAY_BASE_URL / PAYMENT_SECRET)");
  }

  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // network failure or timeout
    const error = new Error("Payment provider is unreachable");
    error.statusCode = 502;
    error.cause = err;
    throw error;
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // non-JSON body; handled below
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Campay request failed (${response.status})`);
    error.statusCode = 502;
    error.providerStatus = response.status;
    throw error;
  }

  return data;
}

/**
 * Creates a hosted payment link. Campay's response only contains { link },
 * so the Campay transaction reference is NOT known yet: it arrives later in
 * the webhook. Link the two with externalReference (our Payment _id).
 */
async function createPaymentLink({
  amount,
  description,
  externalReference,
  redirectUrl,
}) {

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }

  const data = await campayRequest("/get_payment_link/", {
    method: "POST",
    body: {
      amount: String(amount),
      currency: "XAF",
      description,
      external_reference: String(externalReference),
      redirect_url: redirectUrl,
    },
  });

  if (!data?.link) {
    const error = new Error("Payment provider did not return a payment link");
    error.statusCode = 502;
    throw error;
  }

  return { link: data.link };
}


async function getTransactionStatus(reference) {
  return campayRequest(`/transaction/${encodeURIComponent(reference)}/`);
}

function verifyWebhookSignature(signature) {
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret || !signature || typeof signature !== "string") {
    return false;
  }

  try {
    jwt.verify(signature, secret, {
      algorithms: ["HS256", "HS384", "HS512"],
    });
    return true;
  } catch {
    return false;
  }
}

export { createPaymentLink, getTransactionStatus, verifyWebhookSignature };