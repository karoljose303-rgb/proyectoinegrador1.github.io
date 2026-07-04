<?php
session_start();

header("Content-Type: application/json; charset=utf-8");

if (!isset($_SESSION["usuario_id"])) {
    echo json_encode([
        "logueado" => false
    ]);
    exit();
}

echo json_encode([
    "logueado" => true,
    "usuario" => $_SESSION["usuario"]
]);
?>