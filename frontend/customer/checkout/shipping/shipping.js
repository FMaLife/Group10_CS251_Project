// ============================================================
//  CONFIG
// ============================================================

const SHIPPING_USE_MOCK = false;
const SHIPPING_API_BASE = "http://127.0.0.1:8000";

// ดึง cart_id จาก query string ที่ review.js ส่งมา
const params  = new URLSearchParams(window.location.search);
const CART_ID = parseInt(params.get("cart_id") || 1);

// customer_id จาก session (ใช้จริงให้ดึงจาก localStorage / cookie)
const _shipCustomerRaw = localStorage.getItem("customer");
const CUSTOMER_ID = _shipCustomerRaw ? (JSON.parse(_shipCustomerRaw).customerID || 1) : 1;

// ============================================================
//  MOCK DATA  (field ตรงกับ review.js REVIEW_MOCK_CART)
// ============================================================

const SHIPPING_MOCK_CART = {
  cart_id: 1,
  customer_id: 1,
  item_count: 2,
  total_amount: 9040.00,
  items: [
    {
      item_id: 1,
      product_name: "VOXLÖV วอกซ์เลิฟ",
      product_price: "2450.00",
      quantity: 2,
      subtotal: "4900.00",
    },
    {
      item_id: 2,
      product_name: "VOXLÖV วอกซ์เลิฟ",
      product_price: "2450.00",
      quantity: 2,
      subtotal: "4900.00",
    },
  ],
};

// mock saved addresses — GET /api/customers/addresses
const SHIPPING_MOCK_ADDRESSES = [
  // uncomment เพื่อทดสอบ autofill
  // {
  //   address_id: 3,
  //   addressType: "House",
  //   houseNumber: "12/4",
  //   street: "Sukhumvit",
  //   subDistrict: "Khlong Toei",
  //   district: "Khlong Toei",
  //   province: "Bangkok",
  //   zipCode: "10110",
  // },
];

// ============================================================
//  State
// ============================================================

let shippingCartData = null;   // cart object จาก API
let savedAddressId   = null;   // address_id ที่มีอยู่แล้ว (ถ้ามี)
let orderIdCreated   = null;   // order_id หลัง place order สำเร็จ

// ============================================================
//  API layer
// ============================================================

// Step 1 — โหลด cart
// GET /api/cart/?customer={customer_id}
async function fetchShippingCart() {
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(SHIPPING_MOCK_CART), 100));
  }
  const res = await fetch(`${SHIPPING_API_BASE}/api/cart/?customer=${CUSTOMER_ID}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Cart fetch failed: ${res.status}`);
  return res.json();
}

// Step 2 — โหลดที่อยู่ที่บันทึกไว้
// GET /api/customers/addresses
async function fetchSavedAddresses() {
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(SHIPPING_MOCK_ADDRESSES), 80));
  }
  const res = await fetch(`${SHIPPING_API_BASE}/api/customers/addresses`, { credentials: "include" });
  if (!res.ok) throw new Error(`Address fetch failed: ${res.status}`);
  return res.json(); // { addresses: [...] }
}

// Place Order Step 1 — บันทึกที่อยู่
// POST /api/customers/addresses/add
// body: { addressType, houseNumber, street, subDistrict, district, province, zipCode }
// → 201 { address: { address_id, ... } }
// → 400 Missing fields  /  400 { errors: { zipCode: "..." } }
async function apiSaveAddress(addressPayload) {
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ address: { address_id: 3, ...addressPayload } }), 200)
    );
  }
  const res = await fetch(`${SHIPPING_API_BASE}/api/customers/addresses/add/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...addressPayload, customer_id: CUSTOMER_ID }),
  });
  const data = await res.json();
  if (!res.ok) {
    // ส่ง error กลับพร้อม status เพื่อให้ handler จัดการได้
    const err = new Error("Save address failed");
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}

// Place Order Step 2 — สร้าง order
// POST /api/orders/saleorders/
// body: { cart_id, address_id }
// → 201 { order_id }
// → 400 cart_id absent / address_id absent / cart empty
// → 404 Cart not found / Address not found
async function apiCreateOrder(cartId, addressId) {
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ order_id: Math.floor(10000 + Math.random() * 90000) }), 300)
    );
  }
  const res = await fetch(`${SHIPPING_API_BASE}/api/orders/saleorders/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart_id: cartId, address_id: addressId }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error("Create order failed");
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}

