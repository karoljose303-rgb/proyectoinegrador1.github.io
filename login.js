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

const paypalPayBtn = $("paypalPayBtn");
const paypalOverlay = $("paypalOverlay");
const closePaypal = $("closePaypal");
const paypalTotal = $("paypalTotal");

let paypalRendered = false;

function guardarOrden(metodoPago, tarjeta = "", paypalId = "") {
    return fetch("guardar_orden.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            total: total,
            metodo_pago: metodoPago,
            tarjeta: tarjeta,
            paypal_id: paypalId
        })
    })
    .then(response => {
        return response.text().then(text => {
            console.log("Respuesta de guardar_orden.php:", text);

            if (!response.ok) {
                throw new Error("Error HTTP " + response.status + ": " + text);
            }

            try {
                return JSON.parse(text);
            } catch (error) {
                throw new Error("guardar_orden.php no devolvió JSON válido: " + text);
            }
        });
    });
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    if (themeBtn) themeBtn.textContent = "☀";
} else {
    if (themeBtn) themeBtn.textContent = "☾";
}

loadProfile();
renderOrders();

if (cartBtn) {
    cartBtn.addEventListener("click", () => {
        cartOverlay.classList.add("active");
    });
}

if (closeCart) {
    closeCart.addEventListener("click", () => {
        cartOverlay.classList.remove("active");
    });
}

if (userBtn) {
    userBtn.addEventListener("click", () => {
        loginOverlay.classList.add("active");
    });
}

if (closeLogin) {
    closeLogin.addEventListener("click", () => {
        loginOverlay.classList.remove("active");
    });
}

if (cartOverlay) {
    cartOverlay.addEventListener("click", event => {
        if (event.target === cartOverlay) {
            cartOverlay.classList.remove("active");
        }
    });
}

if (loginOverlay) {
    loginOverlay.addEventListener("click", event => {
        if (event.target === loginOverlay) {
            loginOverlay.classList.remove("active");
        }
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

document.querySelectorAll(".food-card").forEach(card => {
    const minusBtn = card.querySelector(".minus");
    const plusBtn = card.querySelector(".plus");
    const quantityText = card.querySelector(".quantity span");
    const addBtn = card.querySelector(".add-btn");

    if (!minusBtn || !plusBtn || !quantityText || !addBtn) return;

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

        cart.push({
            name,
            price,
            quantity,
            subtotal
        });

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

        guardarOrden("QR")
            .then(data => {
                if (data.success) {
                    generateOrderQR(data.numero_orden);
                    saveOrder("QR", data.numero_orden, data.fecha);
                    renderOrders();
                } else {
                    generateOrderQR("Sin registrar");
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error(error);
                generateOrderQR("Sin registrar");
                alert(error.message);
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

if (paypalPayBtn) {
    paypalPayBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío");
            return;
        }

        if (!paypalOverlay || !paypalTotal) {
            alert("Falta el modal de PayPal en el HTML");
            return;
        }

        paypalTotal.textContent = total.toFixed(2);
        paypalOverlay.classList.add("active");

        if (!paypalRendered) {
            renderPaypalButtons();
            paypalRendered = true;
        }
    });
}

if (closePaypal) {
    closePaypal.addEventListener("click", () => {
        paypalOverlay.classList.remove("active");
    });
}

if (paypalOverlay) {
    paypalOverlay.addEventListener("click", event => {
        if (event.target === paypalOverlay) {
            paypalOverlay.classList.remove("active");
        }
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

        guardarOrden("Tarjeta", cardNumber.value)
            .then(data => {
                if (data.success) {
                    saveOrder("Tarjeta", data.numero_orden, data.fecha);
                    renderOrders();

                    alert("Pago aprobado. Orden #" + data.numero_orden);
                    paymentOverlay.classList.remove("active");
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error(error);
                alert(error.message);
            });
    });
}

function updateCart() {
    if (!cartItems || !cartTotal || !cartCount) return;

    cartItems.innerHTML = "";

    cart.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("cart-item");

        div.innerHTML = `
            <strong>${item.name}</strong><br>
            Cantidad: ${item.quantity}<br>
            Precio: $${item.subtotal.toFixed(2)}
        `;

        cartItems.appendChild(div);
    });

    cartTotal.textContent = total.toFixed(2);
    cartCount.textContent = cart.length;
}

function generateOrderQR(orderNumber) {
    if (!qrCanvas || !qrBox) {
        alert("No existe el espacio para mostrar el QR");
        return;
    }

    if (typeof QRCode === "undefined") {
        alert("No se cargó la librería QRCode");
        return;
    }

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

function clearQR() {
    if (!qrBox || !qrCanvas) return;

    qrBox.classList.remove("active");

    const context = qrCanvas.getContext("2d");
    context.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
}

function saveOrder(method, orderNumber, orderDate = new Date().toISOString().slice(0, 10)) {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    orders.push({
        numero: Number(orderNumber),
        fechaOrden: orderDate,
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

        let products = "";

        order.productos.forEach(product => {
            products += `${product.name} x${product.quantity} - $${product.subtotal.toFixed(2)}<br>`;
        });

        div.innerHTML = `
            <strong>Orden #${order.numero}</strong><br>
            Método: ${order.metodo}<br>
            ${order.fecha}<br>
            ${products}
            <strong>Total: $${order.total.toFixed(2)}</strong><br><br>

            <button class="show-qr-btn" data-index="${index}" style="background:#3498db; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:5px;">
                Ver QR
            </button>

            <button class="cancel-order-btn" data-index="${index}" style="background:#d93636; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">
                Cancelar
            </button>
        `;

        profileOrders.appendChild(div);
    });

    document.querySelectorAll(".show-qr-btn").forEach(button => {
        button.addEventListener("click", () => {
            const index = button.dataset.index;
            const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];
            const order = savedOrders[index];

            if (!order) {
                alert("No se encontró la orden");
                return;
            }

            showSavedOrderQR(order);
        });
    });

    document.querySelectorAll(".cancel-order-btn").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.index);
            cancelOrder(index);
        });
    });
}

