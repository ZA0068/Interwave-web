<?php
/**
 * Production Security Configuration
 * IMPORTANT: Use this configuration for public deployment
 */

class JWTHelper {
    // CRITICAL: Change this to a strong, random secret key
    // Generate with: openssl rand -hex 32
    private static $secret;
    
    private static function getSecret() {
        if (self::$secret === null) {
            // Try to get from environment variable first
            self::$secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET');
            
            // Fallback to file-based secret (create this file with random key)
            if (!self::$secret && file_exists(__DIR__ . '/jwt_secret.key')) {
                self::$secret = trim(file_get_contents(__DIR__ . '/jwt_secret.key'));
            }
            
            // If still no secret, throw error (don't use default!)
            if (!self::$secret) {
                throw new Exception('JWT secret not configured! Check environment variables or jwt_secret.key file.');
            }
        }
        return self::$secret;
    }
    
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $headerEncoded = self::base64UrlEncode($header);
        $payloadEncoded = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::getSecret(), true);
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }
    
    public static function decode($jwt) {
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
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}
?>