// PATCH /api/orders/saleorders/{order_id}/
// body: { payment_status: "paid" }
// → 200 { order_status: "Received" }
// → 500 Server error
async function apiMarkPaid(orderId) {
  // PATCH /api/orders/saleorders/{order_id}/   { payment_status: "paid" }
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve({ order_status: "Received" }), 200));
  }
  const res = await fetch(`${SHIPPING_API_BASE}/api/orders/saleorders/${orderId}/`, {
    method: "PATCH",
    credentials: "include",
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

function calcTotal(items) {
  return items.reduce((s, i) => s + parseFloat(i.product_price) * i.quantity, 0);
}

function formatPrice(n) {
  return parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 0 }) + " THB";
}

// อ่านค่าจากฟอร์ม — key ตรงกับ field ของ API
function getAddressFields() {
  return {
    addressType:  document.getElementById("field-type")?.value,
    houseNo:      document.getElementById("field-house-no")?.value.trim(),
    street:       document.getElementById("field-street")?.value.trim(),
    subDistrict:  document.getElementById("field-subdistrict")?.value.trim(),
    district:     document.getElementById("field-district")?.value.trim(),
    province:     document.getElementById("field-province")?.value.trim(),
    zipCode:      document.getElementById("field-postcode")?.value.trim(),
  };
}

// สร้าง string สำหรับแสดงใน summary / query string ไปหน้า complete
function buildAddressString(f) {
  return [f.houseNo, f.street, f.addressType, f.subDistrict, f.district, f.province, f.zipCode]
    .filter(Boolean)
    .join(", ");
}

// เติมฟอร์มด้วยข้อมูลที่อยู่ที่บันทึกไว้
function autofillAddress(addr) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };
  set("field-type",        addr.addressType);
  set("field-house-no",    addr.houseNo);
  set("field-street",      addr.street);
  set("field-subdistrict", addr.subDistrict);
  set("field-district",    addr.district);
  set("field-province",    addr.province);
  set("field-postcode",    addr.zipCode);
  updateShipToPreview();
}

// field id → key ใน getAddressFields()
const REQUIRED_FIELDS = [
  "field-house-no",
  "field-street",
  "field-type",
  "field-subdistrict",
  "field-district",
  "field-province",
  "field-postcode",
];

// highlight ช่องว่าง
function highlightErrors(errorFields = []) {
  let hasError = false;
  REQUIRED_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isEmpty  = !el.value.trim();
    const hasApiErr = errorFields.includes(id);
    el.classList.toggle("error", isEmpty || hasApiErr);
    if (isEmpty || hasApiErr) hasError = true;
  });
  return hasError;
}

// clear error ทันทีที่ user เริ่มพิมพ์
function setupFieldErrorClear() {
  REQUIRED_FIELDS.forEach((id) => {
    ["input", "change"].forEach((evt) => {
      document.getElementById(id)?.addEventListener(evt, () => {
        document.getElementById(id)?.classList.remove("error");
      });
    });
  });
}

// แปลง API error object → array of field-id ที่ error
// รองรับ { errors: { zipCode: "..." } }
function parseApiAddressErrors(errData) {
  if (!errData?.errors) return [];
  const keyToFieldId = {
    zipCode:  "field-postcode",
    houseNo:  "field-house-no",
    street:      "field-street",
    addressType: "field-type",
    subDistrict: "field-subdistrict",
    district:    "field-district",
    province:    "field-province",
  };
  return Object.keys(errData.errors)
    .map((k) => keyToFieldId[k])
    .filter(Boolean);
}

