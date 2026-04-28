/* ========================================
   Smart Furniture Warehouse – home.js
   ======================================== */

// ============================================================
//  CONFIG
// ============================================================

const HOME_USE_MOCK = true;
const HOME_API_BASE = "http://127.0.0.1:8000";

// ============================================================
//  MOCK DATA — field ตรงกับ response จริงจาก Django
// ============================================================

const HOME_MOCK_DB = {
  // ตรงกับ GET /api/catalog/categories/
  categories: [
    { category_id: 1, category_name: "Sofas & Chairs"     },
    { category_id: 2, category_name: "Tables & Desks"     },
    { category_id: 3, category_name: "Beds & Mattresses"  },
    { category_id: 4, category_name: "Curtains & Blinds"  },
    { category_id: 5, category_name: "Storage"            },
    { category_id: 6, category_name: "Outdoor"            },
  ],

  // ตรงกับ GET /api/catalog/products/
  products: [
    { product_id: 1,  product_name: "KOARP Armchair",          price: "4990.00",  stock_quantity: 10, color: "beige",  category: 1, category_name: "Sofas & Chairs",    images: null },
    { product_id: 2,  product_name: "FRÖSET Chair",            price: "3490.00",  stock_quantity: 5,  color: "green",  category: 1, category_name: "Sofas & Chairs",    images: null },
    { product_id: 3,  product_name: "SKOGSTA Chair",           price: "2990.00",  stock_quantity: 0,  color: "brown",  category: 1, category_name: "Sofas & Chairs",    images: null },
    { product_id: 4,  product_name: "TULLSTA Chair",           price: "5990.00",  stock_quantity: 8,  color: "gray",   category: 1, category_name: "Sofas & Chairs",    images: null },
    { product_id: 5,  product_name: "BJÖRKSNÄS Chair",         price: "3990.00",  stock_quantity: 0,  color: "white",  category: 1, category_name: "Sofas & Chairs",    images: null },
    { product_id: 6,  product_name: "WICKER Café Chair",       price: "2490.00",  stock_quantity: 12, color: "tan",    category: 1, category_name: "Sofas & Chairs",    images: null },
    { product_id: 7,  product_name: "TERJE Folding Chair",     price: "1990.00",  stock_quantity: 20, color: "black",  category: 1, category_name: "Sofas & Chairs",    images: null },
    { product_id: 8,  product_name: "TOBIAS Chair",            price: "3290.00",  stock_quantity: 7,  color: "clear",  category: 1, category_name: "Sofas & Chairs",    images: null },
    { product_id: 9,  product_name: "LISABO Desk",             price: "6990.00",  stock_quantity: 4,  color: "ash",    category: 2, category_name: "Tables & Desks",    images: null },
    { product_id: 10, product_name: "ALEX Drawer Unit",        price: "5490.00",  stock_quantity: 6,  color: "white",  category: 2, category_name: "Tables & Desks",    images: null },
    { product_id: 11, product_name: "HEMNES Bed Frame",        price: "12990.00", stock_quantity: 3,  color: "white",  category: 3, category_name: "Beds & Mattresses", images: null },
    { product_id: 12, product_name: "MALFORS Mattress",        price: "7990.00",  stock_quantity: 0,  color: "white",  category: 3, category_name: "Beds & Mattresses", images: null },
    { product_id: 13, product_name: "MAJGULL Blackout Curtain",price: "1290.00",  stock_quantity: 15, color: "gray",   category: 4, category_name: "Curtains & Blinds", images: null },
    { product_id: 14, product_name: "KALLAX Shelf Unit",       price: "3990.00",  stock_quantity: 9,  color: "white",  category: 5, category_name: "Storage",           images: null },
    { product_id: 15, product_name: "ÄPPLARÖ Bench",           price: "4490.00",  stock_quantity: 5,  color: "brown",  category: 6, category_name: "Outdoor",           images: null },
  ],
};

// ============================================================
//  API layer
// ============================================================

async function homeApiFetch(endpoint) {
  if (HOME_USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === "/api/catalog/categories/") resolve(HOME_MOCK_DB.categories);
        else if (endpoint.startsWith("/api/catalog/products/")) resolve(HOME_MOCK_DB.products);
        else resolve([]);
      }, 100);
    });
  }
  const res = await fetch(`${HOME_API_BASE}${endpoint}`);
  return res.json();
}

