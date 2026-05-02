// ============================================================
//  CONFIG
// ============================================================

// URL ของ backend API
const CART_API_BASE = "http://127.0.0.1:8000";

function resolveCartImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${CART_API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

// ============================================================
//  State
// ============================================================

// cart id ปัจจุบัน
let cartId = null;

// รายการสินค้าใน cart
let cartItems = [];

// สถานะ cart overlay เปิด/ปิด
let cartIsOpen = false;

// สถานะ login
let isLoggedIn = false;

// ============================================================
//  Helpers
// ============================================================

// ดึงข้อมูล customer จาก localStorage
function getCustomer() {
  try {
    const raw = localStorage.getItem("customer");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// redirect ไปหน้า login
function redirectToLogin() {
  window.location.href =
    "/frontend/customer/auth/login/log-in.html";
}

// ============================================================
//  API calls
// ============================================================

/**
 * โหลดข้อมูล cart จาก backend
 *
 * use case:
 * - ยังไม่ได้ login → redirect login
 * - cart ว่าง → return []
 * - cart มีสินค้า → return array items
 */
async function fetchCartItems() {

  // ดึง customer จาก localStorage
  const customer = getCustomer();

  // ยังไม่ได้ login
  if (!customer?.customerID) {
    isLoggedIn = false;
    return [];
  }

  isLoggedIn = true;

  // เรียก API cart
  const res = await fetch(
    `${CART_API_BASE}/api/cart/?customer=${customer.customerID}`,
    { credentials: "include" }
  );

  // API error
  if (!res.ok) {
    throw new Error(`Cart API error: ${res.status}`);
  }

  // response จาก backend
  const data = await res.json();

  // เก็บ cart id
  cartId = data.cart_id ?? null;

  // แปลง response ให้ frontend ใช้งานง่าย
  return (data.items || []).map((item) => ({
    id: item.item_id,
    name: item.product_name,
    image: item.image,
    price: parseFloat(item.product_price),
    qty: item.quantity,
    stock: item.stock_quantity ?? 9999,
  }));
}

// อัปเดต quantity ของสินค้า ใช้ตอนกด + / -
async function updateCartItemQuantity(itemId, quantity) {
  const res = await fetch(`${CART_API_BASE}/api/cart/items/${itemId}/`,{
      method: "PATCH",
      credentials: "include",
      headers: {"Content-Type": "application/json",},
      body: JSON.stringify({quantity,}),
    }
  );

  // update ไม่สำเร็จ
  if (!res.ok) {
    throw new Error(`Update quantity failed: ${res.status}`);
  }

  return res.json();
}

// ลบสินค้าออกจาก cart ใช้ตอนกดปุ่ม ×
async function removeCartItem(itemId) {
  const res = await fetch(`${CART_API_BASE}/api/cart/items/${itemId}/`,{
      method: "DELETE",
      credentials: "include",
    }
  );

  // DELETE ปกติจะ return 204
  if (!res.ok && res.status !== 204) {
    throw new Error(`Remove item failed: ${res.status}`);
  }

  return true;
}

// ============================================================
//  Calculations
// ============================================================

// คำนวณ subtotal ของ cart
function calcSubtotal(items) {
  return items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
}

// format ราคาให้เป็น xx.xx THB
function formatPrice(amount) {
  return amount.toFixed(2) + " THB";
}

// ============================================================
//  Renderers
// ============================================================

// render ตอน cart ว่าง
function renderCartEmpty() {
  return `
    <div class="cart-empty">
      <div class="cart-empty-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </div>
      <div class="cart-empty-message">
        Cart is empty
      </div>
      <button
        class="cart-show-product-btn"
        onclick="closeCart(); window.location.href='/frontend/customer/home/home.html'">
        Show Product
      </button>
    </div>
  `;
}

function renderGuestCart() {
  return `
    <div class="cart-empty">
      <div class="cart-empty-message">
        Please log in before shopping
      </div>
      <button class="cart-show-product-btn" onclick="window.location.href='/frontend/customer/auth/login/log-in.html'">
        Log In
      </button>
    </div>
  `;
}

// render card ของสินค้าแต่ละชิ้น
function renderCartItem(item) {
  const atMax = item.qty >= item.stock;
  return `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-item-img" src="${resolveCartImageUrl(item.image) || 'https://placehold.co/80x80/e8e4dc/888070?text=IMG'}" alt="${item.name}"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="handleDecreaseQty(${item.id})">−</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="qty-btn" onclick="handleIncreaseQty(${item.id})" ${atMax ? 'disabled' : ''}>+</button>
        </div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
      </div>
      <button class="cart-item-remove" onclick="handleRemoveItem(${item.id})" aria-label="Remove item">×</button>
    </div>
  `;
}

// render cart ที่มีสินค้า
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
        <span class="cart-total-amount">
          ${formatPrice(subtotal)}
        </span>
      </div>
    </div>
    <div class="cart-actions">
      <!-- ปุ่ม checkout -->
      <button class="cart-checkout-btn" onclick="goToCheckout()">
        Checkout
      </button>
      <p class="cart-payment-note">
        MAKE PAYMENT BY SCANNING THE QR CODE.
      </p>
    </div>
  `;
}

// render เนื้อหาทั้งหมดใน cart
function renderCartContent(items) {
  const body = document.getElementById("cart-body");
  if (!body) return;
  body.innerHTML =
    items.length === 0
      ? renderCartEmpty()
      : renderCartWithItems(items);
}

// อัปเดตจำนวน item บน header ของ cart
function updateCartHeader(items) {
  const countEl = document.getElementById("cart-count");
  if (!countEl) return;
  countEl.textContent = `(${items.length})`;
}

// อัปเดต badge จำนวนสินค้า ที่ navbar icon
function updateNavbarBadge() {
  const badge = document.getElementById("cart-qty-badge");
  if (!badge) return;
  badge.textContent = String(cartItems.length);
}

// ============================================================
//  Open / Close
// ============================================================

// เปิด cart overlay
function openCart() {
  cartIsOpen = true;
  document.getElementById("cart-overlay")
    ?.classList.add("open");
  document.getElementById("cart-backdrop")
    ?.classList.add("open");
  // กัน scroll body
  document.body.style.overflow = "hidden";
  // โหลดข้อมูล cart
  loadCartContent();
}

// ปิด cart overlay
function closeCart() {
  cartIsOpen = false;
  document.getElementById("cart-overlay")
    ?.classList.remove("open");
  document.getElementById("cart-backdrop")
    ?.classList.remove("open");
  document.body.style.overflow = "";
}

// ============================================================
//  Actions
// ============================================================

// โหลดข้อมูล cart แล้ว render
async function loadCartContent() {
  const body = document.getElementById("cart-body");
  // loading state
  if (body) {
    body.innerHTML =
      `<div class="cart-loading">Loading...</div>`;
  }
  try {
    // โหลดสินค้า
    cartItems = await fetchCartItems();
    // render
    renderCartContent(cartItems);
    // update จำนวนสินค้า
    updateCartHeader(cartItems);
    // update badge navbar
    updateNavbarBadge();
  } catch (err) {
    console.error("Failed to load cart:", err);
  }
}

// เพิ่มจำนวนสินค้า
async function handleIncreaseQty(itemId) {
  try {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;
    if (item.qty >= item.stock) return;
    const newQty = item.qty + 1;
    await updateCartItemQuantity(itemId, newQty);
    item.qty = newQty;
    renderCartContent(cartItems);
  } catch (err) {
    console.error("Increase qty failed:", err);
  }
}

// ลดจำนวนสินค้า
async function handleDecreaseQty(itemId) {
  try {
    const item = cartItems.find(
      (i) => i.id === itemId
    );
    if (!item) return;
    // กัน qty ต่ำกว่า 1
    if (item.qty <= 1) {
      return;
    }
    const newQty = item.qty - 1;
    // เรียก API
    await updateCartItemQuantity(
      itemId,
      newQty
    );
    // update local state
    item.qty = newQty;
    // render ใหม่
    renderCartContent(cartItems);
  } catch (err) {
    console.error("Decrease qty failed:", err);
  }
}

// เพิ่มสินค้าเข้า cart
async function addCartItem(productId, qty) {
  const customer = getCustomer();
  if (!customer?.customerID) { redirectToLogin(); return; }

  // ต้องมี cartId ก่อน — ถ้ายังไม่มีให้ fetch
  if (!cartId) {
    const res = await fetch(`${CART_API_BASE}/api/cart/?customer=${customer.customerID}`, { credentials: "include" });
    if (!res.ok) throw new Error(`Cart fetch failed: ${res.status}`);
    const data = await res.json();
    cartId = data.cart_id;
  }

  const res = await fetch(`${CART_API_BASE}/api/cart/items/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart: cartId, product: productId, quantity: qty }),
  });
  if (!res.ok) throw new Error(`Add item failed: ${res.status}`);
  return res.json();
}

