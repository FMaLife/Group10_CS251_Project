/* ============================================================
   SMART FURNITURE WAREHOUSE — SIGN UP SCRIPT
   ============================================================ */

(function () {
  'use strict';

  const fullnameInput   = document.getElementById('fullname');
  const phoneInput      = document.getElementById('phone');
  const emailInput      = document.getElementById('email');
  const passwordInput   = document.getElementById('password');
  const confirmInput    = document.getElementById('confirm-password');

  const fullnameError   = document.getElementById('fullname-error');
  const phoneError      = document.getElementById('phone-error');
  const emailError      = document.getElementById('email-error');
  const passwordError   = document.getElementById('password-error');
  const confirmError    = document.getElementById('confirm-password-error');

  const togglePw        = document.getElementById('toggle-pw');
  const eyeOpen         = document.getElementById('eye-open');
  const eyeClosed       = document.getElementById('eye-closed');
  const toggleCPw       = document.getElementById('toggle-cpw');
  const eyeOpenC        = document.getElementById('eye-open-c');
  const eyeClosedC      = document.getElementById('eye-closed-c');

  const signInBtn       = document.getElementById('btn-signin');
  const btnText         = signInBtn.querySelector('.btn-text');
  const btnLoader       = document.getElementById('btn-loader');

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  function isValidPhone(v) { return /^[0-9+\-\s()]{7,20}$/.test(v.trim()); }

  function showError(input, errorEl, message) {
    input.classList.add('error');
    errorEl.textContent = '';
    requestAnimationFrame(() => { errorEl.textContent = message; });
  }
  function clearError(input, errorEl) {
    input.classList.remove('error');
    errorEl.textContent = '';
  }

  // Real-time validation
  fullnameInput.addEventListener('input', () => { if (fullnameInput.value.trim().length >= 2) clearError(fullnameInput, fullnameError); });
  fullnameInput.addEventListener('blur', () => {
    if (!fullnameInput.value.trim()) showError(fullnameInput, fullnameError, 'Full name is required.');
    else if (fullnameInput.value.trim().length < 2) showError(fullnameInput, fullnameError, 'Name must be at least 2 characters.');
  });

  phoneInput.addEventListener('input', () => { if (isValidPhone(phoneInput.value)) clearError(phoneInput, phoneError); });
  phoneInput.addEventListener('blur', () => {
    if (!phoneInput.value.trim()) showError(phoneInput, phoneError, 'Phone number is required.');
    else if (!isValidPhone(phoneInput.value)) showError(phoneInput, phoneError, 'Please enter a valid phone number.');
  });

  emailInput.addEventListener('input', () => { if (isValidEmail(emailInput.value)) clearError(emailInput, emailError); });
  emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim()) showError(emailInput, emailError, 'Email is required.');
    else if (!isValidEmail(emailInput.value)) showError(emailInput, emailError, 'Please enter a valid email address.');
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.value.length >= 8) clearError(passwordInput, passwordError);
    if (confirmInput.value) {
      if (confirmInput.value !== passwordInput.value) showError(confirmInput, confirmError, 'Passwords do not match.');
      else clearError(confirmInput, confirmError);
    }
  });
  passwordInput.addEventListener('blur', () => {
    if (!passwordInput.value) showError(passwordInput, passwordError, 'Password is required.');
    else if (passwordInput.value.length < 8) showError(passwordInput, passwordError, 'Password must be at least 8 characters.');
  });

  confirmInput.addEventListener('input', () => {
    if (confirmInput.value === passwordInput.value) clearError(confirmInput, confirmError);
    else showError(confirmInput, confirmError, 'Passwords do not match.');
  });
  confirmInput.addEventListener('blur', () => { if (!confirmInput.value) showError(confirmInput, confirmError, 'Please confirm your password.'); });

  // Toggle password visibility
  function setupToggle(btn, input, eyeA, eyeB) {
    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      eyeA.style.display = isHidden ? 'none' : 'block';
      eyeB.style.display = isHidden ? 'block' : 'none';
      input.focus();
    });
  }
  setupToggle(togglePw, passwordInput, eyeOpen, eyeClosed);
  setupToggle(toggleCPw, confirmInput, eyeOpenC, eyeClosedC);

  function validateAll() {
    let valid = true;
    if (!fullnameInput.value.trim()) { showError(fullnameInput, fullnameError, 'Full name is required.'); valid = false; }
    else if (fullnameInput.value.trim().length < 2) { showError(fullnameInput, fullnameError, 'Name must be at least 2 characters.'); valid = false; }
    if (!phoneInput.value.trim()) { showError(phoneInput, phoneError, 'Phone number is required.'); valid = false; }
    else if (!isValidPhone(phoneInput.value)) { showError(phoneInput, phoneError, 'Please enter a valid phone number.'); valid = false; }
    if (!emailInput.value.trim()) { showError(emailInput, emailError, 'Email is required.'); valid = false; }
    else if (!isValidEmail(emailInput.value)) { showError(emailInput, emailError, 'Please enter a valid email address.'); valid = false; }
    if (!passwordInput.value) { showError(passwordInput, passwordError, 'Password is required.'); valid = false; }
    else if (passwordInput.value.length < 8) { showError(passwordInput, passwordError, 'Password must be at least 8 characters.'); valid = false; }
    if (!confirmInput.value) { showError(confirmInput, confirmError, 'Please confirm your password.'); valid = false; }
    else if (confirmInput.value !== passwordInput.value) { showError(confirmInput, confirmError, 'Passwords do not match.'); valid = false; }
    return valid;
  }

  function setLoading(isLoading) {
    signInBtn.disabled = isLoading;
    btnText.style.opacity = isLoading ? '0' : '1';
    if (isLoading) btnLoader.classList.add('visible');
    else btnLoader.classList.remove('visible');
  }

  // ── แยก firstName / lastName จาก fullname ──────────────────────────────────
  // ถ้ากรอกชื่อเดียว (ไม่มีเว้นวรรค) ให้ firstName = ชื่อนั้น และ lastName = ''
  function splitFullName(fullname) {
    const parts = fullname.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName  = parts.slice(1).join(' ');
    return { firstName, lastName };
  }

  // ── เรียก API จริง ─────────────────────────────────────────────────────────
  async function registerRequest() {
    const { firstName, lastName } = splitFullName(fullnameInput.value);

    const payload = {
      firstName:   firstName,
      lastName:    lastName,
      email:       emailInput.value.trim(),
      password:    passwordInput.value,
      phoneNumber: [phoneInput.value.trim()]   // API รับเป็น array
    };

    const response = await fetch('http://127.0.0.1:8000/api/accounts/customer/register', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // จัดการ error ที่ server ส่งกลับมา
      const serverMsg = data?.message || data?.error || 'Registration failed. Please try again.';
      throw new Error(serverMsg);
    }

    return data; // { message, customer: { customerID, firstName, lastName, email } }
  }

  // ── handler ปุ่ม Sign up ───────────────────────────────────────────────────
  signInBtn.addEventListener('click', async () => {
    if (!validateAll()) return;

    setLoading(true);

    try {
      const result = await registerRequest();

      setLoading(false);

      // สำเร็จ
      signInBtn.classList.add('success');
      btnText.textContent   = '✓ Account created!';
      btnText.style.opacity = '1';

      setTimeout(() => {
        alert(`🎉 ยินดีต้อนรับ ${result.customer.firstName}! สมัครสมาชิกสำเร็จแล้ว กำลังพาไปหน้าล็อกอิน...`);
        window.location.href = '/frontend/customer/auth/login/log-in.html';
      }, 1500);

    } catch (err) {
      setLoading(false);

      // ตรวจสอบว่า server แจ้ง email ซ้ำหรือไม่
      const msg = err.message || '';
      if (/email/i.test(msg) && /(exist|duplicate|already|taken|ซ้ำ)/i.test(msg)) {
        showError(emailInput, emailError, 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น');
      } else {
        alert(`เกิดข้อผิดพลาด: ${msg}`);
      }
    }
  });

  [fullnameInput, phoneInput, emailInput, passwordInput, confirmInput].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') signInBtn.click(); });
    el.addEventListener('focus', () => { el.parentElement.style.transform = 'scale(1.005)'; });
    el.addEventListener('blur', () => { el.parentElement.style.transform = 'scale(1)'; });
  });

})();