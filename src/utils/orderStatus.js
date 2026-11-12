const TRANSITIONS = {
  pending: ["paid", "failed", "cancelled"],
  paid: ["processing", "refunded"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  failed: [],
  cancelled: [],
  refunded: [],

  // created: ["pending"],
  // pending: ["successful", "failed"],
  // successful: ["refunded"],
  // failed: [],
  // expired: [],
  // refunded: []
};

export const ORDER_STATUSES = Object.keys(TRANSITIONS);

export const canTransition = (from, to) =>
  TRANSITIONS[from]?.includes(to) ?? false;
