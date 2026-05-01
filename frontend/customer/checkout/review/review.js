// ============================================================
//  CONFIG
// ============================================================

const REVIEW_USE_MOCK = true;
const REVIEW_API_BASE = "http://127.0.0.1:8000";

// cart_id — ในระบบจริงดึงจาก session/localStorage
// เปลี่ยนให้ตรงกับ cart ของ user ที่ login อยู่
const CART_ID = 1;

// ============================================================
//  MOCK DATA — field ตรงกับ GET /api/cart/carts/{cart_id}/
// ============================================================

const REVIEW_MOCK_CART = {
  cart_id: 1,
  customer: 1,
  items: [
    {
      item_id: 1,
      cart: 1,
      product: 1,
      product_name: "VOXLÖV วอกซ์เลิฟ",
      product_price: "2450.00",
      quantity: 1,
      cartitem_total: "2450.00",
    },
    {
      item_id: 2,
      cart: 1,
      product: 4,
      product_name: "TULLSTA ทูลสต้า",
      quantity: 1,
      product_price: "6590.00",
      cartitem_total: "6590.00",
    },
  ],
};

// ============================================================
//  State
// ============================================================

// เก็บ items ไว้ใน memory เพื่อให้ปรับ qty ได้โดยไม่ต้อง fetch ใหม่
let reviewCartItems = [];

// ============================================================
//  API layer
// ============================================================

async function fetchCart() {
  if (REVIEW_USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(REVIEW_MOCK_CART), 120)
    );
  }
  const res = await fetch(`${REVIEW_API_BASE}/api/cart/carts/${CART_ID}/`);
  if (!res.ok) throw new Error(`Cart fetch failed: ${res.status}`);
  return res.json();
}

async function apiUpdateQty(itemId, newQty) {
  // PATCH /api/cart/items/{item_id}/   { quantity: newQty }
  if (REVIEW_USE_MOCK) {
    return new Promise((resolve) => setTimeout(resolve, 80));
  }
  await fetch(`${REVIEW_API_BASE}/api/cart/items/${itemId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: newQty }),
  });
}

async function apiRemoveItem(itemId) {
  // DELETE /api/cart/items/{item_id}/
  if (REVIEW_USE_MOCK) {
    return new Promise((resolve) => setTimeout(resolve, 80));
  }
  await fetch(`${REVIEW_API_BASE}/api/cart/items/${itemId}/`, {
    method: "DELETE",
  });
}

// ============================================================
//  Calculations
// ============================================================

function calcTotal(items) {
  return items.reduce((sum, item) => {
    return sum + parseFloat(item.product_price) * item.quantity;
  }, 0);
}

function formatPrice(amount) {
  return parseFloat(amount).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + " THB";
}

// ============================================================
//  Renderers
// ============================================================

function getItemImage(item) {
  // เมื่อ API ส่ง image url มาให้ใช้ item.product_image แทน
  return `https://placehold.co/56x56/f0ece4/888070?text=${encodeURIComponent(item.product_name[0])}`;
}

function renderItems(items) {
  const list = document.getElementById("review-items-list");
  if (!list) return;

  if (items.length === 0) {
    list.innerHTML = `<div class="review-empty">Your cart is empty.</div>`;
    return;
  }

  list.innerHTML = items.map((item) => {
    const lineTotal = parseFloat(item.product_price) * item.quantity;
    return `
      <div class="review-item" data-item-id="${item.item_id}">
        <img
          class="review-item-img"
          src="${getItemImage(item)}"
          alt="${item.product_name}"
        />
        <div class="review-item-name">${item.product_name}</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="handleQtyChange(${item.item_id}, -1)">−</button>
          <div class="qty-display" id="qty-${item.item_id}">${item.quantity}</div>
          <button class="qty-btn" onclick="handleQtyChange(${item.item_id}, +1)">+</button>
        </div>
        <span class="review-item-unit-price">${formatPrice(item.product_price)}</span>
        <button class="review-item-remove" onclick="handleRemoveItem(${item.item_id})" aria-label="Remove">×</button>
        <div class="review-item-total" id="total-${item.item_id}">${formatPrice(lineTotal)}</div>
      </div>
    `;
  }).join("");
}

function updateSummary(items) {
  const total = calcTotal(items);

  const subtotalEl = document.getElementById("summary-subtotal");
  const btnTotalEl = document.getElementById("checkout-btn-total");
  const countEl    = document.getElementById("cart-item-count");

  if (subtotalEl) subtotalEl.textContent = formatPrice(total);
  if (btnTotalEl) btnTotalEl.textContent = formatPrice(total);
  if (countEl)    countEl.textContent    = `(${items.length})`;

  // disable checkout ถ้าตะกร้าว่าง
  const btn = document.getElementById("checkout-btn");
  if (btn) btn.disabled = items.length === 0;
}

// ============================================================
//  Actions
// ============================================================

async function handleQtyChange(itemId, delta) {
  const item = reviewCartItems.find((i) => i.item_id === itemId);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty < 1) return; // ไม่ให้ต่ำกว่า 1 (ถ้าอยากลบให้กดปุ่ม ×)

  item.quantity = newQty;

  // อัปเดต UI ทันที (optimistic update)
  const qtyEl   = document.getElementById(`qty-${itemId}`);
  const totalEl = document.getElementById(`total-${itemId}`);
  if (qtyEl)   qtyEl.textContent   = newQty;
  if (totalEl) totalEl.textContent = formatPrice(parseFloat(item.product_price) * newQty);
  updateSummary(reviewCartItems);

  // sync กับ API
  try {
    await apiUpdateQty(itemId, newQty);
  } catch (err) {
    console.error("Failed to update qty:", err);
  }
}

async function handleRemoveItem(itemId) {
  // ลบออกจาก state ก่อน (optimistic)
  reviewCartItems = reviewCartItems.filter((i) => i.item_id !== itemId);
  renderItems(reviewCartItems);
  updateSummary(reviewCartItems);

  try {
    await apiRemoveItem(itemId);
  } catch (err) {
    console.error("Failed to remove item:", err);
  }
}

function goToShipping() {
  // ส่ง cart_id ไปหน้า shipping ด้วย query string
  window.location.href =
    `/frontend/customer/checkout/shipping/shipping.html?cart_id=${CART_ID}`;
}

// ============================================================
//  Init
// ============================================================

async function initReview() {
  try {
    const cart       = await fetchCart();
    reviewCartItems  = cart.items;
    renderItems(reviewCartItems);
    updateSummary(reviewCartItems);
  } catch (err) {
    console.error("Review init failed:", err);
    const list = document.getElementById("review-items-list");
    if (list) list.innerHTML = `<div class="review-empty">Failed to load cart. Please try again.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", initReview);