<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");

$input = json_decode(file_get_contents("php://input"), true);

$numero_orden = isset($input['numero_orden']) ? intval($input['numero_orden']) : 0;

if ($numero_orden <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Número de orden inválido."
    ]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "proyecto");

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión: " . $conn->connect_error
    ]);
    exit;
}

$conn->begin_transaction();

try {

    // Eliminar la orden usando numero_orden
    $stmt = $conn->prepare(
        "DELETE FROM orden WHERE numero_orden = ?"
    );

    $stmt->bind_param("i", $numero_orden);
    $stmt->execute();

    if ($stmt->affected_rows == 0) {
        throw new Exception("No se encontró la orden.");
    }

    $stmt->close();

    // Reordenar los numeros de orden
    $resultado = $conn->query(
        "SELECT id
         FROM orden
         ORDER BY fecha_hora ASC"
    );

    $nuevo_numero = 1;

    while ($fila = $resultado->fetch_assoc()) {

        $id_actual = $fila['id'];

        $update = $conn->prepare(
            "UPDATE orden
             SET numero_orden = ?
             WHERE id = ?"
        );

        $update->bind_param("ii", $nuevo_numero, $id_actual);
        $update->execute();
        $update->close();

        $nuevo_numero++;
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Orden eliminada correctamente."
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>