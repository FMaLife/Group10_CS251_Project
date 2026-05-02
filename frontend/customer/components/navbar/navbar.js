// ============================================================
//  API BASE URL
//  - ถ้ารัน Django กับ frontend คนละ port (เช่น Live Preview)
//    ให้ใส่ URL เต็ม เช่น "http://127.0.0.1:8000"
//  - ถ้า Django serve frontend ด้วย (same origin) ใส่ ""
// ============================================================
const API_BASE = "http://127.0.0.1:8000";  // ← แก้ port ที่นี่

// ============================================================
//  API layer
// ============================================================

// ----> get user data from localStorage
function loadUserProfile() {
  try {
    const raw = localStorage.getItem("customer"); // key ตรงกับที่ log-in.js บันทึกไว้
    if (!raw) return updateProfile(null);

    const customer = JSON.parse(raw);

    // แปลง key ให้ตรงกับที่ updateProfile() ใช้ (first_name / last_name)
    updateProfile({
      first_name: customer.firstName,
      last_name:  customer.lastName,
      email:      customer.email
    });
  } catch {
    updateProfile(null);
  }
}

async function fetchCategories() {
  const res = await fetch(`${API_BASE}/api/catalog/categories/`);

  if (!res.ok) {
    throw new Error(`Categories API error: ${res.status}`);
  }

  return res.json();
}

async function fetchCartCount() {
  try {
    const raw = localStorage.getItem("customer");
    if (!raw) return 0;
    const customer = JSON.parse(raw);
    if (!customer?.customerID) return 0;

    const res = await fetch(
      `${API_BASE}/api/cart/?customer=${customer.customerID}`
    );
    if (!res.ok) {
      throw new Error(`Cart API error: ${res.status}`);
    }
    const data = await res.json();
    return (data.items || []).length;

  } catch (err) {
    console.error("fetchCartCount failed:", err);
    return 0;
  }
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
  const btn    = document.getElementById("navbar-account-btn");
  const wrap   = document.getElementById("profile-wrap");

  if (!nameEl) return;

  if (!user) {
    nameEl.textContent = "Log in";
    wrap?.classList.remove("has-user");
    btn?.addEventListener("click", () => {
      window.location.href = "/frontend/customer/auth/login/log-in.html";
    }, { once: true });
    return;
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  nameEl.textContent = fullName || "Your Account";
  wrap?.classList.add("has-user");
}

async function handleLogout() {
  try {
    await fetch(`${API_BASE}/api/accounts/customer/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch { /* ถ้า network fail ก็ logout local ต่อ */ }

  localStorage.removeItem("customer");
  window.location.href = "/frontend/customer/auth/login/log-in.html";
}

function renderCategories(categories) {
  const list = document.getElementById("category-dropdown");
  if (!list) return;
  list.innerHTML = categories
    .map((cat) => `
      <li>
        <a class="dropdown-item" data-cat-id="${cat.categoryId}" data-cat-name="${cat.categoryName}" href="#">
          ${cat.categoryName}
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
  const badge = document.getElementById("cart-qty-badge");
  if (!badge) return;
  badge.textContent = count > 99 ? "99+" : String(count);
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
    const [categories, cartCount] = await Promise.all([
      fetchCategories(),
      fetchCartCount(),
    ]);
    allNavCategories = categories;
    renderCategories(categories);
    updateCartBadge(cartCount);
  } catch (err) {
    console.error("Navbar init failed:", err);
  }
  loadUserProfile();
  setupSearch();
  setupCategoryDropdown();
  setupCartButton();
  setupContactUs();

  document.getElementById("logout-btn")
    ?.addEventListener("click", handleLogout);
}

// initNavbar() is called by each page's inline script after navbar HTML is injected