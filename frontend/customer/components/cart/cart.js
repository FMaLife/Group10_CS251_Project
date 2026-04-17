// ============================================================
//  MOCK DATA — แก้ตรงนี้ หรือเปลี่ยน mockFetch เป็น fetch จริง
// ============================================================

const CART_MOCK_DB = {
  items: [
    {
      id: 1,
      name: "KRYLBO - Chair, Tonerud dark beige",
      image: "https://placehold.co/80x80/e8e0d4/7a7060?text=Chair",
      price: 51.80,
      qty: 2,
    },
  ],
};

// ============================================================
//  mockFetch
//  เปลี่ยนเป็น fetch จริงได้เลย เช่น:
//  async function fetchCart() { return fetch("/api/cart/items").then(r=>r.json()); }
// ============================================================

function cartMockFetch(endpoint) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (endpoint === "/api/cart/items") resolve({ data: CART_MOCK_DB.items });
      else resolve({ data: [] });
    }, 100);
  });
}

// ============================================================
//  State
// ============================================================

let cartItems  = [];
let cartIsOpen = false;

// ============================================================
//  API calls
// ============================================================

async function fetchCartItems() {
  const res = await cartMockFetch("/api/cart/items");
  return res.data;
}

async function removeCartItem(itemId) {
  // mock: กรอง item ออก — เปลี่ยนเป็น DELETE /api/cart/items/:id ทีหลัง
  return new Promise((resolve) => {
    setTimeout(() => {
      CART_MOCK_DB.items = CART_MOCK_DB.items.filter((i) => i.id !== itemId);
      resolve({ success: true });
    }, 80);
  });
}

// ============================================================
//  Calculations
// ============================================================

function calcSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function formatPrice(amount) {
  return amount.toFixed(2) + " THB";
}

// ============================================================
//  Renderers
// ============================================================

function renderCartEmpty() {
  return `
    <div class="cart-empty">
      <div class="cart-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </div>
      <button class="cart-show-product-btn" onclick="closeCart(); window.location.href='home.html'">
        Show Product
      </button>
    </div>
  `;
}

function renderCartItem(item) {
  return `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-qty-price">
          <span class="cart-item-qty">${item.qty}×</span>
          <span class="cart-item-unit-price">${formatPrice(item.price)}</span>
          <span class="cart-item-total-price">${formatPrice(item.price * item.qty)}</span>
        </div>
      </div>
      <button class="cart-item-remove" onclick="handleRemoveItem(${item.id})" aria-label="Remove item">×</button>
    </div>
  `;
}

function renderCartWithItems(items) {
  const subtotal = calcSubtotal(items);
  return `
    <div class="cart-items-list">
      ${items.map(renderCartItem).join("")}
    </div>
    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="cart-summary-row cart-total-row">
        <span>TOTAL</span>
        <span class="cart-total-amount">${formatPrice(subtotal)}</span>
      </div>
    </div>
    <div class="cart-actions">
      <button class="cart-checkout-btn" onclick="window.location.href='/frontend/customer/checkout/review/review.html'">
        Checkout
      </button>
      <p class="cart-payment-note">MAKE PAYMENT BY SCANNING THE QR CODE.</p>
    </div>
  `;
}

function renderCartContent(items) {
  const body = document.getElementById("cart-body");
  if (!body) return;
  body.innerHTML = items.length === 0 ? renderCartEmpty() : renderCartWithItems(items);
}

function updateCartHeader(items) {
  const countEl = document.getElementById("cart-count");
  if (countEl) countEl.textContent = `(${items.length})`;
}

// ============================================================
//  Open / Close
// ============================================================

function openCart() {
  cartIsOpen = true;
  document.getElementById("cart-overlay")?.classList.add("open");
  document.getElementById("cart-backdrop")?.classList.add("open");
  document.body.style.overflow = "hidden";

  loadCartContent();
}

function closeCart() {
  cartIsOpen = false;
  document.getElementById("cart-overlay")?.classList.remove("open");
  document.getElementById("cart-backdrop")?.classList.remove("open");
  document.body.style.overflow = "";
}

// ============================================================
//  Actions
// ============================================================

async function loadCartContent() {
  const body = document.getElementById("cart-body");
  if (body) body.innerHTML = `<div class="cart-loading">Loading...</div>`;

  try {
    cartItems = await fetchCartItems();
    renderCartContent(cartItems);
    updateCartHeader(cartItems);
  } catch (err) {
    console.error("Failed to load cart:", err);
  }
}

async function handleRemoveItem(itemId) {
  try {
    await removeCartItem(itemId);
    cartItems = cartItems.filter((i) => i.id !== itemId);
    renderCartContent(cartItems);
    updateCartHeader(cartItems);

    // อัปเดต badge บน navbar ด้วย
    const badge = document.getElementById("cart-badge");
    if (badge) {
      badge.textContent   = cartItems.length;
      badge.style.display = cartItems.length > 0 ? "flex" : "none";
    }
  } catch (err) {
    console.error("Failed to remove item:", err);
  }
}

// ============================================================
//  Init — inject HTML แล้ว bind events
// ============================================================

function initCart() {
  // inject cart HTML เข้า body ถ้ายังไม่มี
  if (!document.getElementById("cart-overlay")) {
    document.body.insertAdjacentHTML("beforeend", buildCartHTML());
  }

  // ฟัง event จาก navbar
  document.addEventListener("navbar:openCart", openCart);

  // กด backdrop → ปิด
  document.getElementById("cart-backdrop")?.addEventListener("click", closeCart);
}

function buildCartHTML() {
  return `
    <div id="cart-backdrop" class="cart-backdrop"></div>
    <div id="cart-overlay" class="cart-overlay" role="dialog" aria-label="Shopping cart" aria-modal="true">
      <div class="cart-header">
        <h2 class="cart-title">Your Cart</h2>
        <div class="cart-header-right">
          <span id="cart-count" class="cart-count">(0)</span>
          <button class="cart-close-btn" onclick="closeCart()" aria-label="Close cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="cart-body" class="cart-body"></div>
    </div>
  `;
}

// auto-init เมื่อ DOM พร้อม
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCart);
} else {
  initCart();
}