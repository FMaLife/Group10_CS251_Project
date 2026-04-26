function openModal() {
    document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
}

function openDetail(model, id) {
    const modal = document.getElementById("modal");
    const content = document.getElementById("modal-content");

    modal.classList.remove("hidden");
    content.innerHTML = "Loading...";

    fetch(`/detail/${model}/${id}/`)
        .then(res => res.json())
        .then(data => {
            content.innerHTML = renderDetail(data);
        })
        .catch(() => {
            content.innerHTML = "<p>Error loading data</p>";
        });
}

function renderDetail(data) {
    return `
        <div class="product-detail">

            <div class="image-box">
                <img src="${data.image || '/static/employee/img/default.png'}" />
            </div>

            <div class="info-grid">

                <div class="item">
                    <div class="label">Product ID</div>
                    <div class="value">${data.product_id}</div>
                </div>

                <div class="item">
                    <div class="label">Supplier ID</div>
                    <div class="value">${data.supplier_id}</div>
                </div>

                <div class="item">
                    <div class="label">Dimension</div>
                    <div class="value">${data.dimension}</div>
                </div>

                <div class="item">
                    <div class="label">Product Name</div>
                    <div class="value">${data.product_name}</div>
                </div>

                <div class="item">
                    <div class="label">Warehouse</div>
                    <div class="value">${data.warehouse}</div>
                </div>

                <div class="item">
                    <div class="label">Color</div>
                    <div class="value">${data.color}</div>
                </div>

                <div class="item">
                    <div class="label">Category</div>
                    <div class="value">${data.category}</div>
                </div>

                <div class="item">
                    <div class="label">Price</div>
                    <div class="value">${data.price}</div>
                </div>

                <div class="item">
                    <div class="label">Quantity</div>
                    <div class="value">${data.quantity}</div>
                </div>

            </div>
        </div>
    `;
}

// click event (สำคัญ)
document.addEventListener("click", function(e) {
    const btn = e.target.closest(".btn-detail");

    if (btn) {
        openDetail(btn.dataset.model, btn.dataset.id);
    }
});