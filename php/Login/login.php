<?php
header("Content-Type: application/json");

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/User.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    $user->username = $data->username;

    if ($user->userExists()) {
        if ($user->verifyPassword($data->password)) {
            session_start();                  // Start session
            $_SESSION['user'] = $user->username; // Save user session
            $user->updateLastLogin();
            http_response_code(200);
            echo json_encode(["message" => "Login successful."]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Invalid password."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["message" => "User not found."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Unable to login. Data is incomplete."]);
}
