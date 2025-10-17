<?php
header("Content-Type: application/json");

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/User.php';
require_once __DIR__ . '/JWTHelper.php';

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
            
            // Generate JWT token
            $payload = [
                'user' => $user->username,
                'iat' => time(),
                'exp' => time() + (7 * 24 * 60 * 60) // 7 days expiration
            ];
            $jwt = JWTHelper::encode($payload);
            
            // Set JWT as httpOnly cookie
            setcookie('auth_token', $jwt, [
                'expires' => time() + (7 * 24 * 60 * 60),
                'path' => '/',
                'httponly' => true,
                'secure' => false, // Set to true in production with HTTPS
                'samesite' => 'Lax'
            ]);
            
            $user->updateLastLogin();
            http_response_code(200);
            echo json_encode([
                "message" => "Login successful.",
                "token" => $jwt,
                "user" => $user->username
            ]);
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