// ============================================================
//  UI helpers
// ============================================================

function showNotification(msg) {
  const bar  = document.getElementById("notification-bar");
  const text = document.getElementById("notification-text");
  if (!bar || !text) return;
  text.textContent = msg;
  bar.classList.remove("hidden");
}

function closeNotification() {
  document.getElementById("notification-bar")?.classList.add("hidden");
}

function updateShipToPreview() {
  const f    = getAddressFields();
  const row  = document.getElementById("ship-to-row");
  const val  = document.getElementById("ship-to-value");
  const addr = [f.district, f.province].filter(Boolean).join(", ");
  if (addr && row && val) {
    val.textContent    = addr + ", Thailand";
    row.style.display  = "flex";
  } else if (row) {
    row.style.display  = "none";
  }
}

function handleConfirmChange() {
  const checked = document.getElementById("confirm-checkbox")?.checked;
  const btn     = document.getElementById("place-order-btn");
  if (!btn) return;
  btn.disabled = !checked;
  btn.classList.toggle("ready", !!checked);
}

function setPlaceOrderBtnState(state) {
  // state: "idle" | "loading" | "error"
  const btn  = document.getElementById("place-order-btn");
  const span = btn?.querySelector("span");
  if (!btn) return;
  if (state === "loading") {
    btn.disabled  = true;
    if (span) span.textContent = "Placing...";
  } else {
    // idle หรือ error → คืนปุ่ม (เปิดได้เฉพาะถ้า checkbox ยังติ๊กอยู่)
    const checked = document.getElementById("confirm-checkbox")?.checked;
    btn.disabled  = !checked;
    if (span) span.textContent = "Place Order";
  }
}

// ============================================================
//  Actions
// ============================================================

async function handlePlaceOrder() {
  closeNotification();

  // 1. validate ฟอร์มฝั่ง client ก่อน
  const hasError = highlightErrors();
  if (hasError) {
    showNotification("Please fill in all required fields marked in red.");
    return;
  }

  setPlaceOrderBtnState("loading");

  const f = getAddressFields();
  console.log("Place order — address payload:", JSON.stringify({...f, customer_id: CUSTOMER_ID}));

  // client-side zip code format check
  if (!/^\d{5}$/.test(f.zipCode)) {
    document.getElementById("field-postcode")?.classList.add("error");
    showNotification("ZIP code must be exactly 5 digits (e.g. 10110).");
    setPlaceOrderBtnState("error");
    return;
  }

  try {
    // ── Place Order Step 1: บันทึก / ใช้ address ──────────────────
    let addressId = savedAddressId; // ถ้ามีที่อยู่เดิมจาก API ใช้เลย

    if (!addressId) {
      // POST /api/customers/addresses/add
      let saveResult;
      try {
        saveResult = await apiSaveAddress(f);
      } catch (addrErr) {
        if (addrErr.status === 400) {
          // highlight เฉพาะ field ที่ API บอกว่า error (เช่น zipCode รูปแบบผิด)
          const errorFields = parseApiAddressErrors(addrErr.data);
          if (errorFields.length > 0) {
            highlightErrors(errorFields);
            showNotification("Please check the highlighted fields and try again.");
          } else {
            showNotification("Address information is incomplete. Please review and try again.");
          }
        } else {
          showNotification("Something went wrong saving your address. Please try again.");
        }
        setPlaceOrderBtnState("error");
        return;
      }
      addressId = saveResult.address.addressID;
    }

    // ── Place Order Step 2: สร้าง order ───────────────────────────
    // POST /api/orders/saleorders/  { cart_id, address_id }
    let orderResult;
    try {
      orderResult = await apiCreateOrder(CART_ID, addressId);
    } catch (orderErr) {
      const msg =
        orderErr.status === 404 ? "Cart or address not found. Please go back and try again." :
        orderErr.status === 400 ? "There was a problem with your order. Please go back and try again." :
        "Something went wrong placing your order. Please try again.";
      showNotification(msg);
      setPlaceOrderBtnState("error");
      return;
    }

    orderIdCreated = orderResult.order_id;
    openQrOverlay();

  } catch (err) {
    // catch-all สำหรับ network error ฯลฯ
    console.error("Place order failed:", err);
    showNotification("Something went wrong. Please try again.");
    setPlaceOrderBtnState("error");
  }
}

