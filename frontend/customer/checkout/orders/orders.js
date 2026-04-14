// ============================================================
//  CONFIG
// ============================================================

const ORDERS_USE_MOCK = true;
const ORDERS_API_BASE = "http://127.0.0.1:8000";

// ============================================================
//  MOCK DATA — field ตรงกับ response จาก API orders
// ============================================================

const ORDERS_MOCK = [
  {
    order_id: 10025,
    status: "Pending",   // waiting_payment | paid | shipping | delivered
    delivery_date: null,
    address: "Carnaby Street, London, W1F 9PB",
    total: "9040.00",
    items: [
      {
        item_id: 1,
        product_name: "VOXLÖV วอกซ์เลิฟ",
        product_price: "2450.00",
        quantity: 1,
        color: "Brown",
        width: 60, length: 58, height: 78,
        image: null,
      },
      {
        item_id: 2,
        product_name: "TULLSTA ทูลสต้า",
        product_price: "6590.00",
        quantity: 1,
        color: "Brown",
        width: 72, length: 70, height: 90,
        image: null,
      },
    ],
  },
];

// ============================================================
//  API layer
// ============================================================

async function fetchOrders() {
  if (ORDERS_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(ORDERS_MOCK), 120));
  }
  // GET /api/orders/   (list ของ user ที่ login อยู่)
  const res = await fetch(`${ORDERS_API_BASE}/api/orders/`);
  return res.json();
}

async function apiCancelOrder(orderId) {
  if (ORDERS_USE_MOCK) {
    return new Promise((resolve) => setTimeout(resolve, 200));
  }
  await fetch(`${ORDERS_API_BASE}/api/orders/${orderId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
}

// ============================================================
//  Helpers
// ============================================================

function formatPrice(n) {
  return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 0 }) + " THB";
}

function getItemImage(item) {
  if (item.image) return item.image;
  return `https://placehold.co/80x100/f0ece4/888070?text=${encodeURIComponent(item.product_name[0])}`;
}

const STATUS_MAP = {
  Pending:    { label: "Waiting for payment", cls: "in-process" },
  Received:   { label: "Received order",      cls: "in-process" },
  In_transit: { label: "In transit",          cls: "in-process" },
  Complete:   { label: "Complete",            cls: "complete"   },
  Cancelled:  { label: "Cancelled",           cls: "cancel"     },
};

function getStatusInfo(status) {
  return STATUS_MAP[status] ?? { label: status, cls: "" };
}

// ============================================================
//  Renderers
// ============================================================

function renderOrderProducts(items) {
  return `
    <div class="order-products">
      ${items.map((item) => `
        <div class="order-product-card">
          <img class="order-product-img" src="${getItemImage(item)}" alt="${item.product_name}" />
          <div class="order-product-info">
            <div class="order-product-name">${item.product_name}</div>
            <div class="order-product-detail">
              <span class="order-product-detail-label">Quantity:</span>
              <span class="order-product-detail-value">${item.quantity}x = ${formatPrice(parseFloat(item.product_price) * item.quantity)}</span>
            </div>
            <div class="order-product-detail">
              <span class="order-product-detail-label">Color:</span>
              <span class="order-product-detail-value">${item.color ?? "—"}</span>
            </div>
            <div class="order-product-detail">
              <span class="order-product-detail-label">Dimension:</span>
              <span class="order-product-detail-value">${item.width} cm. x ${item.length} cm. x ${item.height} cm.</span>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderOrderCard(order) {
  const status = getStatusInfo(order.status);
  const canCancel = ["Pending"].includes(order.status);

  return `
    <div class="order-card" id="order-card-${order.order_id}">
      <div class="order-card-header">
        <div class="order-id">Order ID:  ${order.order_id}</div>
        ${canCancel
          ? `<button class="cancel-order-btn" onclick="handleCancelOrder(${order.order_id})">Cancel order</button>`
          : ""}
      </div>
      <div class="order-meta">
        <div class="order-meta-row">
          <span class="order-meta-label">Status:</span>
          <span class="order-meta-value ${status.cls}">${status.label}</span>
        </div>
        <div class="order-meta-row">
          <span class="order-meta-label">Date of delivery:</span>
          <span class="order-meta-value">${order.delivery_date ?? "—"}</span>
        </div>
        <div class="order-meta-row">
          <span class="order-meta-label">Delivery to:</span>
          <span class="order-meta-value">${order.address}</span>
        </div>
        <div class="order-meta-row">
          <span class="order-meta-label bold">Total:</span>
          <span class="order-meta-value bold">${formatPrice(order.total)}</span>
        </div>
      </div>
      ${renderOrderProducts(order.items)}
    </div>
  `;
}

function renderOrders(orders) {
  const list = document.getElementById("orders-list");
  if (!list) return;

  if (orders.length === 0) {
    list.innerHTML = `<div class="review-empty">You do not have any order yet.</div>`;
    return;
  }

  list.innerHTML = orders.map(renderOrderCard).join("");
}

// ============================================================
//  Actions
// ============================================================

async function handleCancelOrder(orderId) {
  if (!confirm(`Cancel order #${orderId}?`)) return;

  try {
    await apiCancelOrder(orderId);
    // อัปเดต UI ทันที
    const card = document.getElementById(`order-card-${orderId}`);
    if (card) {
      const statusEl = card.querySelector(".order-meta-value");
      if (statusEl) { statusEl.textContent = "Cancelled"; statusEl.className = "order-meta-value"; }
      card.querySelector(".cancel-order-btn")?.remove();
    }
  } catch (err) {
    console.error("Cancel order failed:", err);
    alert("Failed to cancel order. Please try again.");
  }
}

// ============================================================
//  Init
// ============================================================

async function initOrders() {
  try {
    const orders = await fetchOrders();
    renderOrders(orders);
  } catch (err) {
    console.error("Orders init failed:", err);
    const list = document.getElementById("orders-list");
    if (list) list.innerHTML = `<div class="review-empty">Failed to load orders.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", initOrders);