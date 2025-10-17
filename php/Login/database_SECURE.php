<?php
/**
 * Secure Database Configuration
 * Use environment variables for sensitive data
 */

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // Load from environment variables (recommended)
        $this->host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'user_auth_system';
        $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'interwave';
        $this->password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';
        
        // Fallback to config file (less secure but better than hardcoded)
        if (empty($this->password) && file_exists(__DIR__ . '/db_config.php')) {
            $config = include __DIR__ . '/db_config.php';
            $this->host = $config['host'] ?? $this->host;
            $this->db_name = $config['db_name'] ?? $this->db_name;
            $this->username = $config['username'] ?? $this->username;
            $this->password = $config['password'] ?? $this->password;
        }
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            // Log error securely, don't expose to user
            error_log("Database connection failed: " . $exception->getMessage());
            
            // Show generic error to user
            if ($_ENV['APP_ENV'] === 'development') {
                throw new Exception("Database connection failed: " . $exception->getMessage());
            } else {
                throw new Exception("Database connection failed. Please try again later.");
            }
        }
        return $this->conn;
    }
}
?>