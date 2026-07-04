const cart = [];
let total = 0;

const $ = id => document.getElementById(id);

const cartBtn = $("cartBtn");
const closeCart = $("closeCart");
const cartOverlay = $("cartOverlay");
const cartItems = $("cartItems");
const cartTotal = $("cartTotal");
const cartCount = $("cartCount");
const themeBtn = $("themeBtn");
const buyBtn = $("buyBtn");
const qrBox = $("qrBox");
const qrCanvas = $("qrCanvas");

const userBtn = $("userBtn");
const loginOverlay = $("loginOverlay");
const closeLogin = $("closeLogin");
const profileUser = $("profileUser");
const profileOrders = $("profileOrders");

const cardPayBtn = $("cardPayBtn");
const paymentOverlay = $("paymentOverlay");
const closePayment = $("closePayment");
const paymentForm = $("paymentForm");
const cardNumber = $("cardNumber");

// --- REINICIO DE PEDIDOS A MEDIANOCHE ---
function checkMidnightReset() {
    const today = new Date().toLocaleDateString();
    const lastSavedDate = localStorage.getItem("last_order_date");

    if (!lastSavedDate) {
        localStorage.setItem("last_order_date", today);
        return;
    }

    if (today !== lastSavedDate) {
        localStorage.removeItem("orders");
        localStorage.setItem("last_order_date", today);
    }
}

checkMidnightReset();

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    if (themeBtn) themeBtn.textContent = "☀";
} else {
    if (themeBtn) themeBtn.textContent = "☾";
}

loadProfile();
renderOrders();

if (cartBtn) cartBtn.addEventListener("click", () => cartOverlay.classList.add("active"));
if (closeCart) closeCart.addEventListener("click", () => cartOverlay.classList.remove("active"));
if (userBtn) userBtn.addEventListener("click", () => loginOverlay.classList.add("active"));
if (closeLogin) closeLogin.addEventListener("click", () => loginOverlay.classList.remove("active"));

if (cartOverlay) {
    cartOverlay.addEventListener("click", event => {
        if (event.target === cartOverlay) cartOverlay.classList.remove("active");
    });
}

if (loginOverlay) {
    loginOverlay.addEventListener("click", event => {
        if (event.target === loginOverlay) loginOverlay.classList.remove("active");
    });
}

if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {
            themeBtn.textContent = "☀";
            localStorage.setItem("theme", "dark");
        } else {
            themeBtn.textContent = "☾";
            localStorage.setItem("theme", "light");
        }
    });
}

// --- FUNCIÓN AUXILIAR: CONTAR ELEMENTOS ACTUALES EN EL CARRITO ---
function getCartTotalQuantity() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

document.querySelectorAll(".food-card").forEach(card => {
    const minusBtn = card.querySelector(".minus");
    const plusBtn = card.querySelector(".plus");
    const quantityText = card.querySelector(".quantity span");
    const addBtn = card.querySelector(".add-btn");

    let quantity = 1;

    minusBtn.addEventListener("click", () => {
        if (quantity > 1) {
            quantity--;
            quantityText.textContent = quantity;
        }
    });

    plusBtn.addEventListener("click", () => {
        quantity++;
        quantityText.textContent = quantity;
    });

    addBtn.addEventListener("click", () => {
        const name = addBtn.dataset.name;
        const price = Number(addBtn.dataset.price);
        const subtotal = price * quantity;

        // Validación: Límite máximo de 100 productos en total
        if (getCartTotalQuantity() + quantity > 100) {
            alert("No puedes agregar más productos. El límite máximo permitido es de 100 artículos.");
            return;
        }

        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.subtotal += subtotal;
        } else {
            cart.push({ name, price, quantity, subtotal });
        }

        total += subtotal;
        updateCart();
        clearQR();

        quantity = 1;
        quantityText.textContent = quantity;
    });
});

