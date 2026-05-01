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
    order_status: "Pending",   // Pending | Received | In transit | Cancelled
    delivery_date: null,
    address: "Carnaby Street, London, W1F 9PB",
    total_amount: "9040.00",
    details: [
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

// customer_id — ในระบบจริงดึงจาก session/localStorage
const ORDERS_CUSTOMER_ID = 1;

async function fetchOrders() {
  if (ORDERS_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(ORDERS_MOCK), 120));
  }
  // GET /api/orders/saleorders/?customer_id=<id>
  const res = await fetch(`${ORDERS_API_BASE}/api/orders/saleorders/?customer_id=${ORDERS_CUSTOMER_ID}`);
  return res.json();
}

async function apiCancelOrder(orderId) {
  if (ORDERS_USE_MOCK) {
    return new Promise((resolve) => setTimeout(resolve, 200));
  }
  await fetch(`${ORDERS_API_BASE}/api/orders/saleorders/${orderId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_status: "Cancelled" }),
  });
}

async function apiMarkPaid(orderId) {
  if (ORDERS_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve({ order_status: "Received" }), 200));
  }
  // PATCH /api/orders/saleorders/{order_id}/   { payment_status: "paid" }
  // → 200 { order_status: "Received" }
  // → 500 Server error
  const res = await fetch(`${ORDERS_API_BASE}/api/orders/saleorders/${orderId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_status: "paid" }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error("Mark paid failed");
    err.status = res.status;
    throw err;
  }
  return data;
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

// status from response: Pending | Received | In transit | Cancelled
const STATUS_MAP = {
  Pending:      { label: "Waiting for payment", cls: "pending"    },
  Received:     { label: "Received order",      cls: "in-process" },
  "In transit": { label: "In transit",          cls: "in-process" },
  Cancelled:    { label: "Cancelled",           cls: "cancel"     },
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
  const status = getStatusInfo(order.order_status);
  const canCancel = ["Pending"].includes(order.order_status);

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
          ${order.order_status === "Pending"
            /* Pending → แสดงเป็นปุ่มกดได้ เพื่อเปิด QR overlay */
            ? `<button
                class="order-meta-value order-status-value ${status.cls}"
                style="background:none;border:none;cursor:pointer;font-family:inherit;font-size:inherit;text-decoration:underline;text-underline-offset:3px;padding:0;"
                onclick="openOrdersQr(${order.order_id}, '${order.total_amount}')"
               >${status.label}</button>`
            /* status อื่น → แสดงเป็น span ธรรมดา */
            : `<span class="order-meta-value order-status-value ${status.cls}">${status.label}</span>`
          }
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
          <span class="order-meta-label">Total:</span>
          <span class="order-meta-value bold">${formatPrice(order.total_amount)}</span>
        </div>
      </div>
      ${renderOrderProducts(order.details)}
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

// เก็บ order_id ที่กำลังรอชำระไว้ เพื่อใช้ตอนกด Complete
let pendingPaymentOrderId = null;
 
function openOrdersQr(orderId, total) {
  pendingPaymentOrderId = orderId;
  document.getElementById("orders-qr-amount").textContent = formatPrice(total);
  document.getElementById("qr-backdrop")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function handleOrdersQrClose() {
  // กด "Not ready" — ปิด overlay กลับหน้า Orders (Payment = Waiting, ไม่ navigate ไปไหน)
  document.getElementById("qr-backdrop")?.classList.remove("open");
  document.body.style.overflow = "";
  pendingPaymentOrderId = null;
}

async function handleOrdersQrComplete() {
  // กด "Complete" — เรียก PATCH ก่อน ถ้าสำเร็จ navigate ไปหน้า complete
  // ถ้า 500 แสดง error บนหน้า Orders โดยไม่ navigate
  const orderId     = pendingPaymentOrderId;
  const completeBtn = document.querySelector(".qr-btn-complete");
  const laterBtn    = document.querySelector(".qr-btn-later");

  if (completeBtn) { completeBtn.disabled = true; completeBtn.textContent = "Processing..."; }
  if (laterBtn)    laterBtn.disabled = true;

  try {
    await apiMarkPaid(orderId);

    document.getElementById("qr-backdrop")?.classList.remove("open");
    document.body.style.overflow = "";
    pendingPaymentOrderId = null;

    // navigate ไปหน้า complete พร้อมส่ง order_id
    window.location.href =
      `/frontend/customer/checkout/complete/complete.html?order_id=${orderId}&payment=paid`;

  } catch (err) {
    console.error("Mark paid failed:", err);
    // คืนปุ่ม และแสดง error notification บนหน้า Orders (overlay ยังเปิดอยู่)
    if (completeBtn) { completeBtn.disabled = false; completeBtn.textContent = "Complete"; }
    if (laterBtn)    laterBtn.disabled = false;

    // แสดง error ใน notification bar (ถ้ามี) หรือ alert เป็น fallback
    const bar  = document.getElementById("notification-bar");
    const text = document.getElementById("notification-text");
    if (bar && text) {
      text.textContent = "Payment could not be confirmed. Please try again.";
      bar.classList.remove("hidden");
    } else {
      alert("Payment could not be confirmed. Please try again.");
    }
  }
}

// อัปเดต status badge ใน card โดยไม่ต้อง re-render ทั้งหน้า
function updateOrderStatusUI(orderId, newStatus) {
  const card = document.getElementById(`order-card-${orderId}`);
  if (!card) return;
 
  const statusInfo = getStatusInfo(newStatus);
  const statusEl   = card.querySelector(".order-status-value");
  if (statusEl) {
    // เปลี่ยนจาก <button> กลับเป็น <span> ธรรมดาเพราะชำระแล้ว
    const span = document.createElement("span");
    span.className   = `order-meta-value ${statusInfo.cls}`;
    span.textContent = statusInfo.label;
    statusEl.replaceWith(span);
  }
 
  if (newStatus !== "Pending") {
    card.querySelector(".cancel-order-btn")?.remove();
  }
}

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