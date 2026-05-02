/* ========================================
   Smart Furniture Warehouse โ€“ home.js
   ======================================== */

// ============================================================
//  CONFIG
// ============================================================

const HOME_USE_MOCK = false;
const HOME_API_BASE = "http://127.0.0.1:8000";

// ============================================================
//  MOCK DATA โ€” field เธ•เธฃเธเธเธฑเธ response เธเธฃเธดเธเธเธฒเธ Django
//  ๐”ฅ เน€เธเธดเนเธก images (object เนเธขเธเธ•เธฒเธกเธชเธต) เนเธฅเธฐ colors array
// ============================================================

const HOME_MOCK_DB = {
  // เธ•เธฃเธเธเธฑเธ GET /api/catalog/categories/
  categories: [
    { category_id: 1, category_name: "Sofas & Chairs" },
    { category_id: 2, category_name: "Tables & Desks" },
    { category_id: 3, category_name: "Beds & Mattresses" },
    { category_id: 4, category_name: "Curtains & Blinds" },
    { category_id: 5, category_name: "Storage" },
    { category_id: 6, category_name: "Outdoor" },
  ],

  // เธ•เธฃเธเธเธฑเธ GET /api/catalog/products/
  // ๐”ฅ images เน€เธเนเธ object { colorName: [url, url, ...] }
  // ๐”ฅ colors เน€เธเนเธ array [{ name, hex }]
  // ๐”ฅ thumbnail เธเธทเธญเธฃเธนเธเนเธฃเธเธเธญเธ default_color เนเธเนเนเธชเธ”เธเธเธ card
  products: [
    {
      product_id: 1,
      product_name: "KRYLBO Chair",
      price: "1690.00",
      stock_quantity: 10,
      default_color: "darkbeige",
      category: 1,
      category_name: "Sofas & Chairs",
      dimensions: { length: 52, width: 56, height: 80 },
      colors: [
        { name: "darkbeige", hex: "#AC967E" },
        { name: "blue", hex: "#3a4f6b" },
      ],
      images: {
        darkbeige: [
          "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-dark-beige.avif",
          "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-dark-beige2.avif",
          "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-dark-beige3.avif",
          "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-dark-beige4.avif",
        ],
        blue: [
          "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-blue.avif",
          "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-blue2.avif",
          "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-blue3.avif",
          "../assets/products/KRYLBO-Chair/krylbo-chair-tonerud-blue4.avif",
        ],
      },
    },
    {
      product_id: 2,
      product_name: "FRร–SET Chair",
      price: "1990.00",
      stock_quantity: 5,
      default_color: "whiteoak",
      category: 1,
      category_name: "Sofas & Chairs",
      dimensions: { length: 57, width: 52, height: 78 },
      colors: [
        { name: "whiteoak", hex: "#fff1d3" },
        { name: "black", hex: "#222222" },
      ],
      images: {
        whiteoak: [
          "../assets/products/FROSET-Chair/froeset-easy-chair-white.avif",
          "../assets/products/FROSET-Chair/froeset-easy-chair-white2.avif",
          "../assets/products/FROSET-Chair/froeset-easy-chair-white3.avif",
          "../assets/products/FROSET-Chair/froeset-easy-chair-white4.avif",
        ],
        black: [
          "../assets/products/FROSET-Chair/froeset-easy-chair-black.avif",
          "../assets/products/FROSET-Chair/froeset-easy-chair-black2.avif",
          "../assets/products/FROSET-Chair/froeset-easy-chair-black3.avif",
          "../assets/products/FROSET-Chair/froeset-easy-chair-black4.avif",
        ],
      },
    },
    {
      product_id: 3,
      product_name: "SKOGSTA Chair",
      price: "2150.00",
      stock_quantity: 0,
      default_color: "clearwood",
      category: 1,
      category_name: "Sofas & Chairs",
      dimensions: { length: 45, width: 51, height: 92 },
      colors: [{ name: "clearwood", hex: "#c9ad58" }],
      images: {
        brown: [
          "../assets/products/SKOGSTA-Chair/skogsta-chair-clearwood.avif",
          "../assets/products/SKOGSTA-Chair/skogsta-chair-clearwood2.avif",
          "../assets/products/SKOGSTA-Chair/skogsta-chair-clearwood3.avif",
          "../assets/products/SKOGSTA-Chair/skogsta-chair-clearwood4.avif",
        ],
      },
    },
    {
      product_id: 4,
      product_name: "TULLSTA Chair",
      price: "5990.00",
      stock_quantity: 8,
      default_color: "beige",
      category: 1,
      category_name: "Sofas & Chairs",
      dimensions: { length: 75, width: 75, height: 78 },
      colors: [
        { name: "beige", hex: "#d6ceab" },

      ],
      images: {
        brown: [
          "../assets/products/TULLSTA-Chair/tullsta-armchair-lofallet-beige.avif",
          "../assets/products/TULLSTA-Chair/tullsta-armchair-lofallet-beige2.avif",
          "../assets/products/TULLSTA-Chair/tullsta-armchair-lofallet-beige3.avif",
          "../assets/products/TULLSTA-Chair/tullsta-armchair-lofallet-beige4.avif", ,],
      },
    },
    {
      product_id: 5,
      product_name: "LISABO Chair",
      price: "1950.00",
      stock_quantity: 0,
      default_color: "whiteoak",
      category: 1,
      category_name: "Sofas & Chairs",
      dimensions: { length: 52, width: 58, height: 95 },
      colors: [{ name: "whiteoak", hex: "#fff1d3" }],
      images: {
        whiteoak: [
          "../assets/products/LISABO-Chair/lisabo-chair-whiteoak.avif",
          "../assets/products/LISABO-Chair/lisabo-chair-whiteoak2.avif",
          "../assets/products/LISABO-Chair/lisabo-chair-whiteoak3.avif",
          "../assets/products/LISABO-Chair/lisabo-chair-whiteoak4.avif",
        ],
      },
    },
    {
      product_id: 6,
      product_name: "VOXLOV Chair",
      price: "2450.00",
      stock_quantity: 12,
      default_color: "tan",
      category: 1,
      category_name: "Sofas & Chairs",
      dimensions: { length: 46, width: 51, height: 90 },
      colors: [{ name: "bamboo", hex: "#ffdda3" }],
      images: {
        bamboo: [
          "../assets/products/VOXLOV-Chair/voxloev-chair-light-bamboo.avif",
          "../assets/products/VOXLOV-Chair/voxloev-chair-light-bamboo2.avif",
          "../assets/products/VOXLOV-Chair/voxloev-chair-light-bamboo3.avif",
          "../assets/products/VOXLOV-Chair/voxloev-chair-light-bamboo4.avif",
        ],
      },
    },
    {
      product_id: 7,
      product_name: "FRร–SVI Chair",
      price: "1250.00",
      stock_quantity: 20,
      default_color: "white",
      category: 1,
      category_name: "Sofas & Chairs",
      dimensions: { length: 43, width: 48, height: 87 },
      colors: [{ name: "white", hex: "#ffffff" }],
      images: {
        white: [
          "../assets/products/FROSVI-Chair/froesvi-folding-chair-white.avif",
          "../assets/products/FROSVI-Chair/froesvi-folding-chair-white2.avif",
          "../assets/products/FROSVI-Chair/froesvi-folding-chair-white3.avif",
          "../assets/products/FROSVI-Chair/froesvi-folding-chair-white4.avif",],
      },
    },
    {
      product_id: 8,
      product_name: "TOBIAS Chair",
      price: "3950.00",
      stock_quantity: 7,
      default_color: "clear",
      category: 1,
      category_name: "Sofas & Chairs",
      dimensions: { length: 52, width: 47, height: 87 },
      colors: [{ name: "clear", hex: "#eafaff" },
      { name: "red", hex: "#d925258f" },
      ],
      images: {
        clear: [
          "../assets/products/TOBIAS-Chair/tobias-chair-transparent-chrome-plated.avif",
          "../assets/products/TOBIAS-Chair/tobias-chair-transparent-chrome-plated2.avif",
          "../assets/products/TOBIAS-Chair/tobias-chair-transparent-chrome-plated3.avif",
          "../assets/products/TOBIAS-Chair/tobias-chair-transparent-chrome-plated4.avif",
        ],
        red: [
          "../assets/products/TOBIAS-Chair/tobias-chair-brown-red-chrome-plated.avif",
          "../assets/products/TOBIAS-Chair/tobias-chair-brown-red-chrome-plated2.avif",
          "../assets/products/TOBIAS-Chair/tobias-chair-brown-red-chrome-plated3.avif",
          "../assets/products/TOBIAS-Chair/tobias-chair-brown-red-chrome-plated4.avif",]
      },
    },
    {
      product_id: 9,
      product_name: "LISABO Desk",
      price: "3990.00",
      stock_quantity: 4,
      default_color: "veneerash",
      category: 2,
      category_name: "Tables & Desks",
      dimensions: { length: 140, width: 65, height: 74 },
      colors: [{ name: "veneerash", hex: "#f1e9d5" }],
      images: {
        veneerash: [
          "../assets/products/LISABO-Desk/lisabo-desk-ash.avif",
          "../assets/products/LISABO-Desk/lisabo-desk-ash2.avif",
          "../assets/products/LISABO-Desk/lisabo-desk-ash3.avif",
        ],
      },
    },
    {
      product_id: 10,
      product_name: "ALEX Drawer Unit",
      price: "2950.00",
      stock_quantity: 6,
      default_color: "white",
      category: 2,
      category_name: "Tables & Desks",
      dimensions: { length: 36, width: 58, height: 70 },
      colors: [{ name: "white", hex: "#ffffff" },
      { name: "blackbrown", hex: "#151005" },
      ],

      images: {
        white: [
          "../assets/products/ALEX-Drawer-Unit/alex-drawer-unit-white.avif",
          "../assets/products/ALEX-Drawer-Unit/alex-drawer-unit-white2.avif",
          "../assets/products/ALEX-Drawer-Unit/alex-drawer-unit-white3.avif",],
        blackbrown: [
          "../assets/products/ALEX-Drawer-Unit/alex-drawer-unit-black-brown.avif",
          "../assets/products/ALEX-Drawer-Unit/alex-drawer-unit-black-brown2.avif",
          "../assets/products/ALEX-Drawer-Unit/alex-drawer-unit-black-brown3.avif",],
      },
    },
    {
      product_id: 11,
      product_name: "HEMNES Bed Frame",
      price: "10290.00",
      stock_quantity: 3,
      default_color: "white",
      category: 3,
      category_name: "Beds & Mattresses",
      dimensions: { length: 207, width: 168, height: 114 },
      colors: [
        { name: "white", hex: "#f5f5f5" },
      ],
      images: {
        white: [
          "../assets/products/HEMNES-Bed/hemnes-bed-frame-white-stain.avif",
          "../assets/products/HEMNES-Bed/hemnes-bed-frame-white-stain2.avif",
          "../assets/products/HEMNES-Bed/hemnes-bed-frame-white-stain3.avif",
          "../assets/products/HEMNES-Bed/hemnes-bed-frame-white-stain4.avif",],
      },
    },
    {
      product_id: 12,
      product_name: "ร…FJรLL ",
      price: "3490.00",
      stock_quantity: 0,
      default_color: "white",
      category: 3,
      category_name: "Beds & Mattresses",
      dimensions: { length: 200, width: 160, height: 16 },
      colors: [{ name: "white", hex: "#f5f5f5" }],
      images: {
        white: [
          "../assets/products/AFJALL-Mattress/afjaell-foam-mattress-firm-white.avif",
          "../assets/products/AFJALL-Mattress/afjaell-foam-mattress-firm-white2.avif",
          "../assets/products/AFJALL-Mattress/afjaell-foam-mattress-firm-white3.avif",
          "../assets/products/AFJALL-Mattress/afjaell-foam-mattress-firm-white4.avif",],
      },
    },
    {
      product_id: 13,
      product_name: "MAJGULL Curtain",
      price: "990.00",
      stock_quantity: 15,
      default_color: "gray",
      category: 4,
      category_name: "Curtains & Blinds",
      dimensions: { length: 145, width: 0, height: 300 },
      colors: [
        { name: "gray", hex: "#909090" },
        { name: "darkgreen", hex: "#30442c" },
      ],
      images: {
        gray: [
          "../assets/products/MAJGULL-Curtain/majgull-block-out-curtains-1-pair-grey.avif",
          "../assets/products/MAJGULL-Curtain/majgull-block-out-curtains-1-pair-grey2.avif",
          "../assets/products/MAJGULL-Curtain/majgull-block-out-curtains-1-pair-grey3.avif",
          "../assets/products/MAJGULL-Curtain/majgull-block-out-curtains-1-pair-grey4.avif",],
        darkgreen: [
          "../assets/products/MAJGULL-Curtain/majgull-block-out-curtains-1-pair-dark-green.avif",
          "../assets/products/MAJGULL-Curtain/majgull-block-out-curtains-1-pair-dark-green2.avif",
          "../assets/products/MAJGULL-Curtain/majgull-block-out-curtains-1-pair-dark-green3.avif",
          "../assets/products/MAJGULL-Curtain/majgull-block-out-curtains-1-pair-dark-green4.avif",],
      },
    },
    {
      product_id: 14,
      product_name: "KALLAX Shelf Unit",
      price: "1990.00",
      stock_quantity: 9,
      default_color: "white",
      category: 5,
      category_name: "Storage",
      dimensions: { length: 77, width: 39, height: 147 },
      colors: [
        { name: "white", hex: "#f5f5f5" },
        { name: "blackbrown", hex: "#151005" },
        { name: "oak", hex: "#e4cfab" },
      ],
      images: {
        white: [
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-white.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-white2.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-white3.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-white4.avif",],
        blackbrown: [
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-black-brown.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-black-brown2.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-black-brown3.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-black-brown4.avif",],
        oak: [
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-white-stained-oak.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-white-stained-oak2.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-white-stained-oak3.avif",
          "../assets/products/KALLAX-Shelf-Unit/kallax-shelving-unit-white-stained-oak4.avif",
        ]
      },
    },
    {
      product_id: 15,
      product_name: "LACKO Bench",
      price: "3190.00",
      stock_quantity: 5,
      default_color: "black",
      category: 6,
      category_name: "Outdoor",
      dimensions: { length: 130, width: 44, height: 74 },
      colors: [{ name: "black", hex: "#000000" }],
      images: {
        black: [
          "../assets/products/LACKO-Bench/laeckoe-2-seat-sofa-outdoor-black.avif",
          "../assets/products/LACKO-Bench/laeckoe-2-seat-sofa-outdoor-black2.avif",
          "../assets/products/LACKO-Bench/laeckoe-2-seat-sofa-outdoor-black3.avif",
        ],
      },
    },
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
let homeProducts = [];
let activeCatId = null;
let isSearchMode = false;

// ============================================================
//  Renderers
// ============================================================

function renderFilterButtons(categories) {
  const bar = document.getElementById("filter-bar");
  if (!bar) return;

  bar.querySelectorAll(".filter-btn").forEach((b) => b.remove());

  const divider = bar.querySelector(".filter-divider");

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (Number(activeCatId) === Number(cat.category_id) ? " active" : "");
    btn.textContent = cat.category_name;
    btn.dataset.catId = cat.category_id;
    btn.addEventListener("click", () => filterByCategory(cat.category_id));
    bar.insertBefore(btn, divider);
  });
}

const COLOR_MAP = {
  red: "#e05252", orange: "#e07832", yellow: "#e0c832", green: "#4a8c3a",
  blue: "#3a6aac", purple: "#7a4aac", pink: "#e04a7a", brown: "#8a5a30",
  black: "#222222", white: "#f5f5f5", gray: "#909090", grey: "#909090",
  darkbeige: "#AC967E", tan: "#c8a870", clear: "#d0e8f0", ash: "#b8b8a8",
};

function colorToCSS(colorName) {
  return COLOR_MAP[colorName?.toLowerCase()] ?? "#cccccc";
}

// ============================================================
//  ๐”ฅ getThumbnail โ€” เธ”เธถเธเธฃเธนเธ thumbnail เธเธฒเธ product เธชเธณเธซเธฃเธฑเธ card
// ============================================================
function getThumbnail(product) {
  const defaultColor = product.default_color;

  // เธเธฃเธ“เธตเธ—เธตเน images เน€เธเนเธ object เนเธขเธเธ•เธฒเธกเธชเธต (format เนเธซเธกเน)
  if (product.images && typeof product.images === "object" && !Array.isArray(product.images)) {
    const colorImages = product.images[defaultColor] || Object.values(product.images)[0] || [];
    return colorImages[0] || `https://placehold.co/400x400/e8e4dc/888070?text=${encodeURIComponent(product.ProductName)}`;
  }

  // เธเธฃเธ“เธตเน€เธเนเธ string
  if (typeof product.images === "string") return product.images;

  // เธเธฃเธ“เธตเน€เธเนเธ array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    return typeof first === "string" ? first : (first?.image_url || "");
  }

  return `https://placehold.co/400x400/e8e4dc/888070?text=${encodeURIComponent(product.ProductName)}`;
}

function buildProductCardHTML(p) {
  const inStock = p.StockQuantity > 0;
  const price = parseFloat(p.Price).toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const imgSrc = getThumbnail(p);

  // เนเธชเธ”เธเธชเธตเธเธญเธ default_color เธชเธณเธซเธฃเธฑเธ dot เธเธ card
  const displayColor = p.default_color || (p.colors?.[0]?.name ?? "");
  const colorHex = p.colors?.find(c => c.name === displayColor)?.hex || colorToCSS(displayColor);

  return `
    <div class="product-card" onclick="goToProduct(${p.ProductID})">
      <div class="card-img-wrap">
        <img src="${imgSrc}" alt="${p.ProductName}" loading="lazy" />
        ${!inStock ? `<div class="out-of-stock-badge">Out Of Stock</div>` : ""}
      </div>
      <div class="card-body">
        <div class="card-category">${p.category_name}</div>
        <div class="card-name">${p.ProductName}</div>
        <div class="card-color-row">
          <div class="color-dot" style="background:${colorHex}"></div>
          <span class="color-label">${displayColor}</span>
        </div>
        <div class="card-price">เธฟ${price}</div>
        <button
          class="add-to-cart-btn ${inStock ? "available" : "unavailable"}"
          onclick="handleAddToCart(event, ${p.ProductID})"
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
    grid.innerHTML = `<p style="color:#888;font-size:14px;grid-column:1/-1;padding:40px 0;text-align:center;">เนเธกเนเธเธเธชเธดเธเธเนเธฒเนเธเธซเธกเธงเธ”เธซเธกเธนเนเธเธตเน</p>`;
    return;
  }

  grid.innerHTML = products.map(buildProductCardHTML).join("");
}

// ============================================================
//  Search result section
// ============================================================

function renderSearchResults(query, results) {
  const section = document.getElementById("search-result-section");
  if (!section) return;

  if (results.length === 0) {
    section.innerHTML = `
      <div class="search-result-header">
        <span class="search-result-title">
          Search results for "<strong>${escapeHtml(query)}</strong>"
        </span>
        <button class="search-clear-btn" onclick="clearSearchResults()">โ• Clear search</button>
      </div>
      <p class="search-no-result">เนเธกเนเธเธเธชเธดเธเธเนเธฒเธ—เธตเนเธ•เธฃเธเธเธฑเธ "<strong>${escapeHtml(query)}</strong>"</p>
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
      <button class="search-clear-btn" onclick="clearSearchResults()">โ• Clear search</button>
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
  return homeProducts.filter((p) => Number(p.category) === Number(activeCatId));
}

// ============================================================
//  Actions
// ============================================================

function filterByCategory(categoryId) {
  clearSearchResults();
  activeCatId = categoryId !== null ? Number(categoryId) : null;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const isActive = Number(btn.dataset.catId) === activeCatId;
    btn.classList.toggle("active", isActive);
  });

  renderProducts(getFilteredProducts());
}