if (buyBtn) {
    buyBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío");
            return;
        }

        fetch("guardar_orden.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                total: total,
                metodo_pago: "QR",
                tarjeta: ""
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                generateOrderQR(data.numero_orden);
                saveOrder("QR", data.numero_orden);
                renderOrders();

                alert("QR generado para la Orden #" + data.numero_orden);
                
                // Opcional: Vaciar carrito tras la compra exitosa
                cart.length = 0;
                total = 0;
                updateCart();
            } else {
                alert(data.message);
            }
        })
        .catch(() => {
            alert("No se pudo conectar con guardar_orden.php");
        });
    });
}

if (cardPayBtn) {
    cardPayBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío");
            return;
        }

        paymentOverlay.classList.add("active");
    });
}

if (closePayment) {
    closePayment.addEventListener("click", () => {
        paymentOverlay.classList.remove("active");
    });
}

if (paymentOverlay) {
    paymentOverlay.addEventListener("click", event => {
        if (event.target === paymentOverlay) {
            paymentOverlay.classList.remove("active");
        }
    });
}

if (paymentForm) {
    paymentForm.addEventListener("submit", event => {
        event.preventDefault();

        if (cart.length === 0) {
            alert("Tu carrito está vacío");
            paymentOverlay.classList.remove("active");
            return;
        }

        fetch("guardar_orden.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                total: total,
                metodo_pago: "Tarjeta",
                tarjeta: cardNumber.value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                saveOrder("Tarjeta", data.numero_orden);
                renderOrders();

                alert("Pago aprobado. Orden #" + data.numero_orden);
                paymentOverlay.classList.remove("active");

                // Opcional: Vaciar carrito tras la compra exitosa
                cart.length = 0;
                total = 0;
                updateCart();
            } else {
                alert(data.message);
            }
        })
        .catch(() => {
            alert("No se pudo conectar con guardar_orden.php");
        });
    });
}

// --- FUNCIÓN MODIFICADA: GESTIÓN DE CANTIDADES Y LÍMITES EN EL CARRITO ---
function updateCart() {
    if (!cartItems || !cartTotal || !cartCount) return;

    cartItems.innerHTML = "";
    let totalItemsCount = 0;
    total = 0; // Recalculamos el total global para evitar desfases numéricos

    cart.forEach((item, index) => {
        totalItemsCount += item.quantity;
        total += item.subtotal;

        const div = document.createElement("div");
        div.classList.add("cart-item");
        
        div.style.display = "flex";
        div.style.justify = "space-between";
        div.style.alignItems = "center";
        div.style.marginBottom = "12px";
        div.style.borderBottom = "1px solid #ccc";
        div.style.paddingBottom = "8px";

        div.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                Precio: $${item.subtotal.toFixed(2)}
                <!-- Controles interactivos de cantidad en el carrito -->
                <div style="margin-top: 5px; display: flex; align-items: center; gap: 8px;">
                    <button class="cart-qty-minus" data-index="${index}" style="padding: 2px 8px; cursor: pointer;">-</button>
                    <span>${item.quantity}</span>
                    <button class="cart-qty-plus" data-index="${index}" style="padding: 2px 8px; cursor: pointer;">+</button>
                </div>
            </div>
            <button class="remove-item-btn" data-index="${index}" style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;" title="Eliminar artículo">🗑️</button>
        `;

        cartItems.appendChild(div);
    });

    // EVENTOS: Botón disminuir cantidad dentro del carrito
    document.querySelectorAll(".cart-qty-minus").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = Number(e.currentTarget.dataset.index);
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
                cart[index].subtotal = cart[index].price * cart[index].quantity;
            } else {
                cart.splice(index, 1); // Si baja de 1, se remueve por completo
            }
            updateCart();
            clearQR();
        });
    });

    // EVENTOS: Botón aumentar cantidad dentro del carrito (Validando el límite de 100)
    document.querySelectorAll(".cart-qty-plus").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = Number(e.currentTarget.dataset.index);
            
            if (getCartTotalQuantity() + 1 > 100) {
                alert("No puedes agregar más productos. Has alcanzado el límite máximo de 100 artículos.");
                return;
            }

            cart[index].quantity++;
            cart[index].subtotal = cart[index].price * cart[index].quantity;
            updateCart();
            clearQR();
        });
    });

    // EVENTOS: Botón eliminar producto completo
    document.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = Number(e.currentTarget.dataset.index);
            cart.splice(index, 1);
            updateCart();
            clearQR();
        });
    });

    cartTotal.textContent = total.toFixed(2);
    cartCount.textContent = totalItemsCount;
}

function generateOrderQR(orderNumber) {
    const orderText = createOrderText(orderNumber);

    QRCode.toCanvas(qrCanvas, orderText, {
        width: 220,
        margin: 2,
        color: {
            dark: "#111111",
            light: "#ffffff"
        }
    }, error => {
        if (error) {
            alert("No se pudo generar el código QR");
            return;
        }

        qrBox.classList.add("active");
    });
}

function createOrderText(orderNumber) {
    let text = "Pedido UTN\n";
    text += `Orden #${orderNumber}\n\n`;

    cart.forEach(item => {
        text += `${item.name} x${item.quantity} - $${item.subtotal.toFixed(2)}\n`;
    });

    text += `\nTotal: $${total.toFixed(2)}`;

    return text;
}

// Limpia el contenedor del código QR
function clearQR() {
    if (!qrBox || !qrCanvas) return;

    qrBox.classList.remove("active");

    const context = qrCanvas.getContext("2d");
    context.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
}

function saveOrder(method, orderNumber = Date.now()) {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    orders.push({
        numero: orderNumber,
        metodo: method,
        fecha: new Date().toLocaleString(),
        productos: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            subtotal: item.subtotal
        })),
        total: total
    });

    localStorage.setItem("orders", JSON.stringify(orders));
}

