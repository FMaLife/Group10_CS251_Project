// ============================================================
//  CONFIG — สลับแค่บรรทัดนี้บรรทัดเดียว
//  true  = ใช้ mock data | false = ใช้ API จริง
// ============================================================

const FOOTER_USE_MOCK = true;
const FOOTER_API_BASE = "http://127.0.0.1:8000";

// ============================================================
//  MOCK DATA — field ตรงกับ GET /api/catalog/categories/
// ============================================================

const FOOTER_MOCK_CATEGORIES = [
    // ตรงกับ GET /api/catalog/categories/
    { category_id: 1, category_name: "Sofas & Chairs"     },
    { category_id: 2, category_name: "Tables & Desks"     },
    { category_id: 3, category_name: "Beds & Mattresses"  },
    { category_id: 4, category_name: "Curtains & Blinds"  },
    { category_id: 5, category_name: "Storage"            },
    { category_id: 6, category_name: "Outdoor"            },
];

// ============================================================
//  API layer
// ============================================================

async function footerFetchCategories() {
  if (FOOTER_USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(FOOTER_MOCK_CATEGORIES), 100)
    );
  }
  const res = await fetch(`${FOOTER_API_BASE}/api/catalog/categories/`);
  return res.json();
}

// ============================================================
//  Helpers
// ============================================================

function footerIsHomePage() {
  return window.location.pathname.endsWith("home.html")
    || window.location.pathname === "/"
    || window.location.pathname.endsWith("/");
}

// ============================================================
//  Actions
// ============================================================

// กด category → ถ้าอยู่หน้า home: scroll + filter
//               ถ้าหน้าอื่น: ไป home?category=xxx
function footerHandleCategoryClick(categoryId, categoryName) {
  if (footerIsHomePage()) {
    document.getElementById("product-section")
      ?.scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      if (typeof window.filterByCategory === "function") {
        window.filterByCategory(categoryId);
      }
    }, 400);
  } else {
    window.location.href =
      `/frontend/customer/home/home.html?category=${encodeURIComponent(categoryName)}`;
  }
}

// กด Cart → scroll ขึ้นบนสุด แล้วเปิด cart overlay
function footerOpenCart() {
  window.scrollTo({ top: 0, behavior: "smooth" });

  // รอ scroll เสร็จก่อนเปิด cart
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent("navbar:openCart"));
  }, 400);
}

// ============================================================
//  Renderers
// ============================================================

function renderFooterCategories(categories) {
  const container = document.getElementById("footer-categories");
  if (!container) return;

  container.innerHTML = categories
    .map(
      (cat) => `
        <button
          class="footer-cat-link"
          data-cat-id="${cat.category_id}"
          data-cat-name="${cat.category_name}"
        >
          ${cat.category_name}
        </button>`
    )
    .join("");

  // bind click
  container.querySelectorAll(".footer-cat-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      footerHandleCategoryClick(
        Number(btn.dataset.catId),
        btn.dataset.catName
      );
    });
  });
}

// ============================================================
//  Event setup
// ============================================================

function setupFooterCartLink() {
  document.getElementById("footer-cart-link")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      footerOpenCart();
    });
}

// ============================================================
//  Init
// ============================================================

async function initFooter() {
  try {
    const categories = await footerFetchCategories();
    renderFooterCategories(categories);
  } catch (err) {
    console.error("Footer init failed:", err);
  }

  setupFooterCartLink();
}

// footer.js โหลดหลัง DOM inject แล้ว — เรียกตรงๆ ได้เลย
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFooter);
} else {
  initFooter();
}