//---------- DETAILS --------------
function openModal() {
    document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
}

let isLoading = false;

function openDetail(model, id) {
    if (isLoading) return;
    isLoading = true;

    const modal = document.getElementById("modal");
    const content = document.getElementById("modal-content");

    modal.classList.remove("hidden");
    content.innerHTML = "Loading...";

    document.getElementById("modal-title").innerText =
        formatTitle(model) + " Details";

    fetch(`/detail/${model}/${id}/`)
        .then(res => res.text())
        .then(html => {
            content.innerHTML = html;
        })
        .catch(() => {
            content.innerHTML = "<p>Error loading data</p>";
        })
        .finally(() => {
            isLoading = false;
        });
}

// click event (สำคัญ)
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".btn-detail");

    if (btn) {
        openDetail(btn.dataset.model, btn.dataset.id);
    }
});

function formatTitle(model) {
    return model.replaceAll("_", " ")
                .replace(/\b\w/g, c => c.toUpperCase());
}

//---------- ADD --------------
function openAdd(model) {
    const modal = document.getElementById("add-modal");
    const content = document.getElementById("add-modal-content");

    modal.classList.remove("hidden");
    content.innerHTML = "Loading...";

    document.getElementById("add-modal-title").innerText =
        "Add New " + formatTitle(model);

    fetch(`/add/${model}/`)
        .then(res => res.text())
        .then(html => {
            content.innerHTML = html;
        });
}

function closeAddModal() {
    document.getElementById("add-modal").classList.add("hidden");
}