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

  /**
   * Validate email format.
   * @param {string} value
   * @returns {boolean}
   */
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  /**
   * Show error message and mark input as invalid.
   * @param {HTMLInputElement} input
   * @param {HTMLElement}      errorEl
   * @param {string}           message
   */
  function showError(input, errorEl, message) {
    input.classList.add('error');
    // Re-trigger animation
    errorEl.textContent = '';
    requestAnimationFrame(() => {
      errorEl.textContent = message;
    });
  }

  /**
   * Clear error state.
   * @param {HTMLInputElement} input
   * @param {HTMLElement}      errorEl
   */
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
    if (passwordInput.value.length > 0 && passwordInput.value.length < 6) {
      showError(passwordInput, passwordError, 'Password must be at least 6 characters.');
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

  // ── Form submission ───────────────────────────────────────

  /**
   * Validate all fields before submit.
   * @returns {boolean}
   */
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
    } else if (passwordInput.value.length < 6) {
      showError(passwordInput, passwordError, 'Password must be at least 6 characters.');
      valid = false;
    }

    return valid;
  }

  /**
   * Set button to loading state.
   */
  function setLoading(isLoading) {
    signInBtn.disabled = isLoading;
    btnText.style.opacity = isLoading ? '0' : '1';
    if (isLoading) {
      btnLoader.classList.add('visible');
    } else {
      btnLoader.classList.remove('visible');
    }
  }

  /**
   * Simulate API call (replace with real fetch).
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function fakeAuthRequest(email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Demo: treat any well-formed credentials as success
        resolve({ success: true, message: 'Login successful!' });
      }, 1800);
    });
  }

  signInBtn.addEventListener('click', async () => {
    if (!validateAll()) return;

    setLoading(true);

    const result = await fakeAuthRequest(
      emailInput.value.trim(),
      passwordInput.value
    );

    setLoading(false);

    if (result.success) {
      // Success state
      signInBtn.classList.add('success');
      btnText.textContent = '✓ Signed in!';
      btnText.style.opacity = '1';

      setTimeout(() => {
        // Navigate or reset
        alert('🎉 Welcome back! Redirecting to your dashboard…');
        signInBtn.classList.remove('success');
        btnText.textContent = 'Sign in';
      }, 1500);
    } else {
      // Show server error
      showError(passwordInput, passwordError, result.message || 'Invalid credentials. Please try again.');
    }
  });

  // Allow submit with Enter key
  [emailInput, passwordInput].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') signInBtn.click();
    });
  });

  // ── Input shimmer on focus (subtle glow pulse) ─────────────
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