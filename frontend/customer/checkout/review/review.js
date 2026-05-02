// ============================================================
//  CONFIG
// ============================================================

const REVIEW_USE_MOCK = false;
const REVIEW_API_BASE = "http://127.0.0.1:8000";

// customer_id — ในระบบจริงดึงจาก session/localStorage
// เปลี่ยนให้ตรงกับ customer ที่ login อยู่
const _customerRaw = localStorage.getItem("customer");
const CUSTOMER_ID = _customerRaw ? (JSON.parse(_customerRaw).customerID || 1) : 1;
let reviewCartId = null; // cart_id จาก API response ใช้ส่งต่อไปหน้า shipping

// ============================================================
//  MOCK DATA — field ตรงกับ GET /api/cart/?customer={customer_id}
// ============================================================

const REVIEW_MOCK_CART = {  // [FIX 1] เปลี่ยนชื่อจาก `cart` → `REVIEW_MOCK_CART`
  cart_id: 1,               //         ให้ตรงกับที่ fetchCart() resolve(REVIEW_MOCK_CART)
  customer_id: 1,
  create_date: "2026-04-01",
  last_updated: "2026-04-02",
  item_count: 2,
  total_amount: 9040.00,
  items: [
    {
      item_id: 1,
      order: 1,
      product: 1,
      product_name: "VOXLÖV วอกซ์เลิฟ",
      product_price: "2450.00",
      quantity: 2,
      color: "Grey",
      width: 100,
      length: 50,
      height: 150,
      image: "/BALTSAR บัลต์ซาร์.avif",
      subtotal: "4900.00"
    },
    {
      item_id: 2,
      order: 1,
      product: 2,
      product_name: "VOXLÖV วอกซ์เลิฟ",
      product_price: "2450.00",
      quantity: 2,
      color: "Grey",
      width: 100,
      length: 50,
      height: 150,
      image: "/BALTSAR บัลต์ซาร์.avif",
      subtotal: "4900.00"
    }
  ],
};

// ============================================================
//  State
// ============================================================

// เก็บ items ไว้ใน memory เพื่อให้ปรับ qty ได้โดยไม่ต้อง fetch ใหม่
let reviewCart = null;
let reviewCartItems = [];

// track การเปลี่ยนแปลงที่ยังไม่ได้ sync — flush ตอนกด Checkout
// { [itemId]: "update" | "delete" }
const pendingChanges = {};

// ============================================================
//  API layer
// ============================================================

async function fetchCart() {
  if (REVIEW_USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(REVIEW_MOCK_CART), 120)  // [FIX 1] ใช้ REVIEW_MOCK_CART แล้วสอดคล้องกัน
    );
  }
  const res = await fetch(`${REVIEW_API_BASE}/api/cart/?customer=${CUSTOMER_ID}`, { credentials: "include" });
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
    credentials: "include",
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
    credentials: "include",
  });
}

// ============================================================
//  Calculations
// ============================================================

// คำนวณ total จาก items ที่เหลืออยู่ใน state (ใช้หลัง remove/qty change)
function calcTotal(items) {
  return items.reduce((sum, item) => {
    return sum + parseFloat(item.product_price) * item.quantity;
  }, 0);
}

// เอา product_price: str มาใส่ลูกน้ำ
function formatPrice(amount) {
  return parseFloat(amount).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + " THB";
}

// ============================================================
//  Renderers
// ============================================================

// function getItemImage(item) {
//   // เมื่อ API ส่ง image url มาให้ใช้ item.product_image แทน
//   return `https://placehold.co/56x56/f0ece4/888070?text=${encodeURIComponent(item.product_name[0])}`;
// }

function renderItems(items) {
  const list = document.getElementById("review-items-list");
  if (!list) return;

  if (items.length === 0) {  // [FIX 2] เช็ค items.length (array) แทน cart.length (object)
    list.innerHTML = `<div class="review-empty">Your cart is empty.</div>`;
    return;
  }

  list.innerHTML = items.map((item) => {
    return `
      <div class="review-item" data-item-id="${item.item_id}">
        <img
          class="review-item-img"
          src="${item.image || 'https://placehold.co/56x56/e8e4dc/888070?text=IMG'}"
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
        <div class="review-item-total" id="total-${item.item_id}">${formatPrice(item.cartitem_total ?? item.subtotal)}</div>
      </div>
    `;
  }).join("");
}

