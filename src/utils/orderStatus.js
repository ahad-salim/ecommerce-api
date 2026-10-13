const TRANSITIONS = {
  pending: ["paid", "failed", "cancelled"],
  paid: ["processing", "refunded"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  failed: [],
  cancelled: [],
  refunded: [],
};

export const ORDER_STATUSES = Object.keys(TRANSITIONS);

export const canTransition = (from, to) =>
  TRANSITIONS[from]?.includes(to) ?? false;
