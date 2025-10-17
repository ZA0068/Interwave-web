# Security Deployment Checklist for Interwave

## 🚨 CRITICAL - Must Fix Before Going Public

### 1. Generate Secure JWT Secret
```bash
# Generate a strong secret key
openssl rand -hex 32
```
- Create file: `php/Login/jwt_secret.key` with the generated key
- Or set environment variable: `JWT_SECRET=your_generated_key`

### 2. Secure Database Credentials
Create `php/Login/db_config.php`:
```php
<?php
return [
    'host' => 'localhost',
    'db_name' => 'user_auth_system',
    'username' => 'interwave',
    'password' => 'your_secure_password_here'
];
?>
```
- **Set file permissions**: `chmod 600 db_config.php`
- **Or use environment variables** (recommended for hosting platforms)

### 3. Enable HTTPS
- **Purchase SSL certificate** or use Let's Encrypt (free)
- **Update cookie settings** in login.php:
```php
'secure' => true,  // Only send over HTTPS
```

### 4. Server Configuration

#### Apache (.htaccess)
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security Headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Hide sensitive files
<Files "*.key">
    Deny from all
</Files>
<Files "db_config.php">
    Deny from all
</Files>
```

#### Nginx
```nginx
# Force HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}

# Security headers
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

# Block sensitive files
location ~ \.(key|config)$ {
    deny all;
}
```

## ⚠️ HIGH PRIORITY

### 5. Input Validation & Sanitization
- Add rate limiting for login attempts
- Implement CAPTCHA after failed attempts
- Validate email formats server-side
- Sanitize all user inputs

### 6. Error Handling
- Set `display_errors = Off` in php.ini
- Set `log_errors = On` in php.ini
- Use generic error messages for users
- Log detailed errors securely

### 7. File Permissions
```bash
# Set proper permissions
chmod 644 *.php *.html *.css *.js
chmod 600 jwt_secret.key db_config.php
chmod 755 directories
```

### 8. Database Security
- Create dedicated database user with minimal privileges
- Use strong database password
- Enable database firewall if available
- Regular backups with encryption

## 📊 MEDIUM PRIORITY

### 9. Additional Security Measures
- Implement Content Security Policy (CSP)
- Add brute force protection
- Set up monitoring and alerts
- Regular security updates
- Use OWASP security guidelines

### 10. Performance & Monitoring
- Set up error logging
- Monitor failed login attempts
- Implement session timeout
- Add request rate limiting

## 🔍 Security Testing

### Before Going Live:
1. **Test JWT secret** - Verify tokens can't be forged
2. **Test HTTPS** - Ensure all pages redirect to HTTPS
3. **Test file access** - Verify sensitive files are blocked
4. **SQL injection testing** - Test all form inputs
5. **XSS testing** - Test script injection prevention
6. **Session testing** - Verify proper logout and timeout

## 🌐 Hosting Platform Specific

### Shared Hosting
- Use cPanel security features
- Enable ModSecurity if available
- Use hosting provider's SSL

### VPS/Dedicated
- Configure firewall (UFW/iptables)
- Regular security updates
- Use fail2ban for brute force protection
- Consider using Docker for isolation

### Cloud Hosting (AWS/Azure/GCP)
- Use managed databases
- Implement IAM roles
- Use secrets management services
- Enable CloudFlare or similar CDN

## ⚡ Quick Security Score

**Current Status: 3/10 (Not Ready for Production)**

After implementing the checklist: **8/10 (Production Ready)**

Remember: Security is an ongoing process, not a one-time setup!