/* ============================================================
   product-detail.js โ€” Smart Furniture Warehouse
   ๐”ฅ เธ”เธถเธเธเนเธญเธกเธนเธฅเธเธฒเธ localStorage (เธเธฑเธเธ—เธถเธเนเธ”เธข home.js goToProduct)
      format เธ•เธฃเธเธเธฑเธเน€เธฅเธข เนเธกเนเธ•เนเธญเธ hardcode images เธซเธฃเธทเธญ colors
   ============================================================ */

// ============================================================
//  CONFIG (เนเธเนเน€เธกเธทเนเธญเนเธกเนเธกเธตเธเนเธญเธกเธนเธฅเธเธฒเธ localStorage โ€” fallback)
// ============================================================
const PD_USE_MOCK = false;
const PD_API_BASE = "http://127.0.0.1:8000";

// Mock fallback (เธเธฃเธ“เธตเน€เธเนเธฒเธซเธเนเธฒเธเธตเนเนเธ”เธขเธ•เธฃเธเนเธกเนเธเนเธฒเธ home)
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
//  API Layer (fallback เน€เธกเธทเนเธญเนเธกเนเธกเธต localStorage)
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
const PD_COLOR_MAP = {
  red: "#e05252", orange: "#e07832", yellow: "#e0c832", green: "#4a8c3a",
  blue: "#3a6aac", purple: "#7a4aac", pink: "#e04a7a", brown: "#8a5a30",
  black: "#222222", white: "#f5f5f5", gray: "#909090", grey: "#909090",
  darkbeige: "#AC967E", tan: "#c8a870", beige: "#c8b89a", cream: "#f5f0e8",
};

function colorNameToHex(name) {
  return PD_COLOR_MAP[name?.toLowerCase()] ?? "#cccccc";
}

function fmt(price, currency = "THB") {
  return `${Number(price).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "1";
}

// ============================================================
//  ๐”ฅ mapToDetailFormat โ€” เนเธเธฅเธ format เธเธฒเธ home.js โ’ product detail
//     เธฃเธญเธเธฃเธฑเธเธ—เธฑเนเธ format เนเธซเธกเน (images เน€เธเนเธ object) เนเธฅเธฐ format เน€เธเนเธฒ
// ============================================================
function mapToDetailFormat(p) {
  // รองรับ camelCase (API จริง), PascalCase, และ snake_case (mock เก่า)
  const id        = p.productId    ?? p.ProductID    ?? p.product_id;
  const name      = p.productName  ?? p.ProductName  ?? p.product_name;
  const price     = parseFloat(p.price ?? p.Price ?? 0);
  const stock     = (p.stockQuantity ?? p.StockQuantity ?? p.stock_quantity ?? p.stock ?? 0) > 0;
  const colorName = p.color ?? p.Color ?? p.default_color ?? "default";
  const catName   = p.categoryName ?? p.category_name;

  // แปลง images array จาก API → { colorName: [urls] }
  let imagesMap;
  if (Array.isArray(p.images)) {
    const urls = p.images.map(img =>
      typeof img === "string" ? img : (img.Image_URL ?? img.image_url ?? "")
    ).filter(Boolean);
    imagesMap = { [colorName]: urls };
  } else if (p.images && typeof p.images === "object" && !Array.isArray(p.images)) {
    imagesMap = p.images;
  } else {
    imagesMap = { [colorName]: [] };
  }

  return {
    product_id:    id,
    sku:           p.sku || ("FW-" + String(id).padStart(4, "0")),
    product_name:  name,
    category_name: catName,
    price,
    currency:      p.currency || "THB",
    stock,
    default_color: colorName,
    dimensions:    p.dimensions || null,
    colors:        p.colors?.length ? p.colors : [{ name: colorName, hex: colorNameToHex(colorName) }],
    images:        imagesMap,
  };
}

// ============================================================
//  Render โ€” Product
// ============================================================
function renderProduct(rawProduct) {
  // เนเธเธฅเธ format เธเนเธญเธเน€เธชเธกเธญ
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

  // Gallery (เธฃเธนเธเธเธญเธ default_color)
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
//  ๐”ฅ getColorImages โ€” เธ”เธถเธ array เธเธญเธเธฃเธนเธเธ•เธฒเธกเธชเธตเธ—เธตเนเน€เธฅเธทเธญเธ
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
//  Render โ€” Gallery (main image + thumbnails)
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

  // เธญเธฑเธเน€เธ”เธ• zoom btn เนเธซเนเธเธตเนเนเธเธฃเธนเธเธ—เธตเนเน€เธฅเธทเธญเธ
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
//  Render โ€” Dimensions
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
//  Render โ€” Colors
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

      // ๐”ฅ เน€เธเธฅเธตเนเธขเธ gallery เธ•เธฒเธกเธชเธตเธ—เธตเนเน€เธฅเธทเธญเธ
      const newImages = getColorImages(pdState.product, pdState.selectedColor);
      renderGallery(newImages);

      updateSummary();
    });
  });
}

// ============================================================
//  Render โ€” Stock
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
    ? `${p.product_name} ${pdState.selectedColor}`
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
      label.textContent     = "Added";
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

// Escape เธเธดเธ” zoom
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeZoom();
});

// ============================================================
//  ๐”ฅ Init โ€” เธญเนเธฒเธเธเธฒเธ localStorage เธเนเธญเธ โ’ fallback API/mock
// ============================================================
async function initProductDetail() {
  try {
    const stored = localStorage.getItem("selectedProduct");

    if (stored) {
      const rawProduct = JSON.parse(stored);
      renderProduct(rawProduct);   // mapToDetailFormat เธเธฐเธเธฑเธ”เธเธฒเธฃ format เนเธซเน
      setupQty();
      setupAddToCart();
      return;
    }

    // Fallback: เน€เธเนเธฒเธซเธเนเธฒเธเธตเนเนเธ”เธขเธ•เธฃเธ เธ”เธถเธเธเธฒเธ URL ?id=
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

