<?php
header("Content-Type: application/json");

require_once __DIR__ . '/JWTHelper.php';

// First check JWT token from cookie
if (isset($_COOKIE['auth_token'])) {
    $payload = JWTHelper::decode($_COOKIE['auth_token']);
    if ($payload && isset($payload['user'])) {
        echo json_encode(['isLoggedIn' => true, 'user' => $payload['user']]);
        exit;
    }
}

// Fallback to session check
session_start();
if (isset($_SESSION['user'])) {
    echo json_encode(['isLoggedIn' => true, 'user' => $_SESSION['user']]);
} else {
    echo json_encode(['isLoggedIn' => false]);
}