// [FIX 3] updateSummary รับ items[] + cartObj แยกกัน
//         - items[] → คำนวณ total สด (สำคัญหลัง remove/qty change)
//         - cartObj → ดึง cart_id ใช้ใน goToShipping เท่านั้น
function updateSummary(items) {
  const subtotalEl = document.getElementById("summary-subtotal");
  const btnTotalEl = document.getElementById("checkout-btn-total");
  const countEl    = document.getElementById("cart-item-count");

  const total = calcTotal(items);  // คำนวณจาก items ที่เหลืออยู่จริง
  const count = items.length;

  if (subtotalEl) subtotalEl.textContent = formatPrice(total);
  if (btnTotalEl) btnTotalEl.textContent = formatPrice(total);
  if (countEl)    countEl.textContent    = `(${count})`;

  // disable checkout ถ้าตะกร้าว่าง
  const btn = document.getElementById("checkout-btn");
  if (btn) btn.disabled = count === 0;
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
  item.subtotal = (parseFloat(item.product_price) * newQty).toFixed(2);  // sync subtotal ใน state ด้วย

  // mark ว่า item นี้ต้องการ PATCH ตอน checkout
  // (ถ้า item ถูก mark delete ไปแล้ว ไม่ต้องเปลี่ยน — แต่กรณีนี้ไม่เกิดเพราะ remove ลบออกจาก reviewCartItems แล้ว)
  if (pendingChanges[itemId] !== "delete") {
    pendingChanges[itemId] = "update";
  }

  // อัปเดต UI ทันที (optimistic update)
  const qtyEl   = document.getElementById(`qty-${itemId}`);
  const totalEl = document.getElementById(`total-${itemId}`);
  if (qtyEl)   qtyEl.textContent   = newQty;
  if (totalEl) totalEl.textContent = formatPrice(item.subtotal);
  updateSummary(reviewCartItems);
}

async function handleRemoveItem(itemId) {
  // mark ว่า item นี้ต้องการ DELETE ตอน checkout
  // ยกเลิก pending update ถ้ามี แล้วเขียนทับเป็น delete
  pendingChanges[itemId] = "delete";

  // ลบออกจาก state ก่อน (optimistic)
  reviewCartItems = reviewCartItems.filter((i) => i.item_id !== itemId);
  renderItems(reviewCartItems);
  updateSummary(reviewCartItems);
}

// flush pendingChanges ไปยัง API ทั้งหมดพร้อมกัน
// ส่งเป็น parallel requests — ถ้า error ตัวใดตัวหนึ่งให้ throw เพื่อหยุด checkout
async function syncCartChanges() {
  const entries = Object.entries(pendingChanges); // [[itemId, "update"|"delete"], ...]
  if (entries.length === 0) return; // ไม่มีการเปลี่ยนแปลง ข้ามไปเลย

  const requests = entries.map(([itemId, action]) => {
    const id = parseInt(itemId);
    if (action === "delete") {
      return apiRemoveItem(id);
    } else {
      const item = reviewCartItems.find((i) => i.item_id === id);
      if (!item) return Promise.resolve(); // item ถูกลบออกจาก state แล้ว (ไม่ควรเกิด)
      return apiUpdateQty(id, item.quantity);
    }
  });

  // รอทุก request พร้อมกัน — ถ้ามี error จะ throw ออกมาให้ goToShipping จับ
  await Promise.all(requests);

  // clear หลัง sync สำเร็จ
  for (const key of Object.keys(pendingChanges)) {
    delete pendingChanges[key];
  }
}

// ส่ง cart_id ไปหน้า shipping ด้วย query string
async function goToShipping() {
  if (!reviewCart) {
    console.error("Cart not loaded yet");
    return;
  }

  // ล็อกปุ่มระหว่าง sync เพื่อป้องกันกด 2 ครั้ง
  const btn = document.getElementById("checkout-btn");
  if (btn) {
    btn.disabled = true;
    btn.querySelector("span").textContent = "Saving...";
  }

  try {
    await syncCartChanges(); // sync ทุก pending change ก่อนไปหน้าถัดไป
    window.location.href =
      `/frontend/customer/checkout/shipping/shipping.html?cart_id=${reviewCart.cart_id}&customer_id=${CUSTOMER_ID}`;
  } catch (err) {
    console.error("Failed to sync cart before checkout:", err);
    // คืนปุ่มให้กดได้ใหม่ถ้า sync ล้มเหลว
    if (btn) {
      btn.disabled = reviewCartItems.length === 0;
      btn.querySelector("span").textContent = "Checkout";
    }
    alert("ไม่สามารถบันทึกตะกร้าได้ กรุณาลองใหม่อีกครั้ง");
  }
}

// ============================================================
//  Init
// ============================================================

async function initReview() {
  try {
    const loadedCart = await fetchCart();  // [FIX 4] ใช้ fetchCart() จริง ๆ แทนที่จะ comment ทิ้ง

    // เก็บ cart object และ items array ไว้ใน state
    reviewCart      = loadedCart;
    reviewCartId    = loadedCart.cart_id;
    reviewCartItems = loadedCart.items;

    renderItems(reviewCartItems);
    updateSummary(reviewCartItems);
  } catch (err) {
    console.error("Review init failed:", err);
    const list = document.getElementById("review-items-list");
    if (list) list.innerHTML = `<div class="review-empty">Failed to load cart. Please try again.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", initReview);
