/* ========================================
   Smart Furniture Warehouse — home.js
   ======================================== */

// ============================================================
//  API layer — เรียก API จริง
// ============================================================

const HOME_API_BASE = "http://127.0.0.1:8000";

async function homeGetCategories() {
  const res = await fetch(`${HOME_API_BASE}/api/catalog/categories/`);
  if (!res.ok) throw new Error('Categories API error: ' + res.status);
  return res.json();
}

async function homeGetProducts() {
  const res = await fetch(`${HOME_API_BASE}/api/catalog/products/`);
  if (!res.ok) throw new Error('Products API error: ' + res.status);
  return res.json();
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
    btn.className = "filter-btn" + (Number(activeCatId) === Number(cat.categoryId) ? " active" : "");
    btn.textContent = cat.categoryName;
    btn.dataset.catId = cat.categoryId;
    btn.addEventListener("click", () => filterByCategory(cat.categoryId));
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
//  getThumbnail — ดึงรูป thumbnail จาก product สำหรับ card
// ============================================================
function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${HOME_API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getThumbnail(product) {
  if (product.primaryImage?.imageUrl) return resolveImageUrl(product.primaryImage.imageUrl);

  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    const raw = typeof first === "string" ? first : (first?.imageUrl ?? first?.image_url ?? "");
    return resolveImageUrl(raw);
  }

  return `https://placehold.co/400x400/e8e4dc/888070?text=${encodeURIComponent(product.productName ?? "")}`;
}

function buildProductCardHTML(p) {
  const inStock = (p.stockQuantity ?? 0) > 0;
  const price = parseFloat(p.price).toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const imgSrc = getThumbnail(p);
  const displayColor = p.color ?? "";
  const colorHex = colorToCSS(displayColor);

  return `
    <div class="product-card" onclick="goToProduct(${p.productId})">
      <div class="card-img-wrap">
        <img src="${imgSrc}" alt="${p.productName}" loading="lazy" />
        ${!inStock ? `<div class="out-of-stock-badge">Out Of Stock</div>` : ""}
      </div>
      <div class="card-body">
        <div class="card-category">${p.categoryName}</div>
        <div class="card-name">${p.productName}</div>
        <div class="card-color-row">
          <div class="color-dot" style="background:${colorHex}"></div>
          <span class="color-label">${displayColor}</span>
        </div>
        <div class="card-price">฿${price}</div>
        <button
          class="add-to-cart-btn ${inStock ? "available" : "unavailable"}"
          onclick="handleAddToCart(event, ${p.productId})"
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
  return homeProducts.filter((p) => Number(p.categoryId) === Number(activeCatId));
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
    (p.productName ?? "").toLowerCase().includes(q) ||
    (p.categoryName ?? "").toLowerCase().includes(q)
  );

  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  renderSearchResults(query.trim(), matched);
}

function scrollToCategoryByName(query) {
  const q = query.trim().toLowerCase();
  const matched = homeCategories.find((c) =>
    (c.categoryName ?? "").toLowerCase().includes(q)
  );

  document.getElementById("product-section")?.scrollIntoView({ behavior: "smooth" });

  if (matched) {
    setTimeout(() => filterByCategory(matched.categoryId), 400);
  }
}

// ============================================================
//  goToProduct — บันทึก product ลง localStorage แล้วไปหน้า detail
// ============================================================
function goToProduct(productId) {
  const product = homeProducts.find((p) => p.productId === productId);
  if (!product) return;

  localStorage.setItem("selectedProduct", JSON.stringify(product));
  window.location.href = `/frontend/customer/product-detail/product-detail.html?id=${productId}`;
}

// ============================================================
//  Login-required Modal
// ============================================================

function showLoginRequiredModal() {
  if (!document.getElementById('login-required-modal')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="login-required-modal" style="
        position:fixed;inset:0;z-index:99999;
        display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);">
        <div style="
          background:#fff;border-radius:16px;padding:36px 32px;
          max-width:360px;width:90%;text-align:center;
          box-shadow:0 8px 40px rgba(0,0,0,0.18);">
          <div style="font-size:40px;margin-bottom:12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24"><g fill="none"><path stroke="#e87d96" stroke-linecap="round" stroke-width="1.5" d="M17 7c0-3.314-1.988-5-5-5S7 3.686 7 7m5 5v2.5"/><path fill="#e87d96" d="m9.266 20.615l.455-.596zM12 8.931l-.532.528a.75.75 0 0 0 1.064 0zm2.734 11.684l.456.597zm-5.013-.596c-1.37-1.045-2.852-2.055-4.029-3.338c-1.15-1.254-1.942-2.705-1.942-4.582h-1.5c0 2.361 1.017 4.157 2.337 5.596c1.294 1.411 2.945 2.54 4.224 3.517zM3.75 12.1c0-1.824 1.065-3.364 2.535-4.015c1.429-.632 3.352-.466 5.183 1.375l1.064-1.057c-2.22-2.232-4.795-2.6-6.854-1.69C3.66 7.606 2.25 9.687 2.25 12.1zm5.06 9.113c.461.351.96.73 1.466 1.016c.507.287 1.09.522 1.724.522v-1.5c-.266 0-.583-.1-.985-.328c-.402-.227-.82-.541-1.294-.903zm6.38 0c1.278-.977 2.929-2.106 4.223-3.517c1.32-1.439 2.337-3.235 2.337-5.596h-1.5c0 1.877-.792 3.328-1.942 4.582c-1.177 1.283-2.66 2.293-4.029 3.338zm6.56-9.113c0-2.413-1.41-4.494-3.428-5.386c-2.059-.912-4.635-.543-6.854 1.689l1.064 1.057c1.83-1.841 3.754-2.007 5.183-1.375c1.47.65 2.535 2.19 2.535 4.015zm-7.47 7.92c-.475.362-.893.676-1.295.903c-.402.228-.72.328-.985.328v1.5c.634 0 1.217-.235 1.724-.522s1.005-.665 1.466-1.016z"/></g></svg>
          </div>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#222;">
            Please log in
          </h2>
          <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6;">
            You need to be logged in to add items to your cart.
          </p>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button
              onclick="document.getElementById('login-required-modal').remove()"
              style="padding:10px 20px;border-radius:8px;border:1.5px solid #ccc;
                     background:#fff;color:#555;font-size:14px;cursor:pointer;">
              Cancel
            </button>
            <button
              onclick="window.location.href='/frontend/customer/auth/login/log-in.html'"
              style="padding:10px 24px;border-radius:8px;border:none;
                     background:#53A143;color:#fff;font-size:14px;
                     font-weight:600;cursor:pointer;">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    `);
  } else {
    document.getElementById('login-required-modal').style.display = 'flex';
  }

  document.getElementById('login-required-modal')
    ?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.remove();
    }, { once: true });
}

