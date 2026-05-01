/* ============================================================
   product-detail.js — Smart Furniture Warehouse
   🔥 ดึงข้อมูลจาก localStorage (บันทึกโดย home.js goToProduct)
      format ตรงกันเลย ไม่ต้อง hardcode images หรือ colors
   ============================================================ */

// ============================================================
//  CONFIG (ใช้เมื่อไม่มีข้อมูลจาก localStorage — fallback)
// ============================================================
const PD_USE_MOCK = true;
const PD_API_BASE = "http://127.0.0.1:8000";

// Mock fallback (กรณีเข้าหน้านี้โดยตรงไม่ผ่าน home)
const PD_MOCK_PRODUCTS = [
  {
    product_id: 1,
    sku: "FW-0001",
    product_name: "KRYLBO Chair",
    category_name: "Sofas & Chairs",
    price: 1690,
    currency: "THB",
    stock_quantity: 10,
    default_color: "darkbeige",
    dimensions: { length: 52, width: 56, height: 80 },
    colors: [
      { name: "darkbeige", hex: "#AC967E" },
      { name: "blue",      hex: "#3a4f6b" },
    ],
    images: {
      darkbeige: [
        "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-dark-beige.avif",
        "../assets/products/KRYLBO-Chair/beige2.avif",
      ],
      blue: [
        "../assets/products/KRYLBO-Chair/blue1.avif",
        "../assets/products/KRYLBO-Chair/blue2.avif",
      ],
    },
  },
];

// ============================================================
//  API Layer (fallback เมื่อไม่มี localStorage)
// ============================================================
async function pdFetchProduct(id) {
  if (PD_USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const p = PD_MOCK_PRODUCTS.find((p) => p.product_id === Number(id));
        p ? resolve(p) : reject(new Error("Product not found"));
      }, 120);
    });
  }
  const res = await fetch(`${PD_API_BASE}/api/catalog/products/${id}/`);
  if (!res.ok) throw new Error("Product not found");
  return res.json();
}

// ============================================================
//  State
// ============================================================
let pdState = {
  product: null,
  selectedColor: null,
  qty: 1,
  activeThumb: 0,
};

