const REQUEST_TIMEOUT_MS = 15000;

const MIN_AMOUNT = 100;

const TRANS_ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

const isValidTransId = (value) =>
  typeof value === "string" && TRANS_ID_PATTERN.test(value);

function providerError(message, cause) {
  const error = new Error(message);
  error.statusCode = 502;
  if (cause) error.cause = cause;
  return error;
}

async function paymentRequest(path, { method = "GET", body } = {}) {
  const baseUrl = process.env.BASE_URL;
  const apiUser = process.env.API_USER;
  const apiKey = process.env.API_KEY;

  if (!baseUrl || !apiUser || !apiKey) {
    throw new Error(
      "Payment provider is not configured (BASE_URL / API_USER / API_KEY)",
    );
  }

  let response;

  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
      method,
      headers: {
        apiuser: apiUser,
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw providerError("Payment provider is unreachable", err);
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // non-JSON body; handled below
  }

  if (!response.ok) {
    const error = providerError(
      data?.message || `Fapshi request failed (${response.status})`,
    );
    error.providerStatus = response.status;
    throw error;
  }

  return data;
}

async function createPaymentLink({
  amount,
  message,
  externalId,
  userId,
  redirectUrl,
}) {
  if (!Number.isInteger(amount) || amount < MIN_AMOUNT) {
    throw new Error(`Amount must be a whole number of at least ${MIN_AMOUNT}`);
  }

  const data = await paymentRequest("/initiate-pay", {
    method: "POST",
    body: {
      amount,
      message,
      externalId: externalId ? String(externalId) : undefined,
      userId: userId ? String(userId) : undefined,
      redirectUrl,
    },
  });

  if (!data?.link || !isValidTransId(data?.transId)) {
    throw providerError("Payment provider did not return a payment link");
  }

  return { link: data.link, transId: data.transId };
}

// GET /payment-status/{transId}: the only source of truth we trust
async function getTransactionStatus(transId) {
  if (!isValidTransId(transId)) {
    throw new Error("Invalid transaction id");
  }

  return paymentRequest(`/payment-status/${encodeURIComponent(transId)}`);
}

// POST /expire-pay: makes the payment link unusable
async function expirePay(transId) {
  if (!isValidTransId(transId)) {
    throw new Error("Invalid transaction id");
  }

  return paymentRequest("/expire-pay", {
    method: "POST",
    body: { transId },
  });
}

export {
  MIN_AMOUNT,
  isValidTransId,
  createPaymentLink,
  getTransactionStatus,
  expirePay,
};
