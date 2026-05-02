// ============================================================
//  CONFIG
// ============================================================

const PROFILE_USE_MOCK = false;
const PROFILE_API_BASE = "http://127.0.0.1:8000";

// ============================================================
//  MOCK DATA — เปลี่ยนเป็น API จริงเมื่อพร้อม
// ============================================================

const MOCK_PROFILE = {
  first_name:  "Adisorn",
  last_name:   "Songsakdina",
  phone:       "087xxxxxxxx",
  email:       "adisorn.song@gmail.com",
  avatar_url:  null,
};

// ============================================================
//  API layer
// ============================================================

async function fetchProfile() {
  if (PROFILE_USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_PROFILE), 100)
    );
  }
  const res = await fetch(`${PROFILE_API_BASE}/api/customers/profile`, {
    credentials: "include",
  });
  if (res.status === 401) {
    window.location.href = "/frontend/customer/auth/login/log-in.html";
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

async function updateProfile(payload) {
  if (PROFILE_USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true }), 400)
    );
  }
  const res = await fetch(`${PROFILE_API_BASE}/api/customers/profile/update`, {
    method:      "PUT",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

// ============================================================
//  DOM helpers
// ============================================================

function getEl(id) { return document.getElementById(id); }

function setError(fieldId, msg) {
  const el = getEl(`${fieldId}-error`);
  const input = getEl(fieldId);
  if (el)    el.textContent = msg;
  if (input) input.classList.toggle("error", !!msg);
}

function clearErrors() {
  ["first-name", "last-name", "phone", "email", "password", "confirm-password"]
    .forEach((id) => setError(id, ""));
}

// ============================================================
//  Toast
// ============================================================

let toastTimer;
function showToast(msg, type = "") {
  const toast = getEl("profile-toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = `profile-toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ============================================================
//  Avatar
// ============================================================

function initAvatar(avatarUrl, firstName) {
  const initial  = getEl("avatar-initial");
  const img      = getEl("avatar-img");
  const uploadBtn = getEl("avatar-upload-btn");
  const fileInput = getEl("avatar-file-input");

  // แสดง initial จากชื่อ
  if (initial && firstName) {
    initial.textContent = firstName.charAt(0).toUpperCase();
  }

  // ถ้ามีรูปอยู่แล้ว
  if (avatarUrl && img) {
    img.src = avatarUrl;
    img.classList.add("visible");
    if (initial) initial.style.display = "none";
  }

  // คลิก avatar หรือปุ่ม → เปิด file picker
  [getEl("avatar"), uploadBtn].forEach((el) => {
    el?.addEventListener("click", () => fileInput?.click());
  });

  // Preview รูปที่เลือก
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (img) {
        img.src = ev.target.result;
        img.classList.add("visible");
        if (initial) initial.style.display = "none";
      }
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================
//  Validation
// ============================================================

function validateForm() {
  clearErrors();
  let valid = true;

  const firstName = getEl("first-name")?.value.trim();
  const lastName  = getEl("last-name")?.value.trim();
  const phone     = getEl("phone")?.value.trim();
  const email     = getEl("email")?.value.trim();
  const password  = getEl("password")?.value;
  const confirm   = getEl("confirm-password")?.value;

  if (!firstName) {
    setError("first-name", "Please enter your first name");
    valid = false;
  }
  if (!lastName) {
    setError("last-name", "Please enter your last name");
    valid = false;
  }
  if (!phone) {
    setError("phone", "Please enter your phone number");
    valid = false;
  } else if (!/^[0-9+\-\s]{8,15}$/.test(phone)) {
    setError("phone", "Invalid phone number format");
    valid = false;
  }
  if (!email) {
    setError("email", "Please enter your email");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("email", "Invalid email format");
    valid = false;
  }
  if (password) {
    if (password.length < 8) {
      setError("password", "Password must be at least 8 characters");
      valid = false;
    } else if (password !== confirm) {
      setError("confirm-password", "Passwords do not match");
      valid = false;
    }
  }

  return valid;
}

// ============================================================
//  Form submit
// ============================================================

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const btn = getEl("submit-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }

  const payload = {
    firstName:   getEl("first-name")?.value.trim(),
    lastName:    getEl("last-name")?.value.trim(),
    phoneNumber: [getEl("phone")?.value.trim()],
    email:       getEl("email")?.value.trim(),
  };

  const pw = getEl("password")?.value;
  if (pw) payload.password = pw;

  try {
    await updateProfile(payload);
    showToast("Profile updated successfully ✓", "success");

    // reset password fields
    const pwInput = getEl("password");
    const cpInput = getEl("confirm-password");
    if (pwInput) pwInput.value = "";
    if (cpInput) cpInput.value = "";

    // อัปเดต avatar initial
    const initial = getEl("avatar-initial");
    if (initial) initial.textContent = payload.firstName.charAt(0).toUpperCase();

  } catch (err) {
    console.error(err);
    showToast("Failed to update profile. Please try again.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Submit"; }
  }
}

// ============================================================
//  Toggle password visibility
// ============================================================

function setupPasswordToggles() {
  document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input    = getEl(targetId);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      // swap icon opacity เป็น indicator
      btn.style.opacity = input.type === "text" ? "1" : ".45";
    });
  });
}

// ============================================================
//  Init
// ============================================================

async function initProfile() {
  try {
    const profile = await fetchProfile();

    // populate fields
    const fields = {
      "first-name": profile.firstName,
      "last-name":  profile.lastName,
      "phone":      Array.isArray(profile.phoneNumber) ? profile.phoneNumber[0] : profile.phoneNumber,
      "email":      profile.email,
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = getEl(id);
      if (el && val !== undefined) el.value = val;
    });

    initAvatar(null, profile.firstName);

  } catch (err) {
    console.error("Profile load failed:", err);
    showToast("Could not load profile data.", "error");
  }

  // bind form submit
  getEl("profile-form")?.addEventListener("submit", handleSubmit);

  // toggle password buttons
  setupPasswordToggles();
}

// ============================================================
//  Boot
// ============================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfile);
} else {
  initProfile();
}