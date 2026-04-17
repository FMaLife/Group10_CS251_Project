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
    { category_id: 1, category_name: "Sofas & Chairs"     },
    { category_id: 2, category_name: "Tables & Desks"     },
    { category_id: 3, category_name: "Beds & Mattresses"  },
    { category_id: 4, category_name: "Curtains & Blinds"  },
    { category_id: 5, category_name: "Storage"            },
    { category_id: 6, category_name: "Outdoor"            },
  ],
  products: [
    { product_id: 1,  product_name: "KOARP Armchair",          category: 1, category_name: "Sofas & Chairs"    },
    { product_id: 2,  product_name: "FRÖSET Chair",            category: 1, category_name: "Sofas & Chairs"    },
    { product_id: 3,  product_name: "SKOGSTA Chair",           category: 1, category_name: "Sofas & Chairs"    },
    { product_id: 4,  product_name: "TULLSTA Chair",           category: 1, category_name: "Sofas & Chairs"    },
    { product_id: 5,  product_name: "LISABO Desk",             category: 2, category_name: "Tables & Desks"    },
    { product_id: 6,  product_name: "ALEX Drawer Unit",        category: 2, category_name: "Tables & Desks"    },
    { product_id: 7,  product_name: "HEMNES Bed Frame",        category: 3, category_name: "Beds & Mattresses" },
    { product_id: 8,  product_name: "MALFORS Mattress",        category: 3, category_name: "Beds & Mattresses" },
    { product_id: 9,  product_name: "MAJGULL Blackout Curtain",category: 4, category_name: "Curtains & Blinds" },
    { product_id: 10, product_name: "KALLAX Shelf Unit",       category: 5, category_name: "Storage"           },
    { product_id: 11, product_name: "ÄPPLARÖ Bench",           category: 6, category_name: "Outdoor"           },
  ],
  cart: { itemCount: 3 },
  user: {
    customer_id:  1,
    first_name:   "Natasha",
    last_name:    "Romanoff",
    email:        "natasha.ro@mail.com",
    phone_number: "0123456789",
    addresses:    [] }
};

// ============================================================
//  API layer — mock และ real ใช้ signature เดียวกันทุก function
//  เปลี่ยน USE_MOCK แล้วไม่ต้องแตะโค้ดส่วนอื่นเลย
// ============================================================

async function fecthUserProfile() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_DB.user), 120)
    );
  }
  const res = await fetch(`${API_BASE}/api/accounts/customers/`);
  return res.json();
}

// ----> get user data from localStorage
// function loadUserProfile() {
//   const raw = localStorage.getItem("user");
//   if (!raw) return updateProfile(null);

//   const user = JSON.parse(raw);
//   updateProfile(user);
// }

async function fetchCategories() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_DB.categories), 120)
    );
  }
  const res = await fetch(`${API_BASE}/api/catalog/categories/`);
  return res.json();
}

async function fetchProducts() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_DB.products), 120)
    );
  }
  const res = await fetch(`${API_BASE}/api/catalog/products/`);
  return res.json();
}

async function fetchCartCount() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_DB.cart.itemCount), 120)
    );
  }
  const res  = await fetch(`${API_BASE}/api/cart/`);
  const data = await res.json();
  return data.itemCount;
}

// ============================================================
//  State
// ============================================================

let dropdownOpen     = false;
let allNavCategories = [];

// ============================================================
//  Helpers
// ============================================================

// ตรวจว่าอยู่หน้า home อยู่หรือเปล่า
function isHomePage() {
  return window.location.pathname.endsWith("home.html")
    || window.location.pathname === "/"
    || window.location.pathname.endsWith("/");
}

// ============================================================
//  DOM helpers
// ============================================================

function updateProfile(user) {
  const nameEl = document.getElementById("navbar-account-name");
  const linkEl = document.getElementById("navbar-account-link");

  if (!nameEl || !linkEl) return;

  if (!user) {
    nameEl.textContent = "Log in";
    linkEl.href = "/frontend/customer/auth/login/login.html";
    return;
  }

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ");

  nameEl.textContent = fullName || "Your Account";
  linkEl.href = "/frontend/customer/profile/profile.html";
}

function renderCategories(categories) {
  const list = document.getElementById("category-dropdown");
  if (!list) return;
  list.innerHTML = categories
    .map((cat) => `
      <li>
        <a class="dropdown-item" data-cat-id="${cat.category_id}" data-cat-name="${cat.category_name}" href="#">
          ${cat.category_name}
        </a>
      </li>`)
    .join("");

  list.querySelectorAll(".dropdown-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      closeDropdown();
      handleCategoryClick(
        Number(link.dataset.catId),
        link.dataset.catName
      );
    });
  });
}

function updateCartBadge(count) {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  badge.textContent   = count > 99 ? "99+" : count;
  badge.style.display = count > 0 ? "flex" : "none";
}

// ============================================================
//  Category click
// ============================================================

function handleCategoryClick(categoryId, categoryName) {
  // อยู่หน้า home
  if (isHomePage()) {
    // ล้าง search result ก่อน แล้วค่อย filter category
    if (typeof window.clearSearchResults === "function") {
      window.clearSearchResults();
    }
    const section = document.getElementById("product-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
    // รอ scroll เสร็จก่อนแล้วค่อย filter
    setTimeout(() => {
      if (typeof window.filterByCategory === "function") {
        window.filterByCategory(categoryId);
      }
    }, 400);
  } else {
    // หน้าอื่น → ไป home พร้อม query string แล้ว home.js จะ pick up เอง
    window.location.href = `/frontend/customer/home/home.html?category=${encodeURIComponent(categoryName)}`;
  }
}

// ============================================================
//  Search — ไม่มี suggestion, กด Enter/ปุ่ม → แสดงผลใน home
// ============================================================

function navigateToSearch() {
  const input = document.getElementById("navbar-search-input");
  const q = input?.value.trim();
  if (!q) return;

  if (isHomePage()) {
    // เรียก home.js โดยตรง
    if (typeof window.searchProductsByName === "function") {
      window.searchProductsByName(q);
    }
  } else {
    // หน้าอื่น → ไปหน้า home พร้อม query string
    window.location.href = `/frontend/customer/home/home.html?search=${encodeURIComponent(q)}`;
  }
}

// ============================================================
//  Dropdown position + open/close
// ============================================================

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

// ============================================================
//  Event setup
// ============================================================

function setupSearch() {
  const input = document.getElementById("navbar-search-input");

  document.getElementById("navbar-search-btn")
    ?.addEventListener("click", navigateToSearch);

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      if (typeof window.clearSearchResults === "function") {
        window.clearSearchResults();
      }
      return;
    }
    if (e.key === "Enter") {
      navigateToSearch();
      return;
    }
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

// click Contact Us -> scroll down to footer
function setupContactUs() {
  document.getElementById("contact-us-link")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      const footer = document.querySelector("footer");
      if (footer) {
        footer.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/frontend/customer/home/home.html#footer";
      }
    });
}

// ============================================================
//  Init
// ============================================================

async function initNavbar() {
  try {
    const [categories, cartCount, user] = await Promise.all([
      fetchCategories(),
      fetchCartCount(),
      fecthUserProfile(),
    ]);
    allNavCategories = categories;
    renderCategories(categories);
    updateCartBadge(cartCount);
    updateProfile(user);
  } catch (err) {
    console.error("Navbar init failed:", err);
  }
  // loadUserProfile();
  setupSearch();
  setupCategoryDropdown();
  setupCartButton();
  setupContactUs();
}

initNavbar();