function searchProductsByName(query) {
  const q = query.trim().toLowerCase();
  if (!q) return;

  isSearchMode = true;

  const matched = homeProducts.filter((p) =>
    p.ProductName.toLowerCase().includes(q) ||
    p.category_name.toLowerCase().includes(q)
  );

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

// ============================================================
//  ๐”ฅ goToProduct โ€” เธเธฑเธเธ—เธถเธ product object เนเธเธ full เธฅเธ localStorage
//     product.js เธเธฐเธฃเธฑเธเนเธเนเธเนเนเธ”เธขเธ•เธฃเธ เนเธกเนเธ•เนเธญเธ hardcode เธญเธฐเนเธฃเน€เธฅเธข
// ============================================================
function goToProduct(productId) {
  const product = homeProducts.find((p) => p.ProductID === productId);
  if (!product) return;

  // เธเธฑเธเธ—เธถเธ full product object (เธกเธต images object + colors array เนเธฅเนเธง)
  localStorage.setItem("selectedProduct", JSON.stringify(product));
  window.location.href = `/frontend/customer/product-detail/product-detail.html?id=${productId}`;
}

// ============================================================
//  Init
// ============================================================

async function initHome() {
  window.filterByCategory = filterByCategory;
  window.searchProductsByName = searchProductsByName;
  window.clearSearchResults = clearSearchResults;
  window.scrollToCategoryByName = scrollToCategoryByName;

  try {
    [homeCategories, homeProducts] = await Promise.all([
      homeGetCategories(),
      homeGetProducts(),
    ]);

    renderFilterButtons(homeCategories);
    renderProducts(homeProducts);

    const params = new URLSearchParams(window.location.search);
    const catQuery = params.get("category");
    if (catQuery) {
      scrollToCategoryByName(catQuery);
      return;
    }

    const searchQuery = params.get("search");
    if (searchQuery) {
      setTimeout(() => searchProductsByName(searchQuery), 150);
    }

  } catch (err) {
    console.error("Home init failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", initHome);

