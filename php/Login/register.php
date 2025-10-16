<?php
// Enable error reporting for debugging (remove or disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Only allow POST
if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

// Use strict requires with __DIR__
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/User.php';

// Initialize DB and user
$database = new Database();
$db = $database->getConnection();
if (!$db) {
    error_log('Database connection failed');
    http_response_code(500);
    echo json_encode(['message' => 'Internal server error']);
    exit;
}

$user = new User($db);

// Sanitize input from form POST
$username = htmlspecialchars(trim($_POST['username'] ?? ''));
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = trim($_POST['password'] ?? '');
$first_name = htmlspecialchars(trim($_POST['first_name'] ?? ''));
$last_name = htmlspecialchars(trim($_POST['last_name'] ?? ''));

if ($username && $email && $password && $first_name && $last_name) {
    $user->username = $username;
    $user->email = $email;
    $user->password = $password;
    $user->first_name = $first_name;
    $user->last_name = $last_name;

    if ($user->register()) {
        http_response_code(201);
        echo json_encode(["message" => "User registered successfully."]);
    } else {
        error_log('User registration failed for: ' . $email);
        http_response_code(500);
        echo json_encode(["message" => "Failed to register user."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Invalid input data."]);
}