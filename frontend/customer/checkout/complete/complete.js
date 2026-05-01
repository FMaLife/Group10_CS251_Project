// ============================================================
//  CONFIG
// ============================================================

const COMPLETE_USE_MOCK = true;
const COMPLETE_API_BASE = "http://127.0.0.1:8000";

const completeParams  = new URLSearchParams(window.location.search);
const COMPLETE_ORDER_ID  = completeParams.get("order_id") || null;
const PAYMENT_STATUS     = completeParams.get("payment")  || "pending"; // paid | pending

// ============================================================
//  MOCK DATA — field ตรงกับ GET /api/orders/saleorders/{order_id}/
// ============================================================

const COMPLETE_MOCK_ORDER = {
  order_id: 1,
  total_amount: "9040.00",
  address: "123, Sukhumvit, Khlong Toei, Bangkok, 10110",
  details: [
    { line_number: 1, product_name: "VOXLÖV วอกซ์เลิฟ",  product_price: "2450.00", quantity: 1 },
    { line_number: 2, product_name: "TULLSTA ทูลสต้า",      product_price: "6590.00", quantity: 1 },
  ],
  payment: {
    ref_number: "PAY000001",
    order: 1,
    locked_amount: "9040.00",
    payment_status: "Pending",       // ← "Pending" | "Paid" (ตัว P ใหญ่ตาม API จริง)
    payment_timestamp: null,
  },
};

// ============================================================
//  API layer
// ============================================================

async function fetchCompleteOrder() {
  if (COMPLETE_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(COMPLETE_MOCK_ORDER), 100));
  }
  const res = await fetch(`${COMPLETE_API_BASE}/api/orders/saleorders/${COMPLETE_ORDER_ID}/`);
  return res.json();
}

// ============================================================
//  Helpers
// ============================================================

function formatPrice(n) {
  return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 0 }) + " THB";
}

// ใช้ image จาก API ถ้ามี มิฉะนั้นใช้ placeholder
function getItemImage(item) {
  if (item.image) return item.image;
  return `https://placehold.co/52x52/f0ece4/888070?text=${encodeURIComponent(item.product_name[0])}`;
}

// ============================================================
//  Renderers
// ============================================================

// ตรวจจาก order.payment.payment_status
// API ส่ง "Pending" (P ใหญ่) สำหรับยังไม่จ่าย และ "Paid" สำหรับจ่ายแล้ว
function renderCompleteStatus(paymentStatus) {
  const el = document.getElementById("complete-status");
  if (!el) return;

  const isPaid = paymentStatus?.toLowerCase() === "paid";

  if (isPaid) {
    el.className = "complete-status paid";
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" fill="#4a8c3a" stroke="none"/>
        <polyline points="8 12 11 15 16 9" stroke="#fff" stroke-width="2.2"/>
      </svg>
      Paid`;
  } else {
    el.className = "complete-status unpaid";
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#c8a030" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Waiting for payment`;
  }
}

// ใช้ order.items[] — fields: product_name, product_price, quantity, image
function renderCompleteItems(items) {
  const list = document.getElementById("complete-items-list");
  if (!list) return;

  list.innerHTML = items.map((item) => {
    const lineTotal = parseFloat(item.product_price) * item.quantity;
    return `
      <div class="complete-item">
        <img class="complete-item-img" src="${getItemImage(item)}" alt="${item.product_name}" />
        <div class="complete-item-name">${item.product_name}</div>
        <div class="complete-item-qty">
          <p>${item.quantity}x</p>
          <span>${formatPrice(item.product_price)}</span>
        </div>
        <div class="complete-item-total">${formatPrice(lineTotal)}</div>
      </div>
    `;
  }).join("");
}

function renderCompleteSummary(order) {
  const fmt = formatPrice(order.total_amount);

  document.getElementById("complete-total").textContent  = fmt;
  document.getElementById("meta-subtotal").textContent   = fmt;
  document.getElementById("meta-total").textContent      = fmt;
  document.getElementById("meta-address").textContent    = order.address || "—";
}

// ============================================================
//  Init
// ============================================================

async function initComplete() {
  if (!COMPLETE_ORDER_ID) {
    renderError("Order not found.");
    return;
  }

  try {
    const order = await fetchCompleteOrder();
    renderCompleteItems(order.details);
    renderCompleteSummary(order);
  } catch (err) {
    console.error("Complete init failed:", err);
    if (err.status === 404) {
      renderError("Order not found. Please check your order history.");
    } else {
      renderError("Failed to load order details. Please try again.");
    }
  }
}

document.addEventListener("DOMContentLoaded", initComplete);