// ============================================================
//  Add to Cart
// ============================================================

async function handleAddToCart(event, productId) {
  event.stopPropagation();

  let customer = null;
  try {
    const raw = localStorage.getItem('customer');
    if (raw) customer = JSON.parse(raw);
  } catch { customer = null; }

  if (!customer?.customerID) {
    showLoginRequiredModal();
    return;
  }

  try {
    const cartRes = await fetch(`${HOME_API_BASE}/api/cart/?customer=${customer.customerID}`);
    if (!cartRes.ok) throw new Error('Could not fetch cart: ' + cartRes.status);
    const cartData = await cartRes.json();
    const cartId = cartData.cart_id;

    const itemRes = await fetch(`${HOME_API_BASE}/api/cart/items/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart:     cartId,
        product:  productId,
        quantity: 1,
      }),
    });

    if (!itemRes.ok) throw new Error('Add to cart failed: ' + itemRes.status);

    showToast('✓ Added to cart!');

    const badge = document.getElementById('cart-badge');
    if (badge) {
      const current = parseInt(badge.textContent) || 0;
      const next = current + 1;
      badge.textContent   = next > 99 ? '99+' : next;
      badge.style.display = 'flex';
    }
  } catch (err) {
    console.error(err);
    showToast('❌ Could not add to cart. Please try again.');
  }
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
