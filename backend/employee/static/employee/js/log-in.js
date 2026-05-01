// =======================
// CSRF (จำเป็นสำหรับ Django)
// =======================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener("DOMContentLoaded", () => {

    console.log("JS loaded"); // debug

    // =======================
    // LOGIN
    // =======================
    const loginBtn = document.getElementById("btn-signin");

    if (loginBtn) {
        loginBtn.onclick = async () => {

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            const emailError = document.getElementById("email-error");
            const passwordError = document.getElementById("password-error");

            emailError.textContent = "";
            passwordError.textContent = "";

            if (!email) {
                emailError.textContent = "Email required";
                return;
            }

            if (!password) {
                passwordError.textContent = "Password required";
                return;
            }

            try {
                const res = await fetch("/login/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCookie("csrftoken")
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                console.log(data);

                if (res.ok) {
                    window.location.href = "/product/";
                } else {
                    passwordError.textContent = data.error || "Login failed";
                }

            } catch (err) {
                passwordError.textContent = "Server error";
            }
        };
    }

    // =======================
    // LOGOUT
    // =======================
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
            e.preventDefault();

            try {
                const res = await fetch("/logout/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken")
                    }
                });

                if (res.ok) {
                    window.location.href = "/";
                } else {
                    alert("Logout failed");
                }

            } catch (err) {
                alert("Server error");
            }
        };
    }
});