// ============================================================
//  Helpers
// ============================================================
function fmt(price, currency = "THB") {
  return `฿${Number(price).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "1";
}

// ============================================================
//  🔥 mapToDetailFormat — แปลง format จาก home.js → product detail
//     รองรับทั้ง format ใหม่ (images เป็น object) และ format เก่า
// ============================================================
function mapToDetailFormat(p) {
  // ถ้า images เป็น object { colorName: [urls] } แล้ว — ใช้เลย
  if (p.images && typeof p.images === "object" && !Array.isArray(p.images)) {
    return {
      product_id:    p.product_id,
      sku:           p.sku || `FW-${String(p.product_id).padStart(4, "0")}`,
      product_name:  p.product_name,
      category_name: p.category_name,
      price:         parseFloat(p.price),
      currency:      p.currency || "THB",
      stock:         (p.stock_quantity ?? p.stock ?? 0) > 0,
      default_color: p.default_color || p.colors?.[0]?.name || null,
      dimensions:    p.dimensions || null,
      colors:        p.colors || [],
      images:        p.images,   // ✅ ใช้ตรงๆ ไม่ต้องแปลง
    };
  }

  // ── format เก่า: images เป็น string หรือ array ──────────────
  let imgUrl = "";
  if (typeof p.images === "string") {
    imgUrl = p.images;
  } else if (Array.isArray(p.images) && p.images.length > 0) {
    const first = p.images[0];
    imgUrl = typeof first === "string" ? first : (first?.image_url || "");
  }

  const colorName = p.color || p.default_color || "default";
  const colorHex  = p.colors?.[0]?.hex || "#cccccc";

  return {
    product_id:    p.product_id,
    sku:           p.sku || `FW-${String(p.product_id).padStart(4, "0")}`,
    product_name:  p.product_name,
    category_name: p.category_name,
    price:         parseFloat(p.price),
    currency:      p.currency || "THB",
    stock:         (p.stock_quantity ?? p.stock ?? 0) > 0,
    default_color: colorName,
    dimensions:    p.dimensions || null,
    colors:        p.colors?.length ? p.colors : [{ name: colorName, hex: colorHex }],
    images:        { [colorName]: imgUrl ? [imgUrl] : [] },
  };
}

// ============================================================
//  Render — Product
// ============================================================
function renderProduct(rawProduct) {
  // แปลง format ก่อนเสมอ
  const p = mapToDetailFormat(rawProduct);
  pdState.product       = p;
  pdState.selectedColor = p.default_color || p.colors?.[0]?.name || null;
  pdState.qty           = 1;
  pdState.activeThumb   = 0;

  // Breadcrumb
  const bcCat = document.getElementById("bc-category");
  if (bcCat) {
    bcCat.textContent = p.category_name;
    bcCat.href = `/frontend/customer/home/home.html?category=${encodeURIComponent(p.category_name)}`;
  }
  setEl("bc-name", p.product_name);

  // SKU / Title
  setEl("pd-sku",   p.sku);
  setEl("pd-title", p.product_name);

  // Tags
  const tagsEl = document.getElementById("pd-tags");
  if (tagsEl) tagsEl.innerHTML = `<span class="pd-tag">${p.category_name}</span>`;

  // Price
  setEl("pd-price", fmt(p.price, p.currency));

  // Gallery (รูปของ default_color)
  const initImages = getColorImages(p, pdState.selectedColor);
  renderGallery(initImages);

  // Dimensions
  renderDimensions(p.dimensions);

  // Colors
  renderColors(p.colors);

  // Stock badge
  renderStock(p.stock);

  updateSummary();
}

// ============================================================
//  🔥 getColorImages — ดึง array ของรูปตามสีที่เลือก
// ============================================================
function getColorImages(product, colorName) {
  if (!product.images) return [];
  if (typeof product.images === "object" && !Array.isArray(product.images)) {
    return product.images[colorName] || product.images[Object.keys(product.images)[0]] || [];
  }
  if (Array.isArray(product.images)) return product.images;
  return [];
}

// ============================================================
//  Render — Gallery (main image + thumbnails)
// ============================================================
function renderGallery(images) {
  const mainImg  = document.getElementById("pd-main-img");
  const thumbsEl = document.getElementById("pd-thumbs");
  if (!mainImg || !thumbsEl) return;

  const fallback = `https://placehold.co/600x600/e8e4dc/888070?text=${encodeURIComponent(pdState.product?.product_name || "Product")}`;
  const displayImages = images.length > 0 ? images : [fallback];

  // Main image
  mainImg.src = displayImages[0];
  mainImg.alt = pdState.product?.product_name || "Product image";
  pdState.activeThumb = 0;

  // Thumbnails
  thumbsEl.innerHTML = displayImages.map((src, i) => `
    <div class="pd-thumb ${i === 0 ? "active" : ""}" data-index="${i}">
      <img src="${src}" alt="View ${i + 1}" loading="lazy" />
    </div>
  `).join("");

  thumbsEl.querySelectorAll(".pd-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      switchImage(displayImages, Number(thumb.dataset.index));
    });
  });

  // Zoom button
  const zoomBtn = document.getElementById("pd-zoom-btn");
  if (zoomBtn) zoomBtn.onclick = () => openZoom(displayImages[pdState.activeThumb]);

  const zoomClose = document.getElementById("pd-zoom-close");
  if (zoomClose) zoomClose.onclick = closeZoom;

  const zoomOverlay = document.getElementById("pd-zoom-overlay");
  if (zoomOverlay) {
    zoomOverlay.onclick = (e) => {
      if (e.target === zoomOverlay) closeZoom();
    };
  }
}

function switchImage(images, idx) {
  const mainImg  = document.getElementById("pd-main-img");
  const thumbsEl = document.getElementById("pd-thumbs");
  if (!mainImg) return;

  mainImg.classList.add("switching");
  setTimeout(() => {
    mainImg.src = images[idx];
    mainImg.classList.remove("switching");
  }, 150);

  thumbsEl?.querySelectorAll(".pd-thumb").forEach((t, i) => {
    t.classList.toggle("active", i === idx);
  });

  pdState.activeThumb = idx;

  // อัปเดต zoom btn ให้ชี้ไปรูปที่เลือก
  const zoomBtn = document.getElementById("pd-zoom-btn");
  if (zoomBtn) zoomBtn.onclick = () => openZoom(images[idx]);
}