// --- FUNCIÓN MODIFICADA: AGREGA CAPACIDAD PARA CANCELAR PEDIDOS ---
function renderOrders() {
    if (!profileOrders) return;

    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    if (orders.length === 0) {
        profileOrders.innerHTML = "<p>No hay pedidos registrados todavía.</p>";
        return;
    }

    profileOrders.innerHTML = "";

    orders.forEach((order, index) => {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.style.borderBottom = "1px dashed #aaa";
        div.style.paddingBottom = "10px";
        div.style.marginBottom = "10px";

        let products = "";

        order.productos.forEach(product => {
            products += `${product.name} x${product.quantity} - $${product.subtotal.toFixed(2)}<br>`;
        });

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong>Orden #${order.numero}</strong><br>
                    Método: ${order.metodo}<br>
                    <small>${order.fecha}</small><br>
                    ${products}
                    <strong>Total: $${order.total.toFixed(2)}</strong>
                </div>
                <!-- Botón nuevo para Cancelar Pedidos -->
                <button class="cancel-order-btn" data-index="${index}" style="background: #c0392b; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 2px;">Cancelar</button>
            </div>
        `;

        profileOrders.appendChild(div);
    });

    // Evento para procesar la cancelación del pedido
    document.querySelectorAll(".cancel-order-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = Number(e.currentTarget.dataset.index);
            if (confirm("¿Estás seguro de que deseas cancelar este pedido?")) {
                const orders = JSON.parse(localStorage.getItem("orders")) || [];
                orders.splice(index, 1); // Quita el pedido seleccionado
                localStorage.setItem("orders", JSON.stringify(orders));
                renderOrders(); // Re-dibuja el panel de pedidos
            }
        });
    });
}

function loadProfile() {
    fetch("perfil.php")
        .then(response => response.json())
        .then(data => {
            if (!data.logueado) {
                window.location.href = "index.html";
                return;
            }

            if (profileUser) {
                profileUser.textContent = data.usuario;
            }
        })
        .catch(() => {
            if (profileUser) {
                profileUser.textContent = "No disponible";
            }
        });
}