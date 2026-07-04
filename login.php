<?php
session_start();

$servidor = "sql5.freesqldatabase.com";
$usuarioBD = "sql5832235";
$passwordBD = "XHzwpw1gUJ";
$baseDatos = " sql5832235";

$conexion = new mysqli($servidor, $usuarioBD, $passwordBD, $baseDatos);

if ($conexion->connect_error) {
    die("Error de conexion: " . $conexion->connect_error);
}

$usuario = trim($_POST["usuario"]);
$password = trim($_POST["password"]);

$sql = "SELECT id, usuario, password FROM usuarios WHERE usuario = ?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();

$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $fila = $resultado->fetch_assoc();

    if (password_verify($password, $fila["password"])) {
    $_SESSION["usuario_id"] = $fila["id"];
$_SESSION["usuario"] = $fila["usuario"];

header("Location: login.html");
exit();
    }
}

echo "
<script>
    alert('Usuario o password incorrectos');
    window.location.href = 'index.html';
</script>
";

$stmt->close();
$conexion->close();
?>
