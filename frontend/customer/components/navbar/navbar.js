// ============================================================
//  CONFIG — สลับแค่บรรทัดนี้บรรทัดเดียว
//  true  = ใช้ mock data (ไม่ต้องรัน Django)
//  false = ใช้ API จริง
// ============================================================
const USE_MOCK = true;

// ============================================================
//  API BASE URL
//  - ถ้ารัน Django กับ frontend คนละ port (เช่น Live Preview)
//    ให้ใส่ URL เต็ม เช่น "http://127.0.0.1:8000"
//  - ถ้า Django serve frontend ด้วย (same origin) ใส่ ""
// ============================================================
const API_BASE = "http://127.0.0.1:8000";  // ← แก้ port ที่นี่

// ============================================================
//  MOCK DATA — แก้ให้ตรงกับ response จริงจาก Django
// ============================================================
const MOCK_DB = {
  // ตรงกับ GET /api/catalog/categories/
  categories: [
    { category_id: 1, category_name: "Living Room" },
    { category_id: 2, category_name: "Bedroom"     },
    { category_id: 3, category_name: "Dining Room" },
    { category_id: 4, category_name: "Office"      },
    { category_id: 5, category_name: "Outdoor"     },
    { category_id: 6, category_name: "Storage"     },
  ],
  // ตรงกับ GET /api/cart/ (ปรับ field ให้ตรงเมื่อมี API จริง)
  cart: { itemCount: 3 },
};

// ============================================================
//  API layer — mock และ real ใช้ signature เดียวกันทุก function
//  เปลี่ยน USE_MOCK แล้วไม่ต้องแตะโค้ดส่วนอื่นเลย
// ============================================================

async function fetchCategories() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_DB.categories), 120)
    );
  }
  const res = await fetch(`${API_BASE}/api/catalog/categories/`);
  return res.json(); // คืน array ตรงๆ ตาม response จริง
}

async function fetchCartCount() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_DB.cart.itemCount), 120)
    );
  }
  const res  = await fetch(`${API_BASE}/api/cart/`);
  const data = await res.json();
  return data.itemCount; // ปรับ field ให้ตรงกับ response จริง
}

// ============================================================
//  State
// ============================================================

let dropdownOpen = false;

// ============================================================
//  DOM helpers
// ============================================================

function renderCategories(categories) {
  const list = document.getElementById("category-dropdown");
  if (!list) return;
  list.innerHTML = categories
    .map(
      (cat) => `
        <li>
          <a href="category.html?id=${cat.category_id}" class="dropdown-item">
            ${cat.category_name}
          </a>
        </li>`
    )
    .join("");
}

function updateCartBadge(count) {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  badge.textContent   = count > 99 ? "99+" : count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function positionDropdown() {
  const btn      = document.getElementById("category-btn");
  const dropdown = document.getElementById("category-dropdown");
  if (!btn || !dropdown) return;

  const rect   = btn.getBoundingClientRect();
  const margin = 8;

  dropdown.style.position = "fixed";
  dropdown.style.top      = rect.bottom + 8 + "px";
  dropdown.style.left     = rect.left + "px";
  dropdown.style.right    = "auto";
  dropdown.style.zIndex   = "9999";
  dropdown.style.minWidth = rect.width + "px";

  const dropW = dropdown.offsetWidth;
  if (rect.left + dropW > window.innerWidth - margin) {
    dropdown.style.left = Math.max(margin, window.innerWidth - dropW - margin) + "px";
  }
}

function openDropdown() {
  const dropdown = document.getElementById("category-dropdown");
  if (!dropdown) return;

  if (dropdown.parentElement !== document.body) {
    document.body.appendChild(dropdown);
  }

  dropdownOpen = true;
  positionDropdown();
  dropdown.classList.add("open");
  document.getElementById("category-btn")?.setAttribute("aria-expanded", true);
}

function closeDropdown() {
  dropdownOpen = false;
  document.getElementById("category-dropdown")?.classList.remove("open");
  document.getElementById("category-btn")?.setAttribute("aria-expanded", false);
}

function toggleDropdown() {
  dropdownOpen ? closeDropdown() : openDropdown();
}

function scrollToFooter() {
  const footer = document.querySelector("footer");
  if (footer) {
    footer.scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.href = "home.html#footer";
  }
}

function navigateToSearch() {
  const input = document.getElementById("navbar-search-input");
  const q = input?.value.trim();
  if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
}

// ============================================================
//  Event listeners
// ============================================================

function setupSearch() {
  document.getElementById("navbar-search-btn")
    ?.addEventListener("click", navigateToSearch);

  document.getElementById("navbar-search-input")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") navigateToSearch();
    });
}

function setupCategoryDropdown() {
  document.getElementById("category-btn")
    ?.closest(".nav-dropdown-wrap")
    ?.addEventListener("click", (e) => e.stopPropagation());

  document.getElementById("category-btn")
    ?.addEventListener("click", toggleDropdown);

  document.addEventListener("click", closeDropdown);
}

function setupCartButton() {
  document.getElementById("cart-icon-btn")
    ?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("navbar:openCart"));
    });
}

function setupContactUs() {
  document.getElementById("contact-us-link")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToFooter();
    });
}

// ============================================================
//  Init
// ============================================================

async function initNavbar() {
  try {
    const [categories, cartCount] = await Promise.all([
      fetchCategories(),
      fetchCartCount(),
    ]);
    renderCategories(categories);
    updateCartBadge(cartCount);
  } catch (err) {
    console.error("Navbar init failed:", err);
  }

  setupSearch();
  setupCategoryDropdown();
  setupCartButton();
  setupContactUs();
}

initNavbar();