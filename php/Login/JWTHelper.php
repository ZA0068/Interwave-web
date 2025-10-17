<?php
require_once __DIR__ . '/EnvLoader.php';

class JWTHelper {
    private static $secret = null;
    
    private static function getSecret() {
        if (self::$secret === null) {
            // Load environment variables
            EnvLoader::load();
            
            // Get JWT secret from environment
            self::$secret = EnvLoader::get('JWT_SECRET');
            
            // Validate secret exists and is secure
            if (!self::$secret) {
                error_log("JWT_SECRET not found in environment variables");
                throw new Exception("Authentication system configuration error");
            }
            
            // Check if still using default/example secret
            if (self::$secret === 'your_super_secure_random_key_here_change_this_immediately') {
                error_log("WARNING: Using default JWT secret - this is insecure!");
                throw new Exception("Authentication system not properly configured");
            }
        }
        
        return self::$secret;
    }
    
    public static function encode($payload) {
        try {
            $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
            $payload = json_encode($payload);
            
            $headerEncoded = self::base64UrlEncode($header);
            $payloadEncoded = self::base64UrlEncode($payload);
            
            $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::getSecret(), true);
            $signatureEncoded = self::base64UrlEncode($signature);
            
            return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
        } catch (Exception $e) {
            error_log("JWT encode error: " . $e->getMessage());
            return false;
        }
    }
    
    public static function decode($jwt) {
        try {
            if (empty($jwt)) {
                return false;
            }
            
            $parts = explode('.', $jwt);
            if (count($parts) !== 3) {
                return false;
            }
            
            list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
            
            $signature = self::base64UrlDecode($signatureEncoded);
            $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::getSecret(), true);
            
            if (!hash_equals($signature, $expectedSignature)) {
                return false;
            }
            
            $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
            
            // Check expiration
            if (isset($payload['exp']) && time() > $payload['exp']) {
                return false;
            }
            
            return $payload;
        } catch (Exception $e) {
            error_log("JWT decode error: " . $e->getMessage());
            return false;
        }
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}
?>