// ลบสินค้าออกจาก cart
async function handleRemoveItem(itemId) {
  try {
    // เรียก DELETE API
    await removeCartItem(itemId);
    // ลบจาก local state
    cartItems = cartItems.filter(
      (i) => i.id !== itemId
    );
    // render ใหม่
    renderCartContent(cartItems);
    // update header
    updateCartHeader(cartItems);
    // update badge
    updateNavbarBadge();
  } catch (err) {
    console.error("Failed to remove item:", err);
  }
}

// ไปหน้า checkout
function goToCheckout() {
  // ไม่มี cart หรือ cart ว่าง
  if (!cartId || cartItems.length === 0) {
    return;
  }
  // ส่ง cart_id ผ่าน URL
  window.location.href =
    `/frontend/customer/checkout/review/review.html?cart_id=${cartId}`;
}

// ============================================================
//  Init
// ============================================================

function initCart() {

  // inject HTML ถ้ายังไม่มี
  if (!document.getElementById("cart-overlay")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      buildCartHTML()
    );
  }
  // ฟัง event เปิด cart จาก navbar
  document.addEventListener(
    "navbar:openCart",
    openCart
  );

  // ฟัง event เพิ่มสินค้าจาก product page
  document.addEventListener("cart:addItem", async (e) => {
    const { product_id, qty } = e.detail;
    try {
      await addCartItem(product_id, qty || 1);
      updateNavbarBadge();
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  });
  // กด backdrop → ปิด cart
  document.getElementById("cart-backdrop")
    ?.addEventListener("click", closeCart);

}

// สร้าง HTML ของ cart overlay
function buildCartHTML() {
  return `
    <div id="cart-backdrop" class="cart-backdrop"></div>
    <div id="cart-overlay" class="cart-overlay" role="dialog" aria-label="Shopping cart" aria-modal="true">
      <div class="cart-header">
        <h2 class="cart-title">
          Your Cart
        </h2>
        <div class="cart-header-right">
          <span id="cart-count" class="cart-count">
            (0)
          </span>
          <button class="cart-close-btn" onclick="closeCart()" aria-label="Close cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="cart-body" class="cart-body"></div>
    </div>
  `;
}

// ============================================================
//  Auto init
// ============================================================

// รอ DOM โหลดก่อน init
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initCart
  );
} else {
  initCart();
}