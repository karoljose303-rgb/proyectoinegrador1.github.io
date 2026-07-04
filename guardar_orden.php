<?php
session_start();

header("Content-Type: application/json; charset=utf-8");

function responder($success, $message, $extra = []) {
    echo json_encode(array_merge([
        "success" => $success,
        "message" => $message
    ], $extra));
    exit();
}

if (!isset($_SESSION["usuario_id"]) || !isset($_SESSION["usuario"])) {
    responder(false, "Debes iniciar sesión para comprar");
}

include "conexion.php";

if (!isset($conexion) || $conexion->connect_error) {
    responder(false, "Error de conexión a la base de datos");
}

$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos) {
    responder(false, "No se recibieron datos válidos");
}

$usuarioId = intval($_SESSION["usuario_id"]);
$usuario = $_SESSION["usuario"];
$total = isset($datos["total"]) ? floatval($datos["total"]) : 0;
$metodoPago = $datos["metodo_pago"] ?? "";
$paypalId = $datos["paypal_id"] ?? null;
$fechaHoy = date("Y-m-d");

if ($total <= 0 || $metodoPago === "") {
    responder(false, "Total o método de pago inválido");
}

$tarjetaOculta = "No aplica";

if ($metodoPago === "Tarjeta" && !empty($datos["tarjeta"])) {
    $numeroTarjeta = preg_replace("/\D/", "", $datos["tarjeta"]);
    $ultimos4 = substr($numeroTarjeta, -4);
    $tarjetaOculta = "**** **** **** " . $ultimos4;
}

$sqlOrden = "SELECT COALESCE(MAX(numero_orden), 0) + 1 AS siguiente_orden
             FROM orden
             WHERE fecha = ?";

$stmtOrden = $conexion->prepare($sqlOrden);

if (!$stmtOrden) {
    responder(false, "Error preparando número de orden: " . $conexion->error);
}

$stmtOrden->bind_param("s", $fechaHoy);

if (!$stmtOrden->execute()) {
    responder(false, "Error consultando número de orden: " . $stmtOrden->error);
}

$stmtOrden->bind_result($numeroOrden);
$stmtOrden->fetch();
$stmtOrden->close();

$sql = "INSERT INTO orden
        (usuario_id, usuario, numero_orden, total, metodo_pago, tarjeta, paypal_id, estado_pago, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pagado', ?)";

$stmt = $conexion->prepare($sql);

if (!$stmt) {
    responder(false, "Error preparando guardado de orden: " . $conexion->error);
}

$stmt->bind_param(
    "isidssss",
    $usuarioId,
    $usuario,
    $numeroOrden,
    $total,
    $metodoPago,
    $tarjetaOculta,
    $paypalId,
    $fechaHoy
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Orden guardada correctamente",
        "numero_orden" => $numeroOrden,
        "usuario" => $usuario,
        "fecha" => $fechaHoy,
        "paypal_id" => $paypalId
    ]);
} else {
    responder(false, "No se pudo guardar la orden: " . $stmt->error);
}

$stmt->close();
$conexion->close();
?>