async function homeGetCategories() {
  return homeApiFetch("/api/catalog/categories/");
}

async function homeGetProducts() {
  return homeApiFetch("/api/catalog/products/");
}

// ============================================================
//  State
// ============================================================

let homeCategories = [];
let homeProducts   = [];
let activeCatId    = null; // null = Show All
let isSearchMode   = false;

// ============================================================
//  Renderers
// ============================================================

function renderFilterButtons(categories) {
  const bar = document.getElementById("filter-bar");
  if (!bar) return;

  // ลบ filter-btn เก่าออกทั้งหมดก่อน
  bar.querySelectorAll(".filter-btn").forEach((b) => b.remove());

  const divider = bar.querySelector(".filter-divider");

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className     = "filter-btn" + (Number(activeCatId) === Number(cat.category_id) ? " active" : "");
    btn.textContent   = cat.category_name;
    btn.dataset.catId = cat.category_id;
    btn.addEventListener("click", () => filterByCategory(cat.category_id));
    bar.insertBefore(btn, divider);
  });
}

const COLOR_MAP = {
  red: "#e05252", orange: "#e07832", yellow: "#e0c832", green: "#4a8c3a",
  blue: "#3a6aac", purple: "#7a4aac", pink: "#e04a7a", brown: "#8a5a30",
  black: "#222222", white: "#f5f5f5", gray: "#909090", grey: "#909090",
  beige: "#d8ccb0", tan: "#c8a870", clear: "#d0e8f0", ash: "#b8b8a8",
};

function colorToCSS(colorName) {
  return COLOR_MAP[colorName?.toLowerCase()] ?? "#cccccc";
}

function getProductImage(product) {
  if (product.images && product.images.length > 0) {
    return product.images[0].image_url ?? product.images[0];
  }
  return `https://placehold.co/400x400/e8e4dc/888070?text=${encodeURIComponent(product.product_name)}`;
}

function buildProductCardHTML(p) {
  const inStock = p.stock_quantity > 0;
  const price   = parseFloat(p.price).toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const imgSrc  = getProductImage(p);

  return `
    <div class="product-card" onclick="goToProduct(${p.product_id}, '${encodeURIComponent(p.product_name)}')">
      <div class="card-img-wrap">
        <img src="${imgSrc}" alt="${p.product_name}" loading="lazy" />
        ${!inStock ? `<div class="out-of-stock-badge">Out Of Stock</div>` : ""}
      </div>
      <div class="card-body">
        <div class="card-category">${p.category_name}</div>
        <div class="card-name">${p.product_name}</div>
        <div class="card-color-row">
          <div class="color-dot" style="background:${colorToCSS(p.color)}"></div>
          <span class="color-label">${p.color ?? ""}</span>
        </div>
        <div class="card-price">฿${price}</div>
        <button
          class="add-to-cart-btn ${inStock ? "available" : "unavailable"}"
          onclick="handleAddToCart(event, ${p.product_id})"
          ${!inStock ? "disabled" : ""}
        >
          Add to Cart
        </button>
      </div>
    </div>`;
}

function renderProducts(products) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `<p style="color:#888;font-size:14px;grid-column:1/-1;padding:40px 0;text-align:center;">ไม่พบสินค้าในหมวดหมู่นี้</p>`;
    return;
  }

  grid.innerHTML = products.map(buildProductCardHTML).join("");
}

// ============================================================
//  Search result section
// ============================================================

function renderSearchResults(query, results) {
  // ใช้ section ที่มีอยู่แล้วใน HTML (ไม่ต้องสร้างใหม่)
  const section = document.getElementById("search-result-section");
  if (!section) return;

  if (results.length === 0) {
    section.innerHTML = `
      <div class="search-result-header">
        <span class="search-result-title">
          Search results for "<strong>${escapeHtml(query)}</strong>"
        </span>
        <button class="search-clear-btn" onclick="clearSearchResults()">✕ Clear search</button>
      </div>
      <p class="search-no-result">ไม่พบสินค้าที่ตรงกับ "<strong>${escapeHtml(query)}</strong>"</p>
    `;
    section.style.display = "block";
    return;
  }

  section.innerHTML = `
    <div class="search-result-header">
      <span class="search-result-title">
        Search results for "<strong>${escapeHtml(query)}</strong>"
        <span class="search-result-count">${results.length} item${results.length > 1 ? "s" : ""}</span>
      </span>
      <button class="search-clear-btn" onclick="clearSearchResults()">✕ Clear search</button>
    </div>
    <div class="product-grid" id="search-result-grid">
      ${results.map(buildProductCardHTML).join("")}
    </div>
  `;
  section.style.display = "block";
}

