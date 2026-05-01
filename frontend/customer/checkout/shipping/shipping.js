// ============================================================
//  CONFIG
// ============================================================

const SHIPPING_USE_MOCK = true;
const SHIPPING_API_BASE = "http://127.0.0.1:8000";

// ดึง cart_id และ customer_id จาก query string ที่ review.js ส่งมา
const params      = new URLSearchParams(window.location.search);
const CART_ID     = params.get("cart_id") || 1;
const CUSTOMER_ID = params.get("customer_id") || 1;

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

const SHIPPING_MOCK_ADDRESSES = [
  { AddressID: 1, HouseNo: "123", Street: "Sukhumvit", SubDistrict: "Khlong Toei", District: "Khlong Toei", Province: "Bangkok", ZipCode: "10110", is_default: true },
];

// ============================================================
//  State
// ============================================================

let shippingCartData  = null;
let orderIdCreated    = null; // เก็บ order_id หลัง place order สำเร็จ
let paymentStatus     = "pending"; // pending | paid
let selectedAddressId = null; // address_id ที่เลือกสำหรับ POST /api/orders/saleorders/

// ============================================================
//  API layer
// ============================================================

// Step 1 — โหลด cart
// GET /api/cart/?customer={customer_id}
async function fetchShippingCart() {
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(SHIPPING_MOCK_CART), 100));
  }
  const res = await fetch(`${SHIPPING_API_BASE}/api/cart/?customer=${CUSTOMER_ID}`);
  return res.json();
}

async function fetchAddresses() {
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(SHIPPING_MOCK_ADDRESSES), 80));
  }
  const res = await fetch(`${SHIPPING_API_BASE}/api/customers/addresses/`);
  return res.json();
}

function renderAddressSelector(addresses) {
  const container = document.getElementById("address-selector");
  if (!container || !addresses.length) return;

  const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
  selectedAddressId = defaultAddr.AddressID;

  container.innerHTML = `
    <label class="form-label" for="address-select">Select delivery address</label>
    <select id="address-select" class="form-input" onchange="handleAddressSelect(this.value)">
      ${addresses.map((a) => `
        <option value="${a.AddressID}" ${a.AddressID === defaultAddr.AddressID ? "selected" : ""}>
          ${[a.HouseNo, a.Street, a.SubDistrict, a.District, a.Province, a.ZipCode].filter(Boolean).join(", ")}
        </option>
      `).join("")}
    </select>
  `;
}

function handleAddressSelect(addressId) {
  selectedAddressId = parseInt(addressId, 10);
}

async function apiPlaceOrder(payload) {
  // POST /api/orders/saleorders/   { cart_id, address_id }
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ order_id: Math.floor(10000 + Math.random() * 90000) }), 300)
    );
  }
  const res = await fetch(`${SHIPPING_API_BASE}/api/orders/saleorders/`, {
    method: "POST",
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
  await fetch(`${SHIPPING_API_BASE}/api/orders/saleorders/${orderId}/`, {
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
    houseNumber:  document.getElementById("field-house-no")?.value.trim(),
    street:       document.getElementById("field-street")?.value.trim(),
    subDistrict:  document.getElementById("field-subdistrict")?.value.trim(),
    district:     document.getElementById("field-district")?.value.trim(),
    province:     document.getElementById("field-province")?.value.trim(),
    zipCode:      document.getElementById("field-postcode")?.value.trim(),
  };
}

// สร้าง string สำหรับแสดงใน summary / query string ไปหน้า complete
function buildAddressString(f) {
  return [f.houseNumber, f.street, f.addressType, f.subDistrict, f.district, f.province, f.zipCode]
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
  set("field-house-no",    addr.houseNumber);
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
    zipCode:     "field-postcode",
    houseNumber: "field-house-no",
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

  try {
    if (!selectedAddressId) {
      showNotification("Please select a delivery address.");
      btn.disabled = false;
      btn.querySelector("span").textContent = "Place Order";
      return;
    }
    const payload = {
      cart_id: CART_ID,
      address_id: selectedAddressId,
    };
    const result = await apiPlaceOrder(payload);
    orderIdCreated = result.order_id;
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
  // ── โหลด cart และ saved addresses พร้อมกัน ───────────────────
  try {
    const [cartData, addresses] = await Promise.all([fetchShippingCart(), fetchAddresses()]);
    shippingCartData = cartData;
    const total = calcTotal(shippingCartData.items);

    document.getElementById("shipping-item-count").textContent =
      `(${shippingCartData.items.length})`;
    document.getElementById("shipping-subtotal").textContent = formatPrice(total);
    document.getElementById("place-order-total").textContent  = formatPrice(total);

    renderAddressSelector(addresses);
  } catch (err) {
    console.error("Shipping init failed:", err);
    showNotification("Failed to load cart data. Please refresh the page.");
  }

  setupAddressListeners();
  setupFieldErrorClear();
}

document.addEventListener("DOMContentLoaded", initShipping);