function openQrOverlay() {
  const total = shippingCartData ? calcTotal(shippingCartData.items) : 0;
  document.getElementById("qr-amount").textContent = formatPrice(total);
  document.getElementById("qr-backdrop")?.classList.add("open");
}

function handleQrLater() {
  // กด "Not ready" — ยังไม่จ่าย ปิด overlay และ navigate ไปหน้า complete พร้อมสถานะ pending
  document.getElementById("qr-backdrop")?.classList.remove("open");
  goToComplete("pending");
}

async function handleQrComplete() {
  // กด "Complete" — เรียก PATCH ก่อน ถ้าสำเร็จ navigate, ถ้า 500 แสดง error บนหน้า
  const completeBtn = document.querySelector(".qr-btn-complete");
  const laterBtn    = document.querySelector(".qr-btn-later");
  if (completeBtn) { completeBtn.disabled = true; completeBtn.textContent = "Processing..."; }
  if (laterBtn)    laterBtn.disabled = true;

  try {
    await apiMarkPaid(orderIdCreated);
    document.getElementById("qr-backdrop")?.classList.remove("open");
    goToComplete("paid");
  } catch (err) {
    console.error("Mark paid failed:", err);
    // คืนปุ่มและแสดง error บน overlay (ไม่ navigate)
    if (completeBtn) { completeBtn.disabled = false; completeBtn.textContent = "Complete"; }
    if (laterBtn)    laterBtn.disabled = false;
    showNotification("Payment could not be confirmed. Please try again.");
  }
}

function goToComplete(status) {
  const f    = getAddressFields();
  const addr = encodeURIComponent(buildAddressString(f));
  window.location.href =
    `/frontend/customer/checkout/complete/complete.html` +
    `?cart_id=${CART_ID}&order_id=${orderIdCreated}&payment=${status}&address=${addr}`;
}

// ============================================================
//  Live preview
// ============================================================

function setupAddressListeners() {
  ["field-district", "field-province"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateShipToPreview);
  });
}

// ============================================================
//  Init
// ============================================================

async function initShipping() {
  // ── โหลด cart (required) ─────────────────────────────────────
  try {
    shippingCartData = await fetchShippingCart();
    const total = calcTotal(shippingCartData.items);

    document.getElementById("shipping-item-count").textContent = `(${shippingCartData.items.length})`;
    document.getElementById("shipping-subtotal").textContent   = formatPrice(total);
    document.getElementById("place-order-total").textContent   = formatPrice(total);
  } catch (err) {
    console.error("Shipping init failed:", err);
    showNotification("Failed to load cart data. Please refresh the page.");
  }

  // ── โหลด saved addresses (optional) ─────────────────────────
  try {
    const addressData = await fetchSavedAddresses();
    const addresses = addressData?.addresses ?? addressData;
    if (Array.isArray(addresses) && addresses.length > 0) {
      const primary  = addresses[0];
      savedAddressId = primary.addressID;
      autofillAddress(primary);
    }
  } catch {
    // address fetch ล้มเหลว (เช่น ยังไม่ login) — ให้ user กรอกเอง
  }

  setupAddressListeners();
  setupFieldErrorClear();
}

document.addEventListener("DOMContentLoaded", initShipping);