function clearSearchResults() {
  const section = document.getElementById("search-result-section");
  if (section) {
    section.style.display = "none";
    section.innerHTML = "";
  }

  const input = document.getElementById("navbar-search-input");
  if (input) input.value = "";

  isSearchMode = false;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============================================================
//  Toast
// ============================================================

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

// ============================================================
//  Helpers
// ============================================================

function getFilteredProducts() {
  if (activeCatId === null) return homeProducts;
  // ใช้ Number() ทั้งสองฝั่ง เพื่อป้องกัน type mismatch (string vs number)
  return homeProducts.filter((p) => Number(p.category) === Number(activeCatId));
}

// ============================================================
//  Actions
// ============================================================

/**
 * กรองสินค้าตาม category
 * categoryId = null  → แสดงทั้งหมด
 * categoryId = number → แสดงเฉพาะหมวดนั้น
 */
function filterByCategory(categoryId) {
  // ซ่อน search result ถ้ามี
  clearSearchResults();

  // แปลงเป็น number หรือ null
  activeCatId = categoryId !== null ? Number(categoryId) : null;

  // อัปเดต active state ของ filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const isActive = Number(btn.dataset.catId) === activeCatId;
    btn.classList.toggle("active", isActive);
  });

  // render สินค้าที่กรองแล้ว
  renderProducts(getFilteredProducts());
}

/**
 * ค้นหาสินค้าจาก keyword — match ทั้งชื่อสินค้าและหมวดหมู่
 */
function searchProductsByName(query) {
  const q = query.trim().toLowerCase();
  if (!q) return;

  isSearchMode = true;

  const matched = homeProducts.filter((p) =>
    p.product_name.toLowerCase().includes(q) ||
    p.category_name.toLowerCase().includes(q)
  );

  // scroll ขึ้นมาให้เห็นผล
  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });

  renderSearchResults(query.trim(), matched);
}

function scrollToCategoryByName(query) {
  const q = query.trim().toLowerCase();
  const matched = homeCategories.find((c) =>
    c.category_name.toLowerCase().includes(q)
  );

  document.getElementById("product-section")?.scrollIntoView({ behavior: "smooth" });

  if (matched) {
    setTimeout(() => filterByCategory(matched.category_id), 400);
  }
}

function goToProduct(productId, productName) {
  window.location.href = `/frontend/customer/product-detail/product-detail.html?id=${productId}&q=${productName}`;
}

function handleAddToCart(event, productId) {
  event.stopPropagation();
  document.dispatchEvent(new CustomEvent("home:addToCart", { detail: { productId } }));
  showToast("Added to cart! 🛒");
}

// ============================================================
//  Init
// ============================================================

async function initHome() {
  // expose ให้ navbar.js เรียกได้โดยตรง
  window.filterByCategory     = filterByCategory;
  window.searchProductsByName = searchProductsByName;
  window.clearSearchResults   = clearSearchResults;
  window.scrollToCategoryByName = scrollToCategoryByName;

  try {
    [homeCategories, homeProducts] = await Promise.all([
      homeGetCategories(),
      homeGetProducts(),
    ]);

    renderFilterButtons(homeCategories);
    renderProducts(homeProducts);

    // รองรับ ?category=xxx จาก navbar dropdown หน้าอื่น
    const params   = new URLSearchParams(window.location.search);
    const catQuery = params.get("category");
    if (catQuery) {
      scrollToCategoryByName(catQuery);
      return;
    }

    // รองรับ ?search=xxx จาก navbar หน้าอื่น
    const searchQuery = params.get("search");
    if (searchQuery) {
      setTimeout(() => searchProductsByName(searchQuery), 150);
    }

  } catch (err) {
    console.error("Home init failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", initHome);