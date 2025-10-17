<?php
// Security headers
header("Content-Type: application/json");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

// Start session securely
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/User.php';
require_once __DIR__ . '/JWTHelper.php';
require_once __DIR__ . '/EnvLoader.php';

try {
    // Load environment configuration
    EnvLoader::load();
    
    $database = new Database();
    $db = $database->getConnection();
    $user = new User($db);

    $data = json_decode(file_get_contents("php://input"));

    // Validate input
    if (empty($data->username) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(["message" => "Username and password are required."]);
        exit;
    }

    // Sanitize input
    $username = filter_var(trim($data->username), FILTER_SANITIZE_EMAIL);
    $password = $data->password;

    if (!$username) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid email format."]);
        exit;
    }

    $user->username = $username;

    if ($user->userExists()) {
        if ($user->verifyPassword($password)) {
            session_start();
            $_SESSION['user'] = $user->username;
            
            // Generate JWT token
            $payload = [
                'user' => $user->username,
                'iat' => time(),
                'exp' => time() + (7 * 24 * 60 * 60) // 7 days expiration
            ];
            
            $jwt = JWTHelper::encode($payload);
            
            if ($jwt === false) {
                http_response_code(500);
                echo json_encode(["message" => "Authentication system error."]);
                exit;
            }
            
            // Set JWT as httpOnly cookie
            $cookieOptions = [
                'expires' => time() + (7 * 24 * 60 * 60),
                'path' => '/',
                'httponly' => true,
                'secure' => false, // Set to true when using HTTPS
                'samesite' => 'Lax'
            ];
            
            setcookie('auth_token', $jwt, $cookieOptions);
            
            $user->updateLastLogin();
            http_response_code(200);
            echo json_encode([
                "message" => "Login successful.",
                "user" => $user->username
            ]);
        } else {
            // Add delay to prevent brute force attacks
            sleep(1);
            http_response_code(401);
            echo json_encode(["message" => "Invalid credentials."]);
        }
    } else {
        // Add delay to prevent brute force attacks
        sleep(1);
        http_response_code(401);
        echo json_encode(["message" => "Invalid credentials."]);
    }
} catch (Exception $e) {
    // Log the detailed error
    error_log("Login error: " . $e->getMessage());
    
    // Show generic error to user
    http_response_code(500);
    echo json_encode(["message" => "Login system temporarily unavailable."]);
}
?>
