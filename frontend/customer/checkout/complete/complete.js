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

function calcTotal(items) {
  return items.reduce((s, i) => s + parseFloat(i.product_price) * i.quantity, 0);
}

function formatPrice(n) {
  return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 0 }) + " THB";
}

function getItemImage(item) {
  return `https://placehold.co/52x52/f0ece4/888070?text=${encodeURIComponent(item.product_name[0])}`;
}

// ============================================================
//  Renderers
// ============================================================

function renderCompleteStatus(status) {
  const el = document.getElementById("complete-status");
  if (!el) return;

  if (status === "paid") {
    el.className = "complete-status paid";
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
          <p>${item.quantity}x<p>
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
  renderCompleteStatus(PAYMENT_STATUS);

  try {
    const order = await fetchCompleteOrder();
    renderCompleteItems(order.details);
    renderCompleteSummary(order);
  } catch (err) {
    console.error("Complete init failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", initComplete);