// ============================================================
//  MOCK DATA — field ตรงกับ GET /api/orders/saleorders/{order_id}/
// ============================================================

const COMPLETE_MOCK_ORDER = {
  order_status: "Received",          // "Received" = จ่ายแล้ว | "Pending" = ยังไม่จ่าย
  order_total_amount: "9040.00",
  address: "12/4, Sukhumvit, House, Khlong Toei, Khlong Toei, Bangkok, 10110",
  payment: {
    payment_status: "paid",          // "paid" | "pending"
  },
  details: [
    {
      product_name:  "VOXLÖV วอกซ์เลิฟ",
      product_price: "2450.00",
      quantity: 2,
      image: null,
    },
    {
      product_name:  "VOXLÖV วอกซ์เลิฟ",
      product_price: "2450.00",
      quantity: 2,
      image: null,
    },
  ],
};

// ============================================================
//  API layer
// ============================================================

// GET /api/orders/saleorders/{order_id}/
// → 200 { order_status, order_total_amount, address, payment: { payment_status }, details: [...] }
// → 404 order_id ไม่มีในระบบ
async function fetchOrderDetail(orderId) {
  if (COMPLETE_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(COMPLETE_MOCK_ORDER), 120));
  }
  const res = await fetch(`${COMPLETE_API_BASE}/api/orders/saleorders/${orderId}/`);
  if (res.status === 404) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  if (!res.ok) throw new Error(`Order fetch failed: ${res.status}`);
  return res.json();
}

// ============================================================
//  Helpers
// ============================================================

function formatPrice(n) {
  return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 0 }) + " THB";
}

// ใช้ image จาก API ถ้ามี มิฉะนั้นใช้ placeholder
function getItemImage(item) {
  if (item.image) return item.image;
  return `https://placehold.co/52x52/f0ece4/888070?text=${encodeURIComponent(item.product_name[0])}`;
}

// ============================================================
//  Renderers
// ============================================================

// ใช้ order.payment.payment_status เพื่อตรวจว่าจ่ายแล้วหรือยัง
function renderCompleteStatus(paymentStatus) {
  const el = document.getElementById("complete-status");
  if (!el) return;

  if (paymentStatus === "paid") {
    el.className = "complete-status paid";
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" fill="#4a8c3a" stroke="none"/>
        <polyline points="8 12 11 15 16 9" stroke="#fff" stroke-width="2.2"/>
      </svg>
      Paid`;
  } else {
    el.className = "complete-status unpaid";
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#c8a030" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Waiting for payment`;
  }
}

// ใช้ order.details[] — fields: product_name, product_price, quantity, image
function renderCompleteItems(details) {
  const list = document.getElementById("complete-items-list");
  if (!list) return;

  list.innerHTML = details.map((item) => {
    const lineTotal = parseFloat(item.product_price) * item.quantity;
    return `
      <div class="complete-item">
        <img class="complete-item-img" src="${getItemImage(item)}" alt="${item.product_name}" />
        <div class="complete-item-name">${item.product_name}</div>
        <div class="complete-item-qty">
          <p>${item.quantity}x</p>
          <span>${formatPrice(item.product_price)}</span>
        </div>
        <div class="complete-item-total">${formatPrice(lineTotal)}</div>
      </div>
    `;
  }).join("");
}

// ใช้ order.order_total_amount และ order.address จาก response
function renderCompleteSummary(order) {
  const fmt = formatPrice(order.order_total_amount);

  document.getElementById("complete-total").textContent = fmt;
  document.getElementById("meta-subtotal").textContent  = fmt;
  document.getElementById("meta-total").textContent     = fmt;
  document.getElementById("meta-address").textContent   = order.address || "—";
}

function renderError(msg) {
  const main = document.querySelector(".complete-section");
  if (main) main.innerHTML = `<div class="review-empty" style="padding:2rem 0;">${msg}</div>`;
}

// ============================================================
//  Init
// ============================================================

async function initComplete() {
  if (!COMPLETE_ORDER_ID) {
    renderError("Order not found.");
    return;
  }

  try {
    const order = await fetchOrderDetail(COMPLETE_ORDER_ID);

    // ใช้ order.payment.payment_status ตรวจสถานะการจ่ายเงิน
    renderCompleteStatus(order.payment?.payment_status ?? "pending");
    renderCompleteItems(order.details);
    renderCompleteSummary(order);

  } catch (err) {
    console.error("Complete init failed:", err);
    if (err.status === 404) {
      renderError("Order not found. Please check your order history.");
    } else {
      renderError("Failed to load order details. Please try again.");
    }
  }
}

document.addEventListener("DOMContentLoaded", initComplete);