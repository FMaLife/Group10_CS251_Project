/* ============================================================
   SMART FURNITURE WAREHOUSE — LOGIN SCRIPT
   ============================================================ */

(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────
  const emailInput    = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError    = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const togglePw      = document.getElementById('toggle-pw');
  const eyeOpen       = document.getElementById('eye-open');
  const eyeClosed     = document.getElementById('eye-closed');
  const signInBtn     = document.getElementById('btn-signin');
  const btnText       = signInBtn.querySelector('.btn-text');
  const btnLoader     = document.getElementById('btn-loader');

  // ── Helpers ───────────────────────────────────────────────

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function showError(input, errorEl, message) {
    input.classList.add('error');
    errorEl.textContent = '';
    requestAnimationFrame(() => {
      errorEl.textContent = message;
    });
  }

  function clearError(input, errorEl) {
    input.classList.remove('error');
    errorEl.textContent = '';
  }

  // ── Real-time validation ──────────────────────────────────

  emailInput.addEventListener('input', () => {
    if (emailInput.value && !isValidEmail(emailInput.value)) {
      showError(emailInput, emailError, 'Please enter a valid email address.');
    } else {
      clearError(emailInput, emailError);
    }
  });

  emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim()) {
      showError(emailInput, emailError, 'Email is required.');
    }
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.value.length > 0 && passwordInput.value.length < 8) {
      showError(passwordInput, passwordError, 'Password must be at least 8 characters.');
    } else {
      clearError(passwordInput, passwordError);
    }
  });

  passwordInput.addEventListener('blur', () => {
    if (!passwordInput.value) {
      showError(passwordInput, passwordError, 'Password is required.');
    }
  });

  // ── Toggle password visibility ────────────────────────────

  togglePw.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeOpen.style.display   = isHidden ? 'none'  : 'block';
    eyeClosed.style.display = isHidden ? 'block' : 'none';
    passwordInput.focus();
  });

  // ── Validate all fields before submit ────────────────────

  function validateAll() {
    let valid = true;

    if (!emailInput.value.trim()) {
      showError(emailInput, emailError, 'Email is required.');
      valid = false;
    } else if (!isValidEmail(emailInput.value)) {
      showError(emailInput, emailError, 'Please enter a valid email address.');
      valid = false;
    }

    if (!passwordInput.value) {
      showError(passwordInput, passwordError, 'Password is required.');
      valid = false;
    } else if (passwordInput.value.length < 8) {
      showError(passwordInput, passwordError, 'Password must be at least 8 characters.');
      valid = false;
    }

    return valid;
  }

  function setLoading(isLoading) {
    signInBtn.disabled = isLoading;
    btnText.style.opacity = isLoading ? '0' : '1';
    if (isLoading) {
      btnLoader.classList.add('visible');
    } else {
      btnLoader.classList.remove('visible');
    }
  }

  // ── เรียก API จริง ────────────────────────────────────────
  async function loginRequest() {
    const payload = {
      email:    emailInput.value.trim(),
      password: passwordInput.value
    };

    const response = await fetch('http://127.0.0.1:8000/api/accounts/customer/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // ดึง message จาก server (เช่น "Invalid email or password")
      const serverMsg = data?.message || data?.error || 'Invalid credentials. Please try again.';
      throw new Error(serverMsg);
    }

    return data; // { message, customer: { customerID, firstName, lastName, email } }
  }

  // ── handler ปุ่ม Sign in ──────────────────────────────────
  signInBtn.addEventListener('click', async () => {
    if (!validateAll()) return;

    setLoading(true);

    try {
      const result = await loginRequest();

      setLoading(false);

      // ── บันทึกข้อมูล user ลง localStorage ───────────────────
      // เก็บเฉพาะข้อมูลที่จำเป็น (ไม่เก็บ password)
      localStorage.setItem('customer', JSON.stringify({
        customerID: result.customer.customerID,
        firstName:  result.customer.firstName,
        lastName:   result.customer.lastName,
        email:      result.customer.email
      }));

      // สำเร็จ
      signInBtn.classList.add('success');
      btnText.textContent   = '✓ Signed in!';
      btnText.style.opacity = '1';

      setTimeout(() => {
        alert(`🎉 ยินดีต้อนรับกลับมา ${result.customer.firstName}! กำลังพาไปหน้าหลัก...`);
        window.location.href = '/frontend/customer/home/home.html';
      }, 1500);

    } catch (err) {
      setLoading(false);

      const msg = err.message || '';

      // email ไม่พบในระบบ
      if (/email/i.test(msg) && /(not found|exist|ไม่พบ)/i.test(msg)) {
        showError(emailInput, emailError, 'ไม่พบอีเมลนี้ในระบบ');
      }
      // password ผิด
      else if (/password|credential|invalid/i.test(msg)) {
        showError(passwordInput, passwordError, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
      // error ทั่วไป
      else {
        showError(passwordInput, passwordError, msg || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  });

  // Allow submit with Enter key
  [emailInput, passwordInput].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') signInBtn.click();
    });
  });

  // ── Input shimmer on focus ────────────────────────────────
  [emailInput, passwordInput].forEach((el) => {
    el.addEventListener('focus', () => {
      el.parentElement.style.transition = 'transform 0.2s ease';
      el.parentElement.style.transform  = 'scale(1.005)';
    });
    el.addEventListener('blur', () => {
      el.parentElement.style.transform = 'scale(1)';
    });
  });

})();