function showSavedOrderQR(order) {
    if (!qrCanvas || !qrBox) {
        alert("No existe el espacio para mostrar el QR");
        return;
    }

    if (typeof QRCode === "undefined") {
        alert("No se cargó la librería QRCode");
        return;
    }

    let text = "Pedido UTN\n";
    text += `Orden #${order.numero}\n\n`;

    order.productos.forEach(product => {
        text += `${product.name} x${product.quantity} - $${product.subtotal.toFixed(2)}\n`;
    });

    text += `\nTotal: $${order.total.toFixed(2)}`;
    text += `\nMétodo: ${order.metodo}`;

    QRCode.toCanvas(qrCanvas, text, {
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
        cartOverlay.classList.add("active");
    });
}

function cancelOrder(index) {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const order = orders[index];

    if (!order) {
        alert("No se encontró la orden");
        return;
    }

    const confirmCancel = confirm(`¿Cancelar la Orden #${order.numero}?`);

    if (!confirmCancel) {
        return;
    }

    fetch("cancelar_orden.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            numero_orden: order.numero,
            fecha: order.fechaOrden
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            alert(data.message);
            return;
        }

        const deletedNumber = order.numero;
        const deletedDate = order.fechaOrden;

        orders.splice(index, 1);

        orders.forEach(savedOrder => {
            if (
                savedOrder.fechaOrden === deletedDate &&
                Number(savedOrder.numero) > Number(deletedNumber)
            ) {
                savedOrder.numero = Number(savedOrder.numero) - 1;
            }
        });

        localStorage.setItem("orders", JSON.stringify(orders));

        alert("Orden cancelada correctamente");
        renderOrders();
        clearQR();
    })
    .catch(() => {
        alert("No se pudo conectar con cancelar_orden.php");
    });
}

function loadProfile() {
    if (!profileUser) return;

    fetch("perfil.php")
        .then(response => response.json())
        .then(data => {
            if (!data.logueado) {
                window.location.href = "index.html";
                return;
            }

            profileUser.textContent = data.usuario;
        })
        .catch(() => {
            profileUser.textContent = "No disponible";
        });
}

function renderPaypalButtons() {
    if (typeof paypal === "undefined") {
        alert("No se cargó PayPal. Revisa el script SDK en login.html.");
        return;
    }

    const paypalContainer = document.getElementById("paypal-button-container");

    if (!paypalContainer) {
        alert("Falta el contenedor paypal-button-container en el HTML");
        return;
    }

    paypalContainer.innerHTML = "";

    paypal.Buttons({
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    description: "Pedido UTN",
                    amount: {
                        currency_code: "MXN",
                        value: total.toFixed(2)
                    }
                }]
            });
        },

        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                const paypalId = details.id;

                guardarOrden("PayPal", "", paypalId)
                    .then(data => {
                        if (data.success) {
                            saveOrder("PayPal", data.numero_orden, data.fecha);
                            renderOrders();

                            alert("Pago con PayPal aprobado. Orden #" + data.numero_orden);
                            paypalOverlay.classList.remove("active");
                        } else {
                            alert(data.message);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        alert(error.message);
                    });
            });
        },

        onCancel: function() {
            alert("Pago cancelado");
        },

        onError: function() {
            alert("Ocurrió un error con PayPal");
        }
    }).render("#paypal-button-container");
}