function openZoom(src) {
  const img = document.getElementById("pd-zoom-img");
  const overlay = document.getElementById("pd-zoom-overlay");
  if (!img || !overlay) return;
  img.src = src;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeZoom() {
  document.getElementById("pd-zoom-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
}

// ============================================================
//  Render — Dimensions
// ============================================================
function renderDimensions(dimensions) {
  const dimsEl  = document.getElementById("pd-dims");
  const dimRow  = document.getElementById("pd-dim-row");
  if (!dimsEl || !dimRow) return;

  if (dimensions) {
    const { length, width, height } = dimensions;
    const chips = [];
    if (length) chips.push(`<span class="pd-dim-chip">LENGTH: ${length} CM.</span>`);
    if (width)  chips.push(`<span class="pd-dim-chip">WIDTH: ${width} CM.</span>`);
    if (height) chips.push(`<span class="pd-dim-chip">HEIGHT: ${height} CM.</span>`);
    dimsEl.innerHTML = chips.join("");
    dimRow.style.display = "";
  } else {
    dimRow.style.display = "none";
  }
}

// ============================================================
//  Render — Colors
// ============================================================
function renderColors(colors) {
  const colorsEl  = document.getElementById("pd-colors");
  const colorRow  = document.getElementById("pd-color-row");
  if (!colorsEl || !colorRow) return;

  if (!colors?.length) {
    colorRow.style.display = "none";
    return;
  }

  colorsEl.innerHTML = colors.map((c) => `
    <button class="pd-color-swatch ${c.name === pdState.selectedColor ? "active" : ""}"
            data-color="${c.name}" title="${c.name}">
      <span class="pd-color-dot" style="background:${c.hex}"></span>
      ${c.name}
    </button>
  `).join("");

  colorRow.style.display = "";

  colorsEl.querySelectorAll(".pd-color-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      pdState.selectedColor = btn.dataset.color;

      // active UI
      colorsEl.querySelectorAll(".pd-color-swatch")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 🔥 เปลี่ยน gallery ตามสีที่เลือก
      const newImages = getColorImages(pdState.product, pdState.selectedColor);
      renderGallery(newImages);

      updateSummary();
    });
  });
}

// ============================================================
//  Render — Stock
// ============================================================
function renderStock(inStock) {
  const stockEl = document.getElementById("pd-stock");
  const addBtn  = document.getElementById("pd-add-btn");
  if (!stockEl) return;

  if (inStock) {
    stockEl.textContent = "In Stock";
    stockEl.classList.remove("out");
    if (addBtn) {
      addBtn.disabled      = false;
      addBtn.style.opacity = "";
    }
  } else {
    stockEl.textContent = "Out of Stock";
    stockEl.classList.add("out");
    if (addBtn) {
      addBtn.disabled      = true;
      addBtn.style.opacity = ".45";
    }
  }
}

// ============================================================
//  Summary bar
// ============================================================
function updateSummary() {
  const p = pdState.product;
  if (!p) return;

  const total = p.price * pdState.qty;
  const name  = pdState.selectedColor
    ? `${p.product_name} — ${pdState.selectedColor}`
    : p.product_name;

  setEl("pd-summary-name",       name);
  setEl("pd-summary-qty",        `${pdState.qty}x`);
  setEl("pd-summary-unit-price", fmt(p.price * pdState.qty, p.currency));
  setEl("pd-qty",                String(pdState.qty));
  setEl("pd-total-price",        fmt(total, p.currency));
}

// ============================================================
//  Qty controls
// ============================================================
function setupQty() {
  document.getElementById("btn-plus")?.addEventListener("click", () => {
    pdState.qty++;
    updateSummary();
  });
  document.getElementById("btn-minus")?.addEventListener("click", () => {
    if (pdState.qty > 1) {
      pdState.qty--;
      updateSummary();
    }
  });
}

// ============================================================
//  Add to Cart
// ============================================================
function setupAddToCart() {
  document.getElementById("pd-add-btn")?.addEventListener("click", () => {
    const p = pdState.product;
    if (!p || !p.stock) return;

    const images     = getColorImages(p, pdState.selectedColor);
    const firstImage = images[0] || "";

    document.dispatchEvent(new CustomEvent("cart:addItem", {
      detail: {
        product_id:   p.product_id,
        product_name: p.product_name,
        color:        pdState.selectedColor,
        qty:          pdState.qty,
        price:        p.price,
        currency:     p.currency,
        image:        firstImage,
      },
    }));

    // Visual feedback
    const btn     = document.getElementById("pd-add-btn");
    const label   = btn?.querySelector("span");
    if (btn && label) {
      btn.style.background  = "#458B36";
      label.textContent     = "Added ✓";
      setTimeout(() => {
        btn.style.background = "";
        label.textContent    = "Add to Cart";
      }, 1800);
    }
  });
}

// ============================================================
//  Util
// ============================================================
function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Escape ปิด zoom
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeZoom();
});

// ============================================================
//  🔥 Init — อ่านจาก localStorage ก่อน → fallback API/mock
// ============================================================
async function initProductDetail() {
  try {
    const stored = localStorage.getItem("selectedProduct");

    if (stored) {
      const rawProduct = JSON.parse(stored);
      renderProduct(rawProduct);   // mapToDetailFormat จะจัดการ format ให้
      setupQty();
      setupAddToCart();
      return;
    }

    // Fallback: เข้าหน้านี้โดยตรง ดึงจาก URL ?id=
    const id      = getProductIdFromUrl();
    const product = await pdFetchProduct(id);
    renderProduct(product);
    setupQty();
    setupAddToCart();

  } catch (err) {
    console.error("Product detail init failed:", err);
    setEl("pd-title", "Product not found");
  }
}

document.addEventListener("DOMContentLoaded", initProductDetail);