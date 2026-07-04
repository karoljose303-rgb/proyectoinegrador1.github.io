<?php
$servidor = "localhost";
$usuarioBD = "root";
$passwordBD = "";
$baseDatos = "proyecto";

$conexion = new mysqli($servidor, $usuarioBD, $passwordBD, $baseDatos);

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

$usuario = $_POST["usuario"];
$password = $_POST["password"];
$correo = $_POST["correo"];

$passwordSeguro = password_hash($password, PASSWORD_DEFAULT);

$sql = "INSERT INTO usuarios (usuario, password, correo) VALUES (?, ?, ?)";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("sss", $usuario, $passwordSeguro, $correo);

if ($stmt->execute()) {
    echo "
    <script>
        alert('Usuario registrado correctamente');
        window.location.href = 'index.html';
    </script>
    ";
} else {
    echo "
    <script>
        alert('Error al registrar usuario');
        window.location.href = 'registro.html';
    </script>
    ";
}

$stmt->close();
$conexion->close();
?>