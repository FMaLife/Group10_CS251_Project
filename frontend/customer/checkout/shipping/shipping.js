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
//  MOCK DATA
// ============================================================

const SHIPPING_MOCK_CART = {
  cart_id: 1,
  items: [
    { item_id: 1, product_name: "VOXLÖV วอกซ์เลิฟ",  product_price: "2450.00", quantity: 1, cartitem_total: "2450.00" },
    { item_id: 2, product_name: "TULLSTA ทูลสต้า",      product_price: "6590.00", quantity: 1, cartitem_total: "6590.00" },
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
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function apiMarkPaid(orderId) {
  // PATCH /api/orders/saleorders/{order_id}/   { payment_status: "paid" }
  if (SHIPPING_USE_MOCK) {
    return new Promise((resolve) => setTimeout(resolve, 200));
  }
  await fetch(`${SHIPPING_API_BASE}/api/orders/saleorders/${orderId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_status: "paid" }),
  });
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

function getAddressFields() {
  return {
    houseNo:     document.getElementById("field-house-no")?.value.trim(),
    street:      document.getElementById("field-street")?.value.trim(),
    type:        document.getElementById("field-type")?.value,
    subdistrict: document.getElementById("field-subdistrict")?.value.trim(),
    district:    document.getElementById("field-district")?.value.trim(),
    province:    document.getElementById("field-province")?.value.trim(),
    postcode:    document.getElementById("field-postcode")?.value.trim(),
  };
}

function buildAddressString(f) {
  return [f.houseNo, f.street, f.type, f.subdistrict, f.district, f.province, f.postcode]
    .filter(Boolean)
    .join(", ");
}

// field id ทั้งหมดที่ required
const REQUIRED_FIELDS = [
  "field-house-no",
  "field-street",
  "field-type",
  "field-subdistrict",
  "field-district",
  "field-province",
  "field-postcode",
];

function validateAddress(f) {
  return f.houseNo && f.street && f.type &&
         f.subdistrict && f.district && f.province && f.postcode;
}

// highlight ช่องที่ยังไม่ได้กรอก และ clear error ของช่องที่กรอกแล้ว
function highlightErrors() {
  let hasError = false;
  REQUIRED_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const empty = !el.value.trim();
    el.classList.toggle("error", empty);
    if (empty) hasError = true;
  });
  return hasError;
}

// clear error ทันทีที่ user เริ่มกรอก
function setupFieldErrorClear() {
  REQUIRED_FIELDS.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      document.getElementById(id)?.classList.remove("error");
    });
    document.getElementById(id)?.addEventListener("change", () => {
      document.getElementById(id)?.classList.remove("error");
    });
  });
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
    val.textContent = addr + ", Thailand";
    row.style.display = "flex";
  } else if (row) {
    row.style.display = "none";
  }
}

function handleConfirmChange() {
  const checked = document.getElementById("confirm-checkbox")?.checked;
  const btn     = document.getElementById("place-order-btn");
  if (!btn) return;
  btn.disabled = !checked;
  btn.classList.toggle("ready", !!checked);
}

// ============================================================
//  Actions
// ============================================================

async function handlePlaceOrder() {
  const f = getAddressFields();

  const hasError = highlightErrors();
  if (hasError) {
    showNotification("Please fill in all required fields marked in red.");
    return;
  }

  const btn = document.getElementById("place-order-btn");
  btn.disabled = true;
  btn.querySelector("span").textContent = "Placing...";

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
    console.error("Place order failed:", err);
    showNotification("Something went wrong. Please try again.");
    btn.disabled = false;
    btn.querySelector("span").textContent = "Place Order";
  }
}

function openQrOverlay() {
  const total = shippingCartData ? calcTotal(shippingCartData.items) : 0;
  document.getElementById("qr-amount").textContent = formatPrice(total);
  document.getElementById("qr-backdrop")?.classList.add("open");
}

function handleQrLater() {
  // ชำระภายหลัง → ไปหน้า complete พร้อมสถานะ pending
  document.getElementById("qr-backdrop")?.classList.remove("open");
  goToComplete("pending");
}

async function handleQrComplete() {
  // ชำระแล้ว → mark paid แล้วไปหน้า complete
  if (orderIdCreated) {
    try { await apiMarkPaid(orderIdCreated); } catch (e) { console.error(e); }
  }
  document.getElementById("qr-backdrop")?.classList.remove("open");
  goToComplete("paid");
}

function goToComplete(status) {
  const f   = getAddressFields();
  const addr = encodeURIComponent(buildAddressString(f));
  window.location.href =
    `/frontend/customer/checkout/complete/complete.html?cart_id=${CART_ID}&order_id=${orderIdCreated}&payment=${status}&address=${addr}`;
}

// ============================================================
//  Live preview: update Ship to as user types
// ============================================================

function setupAddressListeners() {
  ["field-district", "field-province"].forEach((id) => {
    document.getElementById(id)
      ?.addEventListener("input", updateShipToPreview);
  });
}

// ============================================================
//  Init
// ============================================================

async function initShipping() {
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
  }

  setupAddressListeners();
  setupFieldErrorClear();
}

document.addEventListener("DOMContentLoaded", initShipping);