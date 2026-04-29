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
    const detailBtn = e.target.closest(".btn-detail");
    if (detailBtn) {
        openDetail(detailBtn.dataset.model, detailBtn.dataset.id);
        return;
    }

    const editBtn = e.target.closest(".btn-edit");
    if (editBtn) {
        openEdit(editBtn.dataset.model, editBtn.dataset.id);
        return;
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

//---------- EDIT --------------

function openEdit(model, id) {
    const modal = document.getElementById("add-modal"); // reuse modal เดิม
    const content = document.getElementById("add-modal-content");

    modal.classList.remove("hidden");
    content.innerHTML = "Loading...";

    document.getElementById("add-modal-title").innerText =
        "Edit " + formatTitle(model);

    fetch(`/edit/${model}/${id}/`)
        .then(res => res.text())
        .then(html => {
            content.innerHTML = html;
        })
        .catch(() => {
            content.innerHTML = "<p>Error loading form</p>";
        });
}

document.addEventListener("change", function(e) {
    if (e.target.id === "id_image") {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function(event) {
            const previewBox = document.getElementById("preview-box");

            previewBox.innerHTML = `
                <img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;">
            `;
        };

        reader.readAsDataURL(file);
    }
});

function addRow() {
    const container = document.getElementById("items");
    const firstRow = container.querySelector(".item-row");

    if (!firstRow) return;

    const row = firstRow.cloneNode(true);

    // reset input ทุกตัว
    row.querySelectorAll("input").forEach(input => {
        input.value = "";
    });

    // reset select ทุกตัว
    row.querySelectorAll("select").forEach(select => {
        select.selectedIndex = 0;
    });

    container.appendChild(row);
}

document.addEventListener("submit", function(e) {
    const form = e.target;

    e.preventDefault();

    const formData = new FormData(form);

    fetch(form.action, {
        method: "POST",
        body: formData
    })
    .then(res => {
        if (res.redirected) {
            window.location.reload();
        } else {
            return res.text();
        }
    })
    .then(html => {
        if (html) {
            document.getElementById("add-modal-content").innerHTML = html;
        }
    })
    .catch(() => {
        alert("Error submitting form");
    });
});

function closeAddModal() {
    document.getElementById("add-modal").classList.add("hidden");
}