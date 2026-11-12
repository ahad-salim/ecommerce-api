import { expirePendingOrders } from "../services/order.service.js";

const INTERVAL_MS = 60 * 1000;

let timer = null;
let running = false;

const tick = async () => {
  if (running) return;
  running = true;

  try {
    const cancelled = await expirePendingOrders();
    if (cancelled) console.log(`Expired ${cancelled} pending order(s)`);
  } catch (err) {
    console.error("EXPIRY_JOB_FAILED", err.message);
  } finally {
    running = false;
  }
};

export const startExpiryJob = () => {
  if (timer) return;
  timer = setInterval(tick, INTERVAL_MS);
  timer.unref(); 
  tick();
};

export const stopExpiryJob = () => {
  clearInterval(timer);
  timer = null;
};