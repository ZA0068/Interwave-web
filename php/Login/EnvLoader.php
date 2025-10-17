<?php
/**
 * Environment Configuration Loader
 * Loads configuration from .env file for security
 */
class EnvLoader {
    private static $loaded = false;
    private static $config = [];

    public static function load($envFile = null) {
        if (self::$loaded) {
            return;
        }

        $envFile = $envFile ?: __DIR__ . '/.env';
        
        if (!file_exists($envFile)) {
            throw new Exception(".env file not found at: " . $envFile);
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Parse key=value pairs
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes if present
                $value = trim($value, '"\'');
                
                // Set in $_ENV and putenv
                $_ENV[$key] = $value;
                putenv("$key=$value");
                self::$config[$key] = $value;
            }
        }
        
        self::$loaded = true;
    }

    public static function get($key, $default = null) {
        if (!self::$loaded) {
            self::load();
        }
        
        return $_ENV[$key] ?? $default;
    }

    public static function getConfig() {
        return self::$config;
    }
}
?>