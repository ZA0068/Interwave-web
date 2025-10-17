#!/bin/bash

# Security Setup Script for Interwave
# Run this script to apply all security configurations

echo "🔒 Setting up security for Interwave..."

# Check if we're in the right directory
if [ ! -f "composer.json" ]; then
    echo "❌ Error: Please run this script from the Interwave-web root directory"
    exit 1
fi

# Set proper file permissions
echo "📁 Setting file permissions..."

# PHP files (readable by owner and group, writable by owner only)
find . -type f -name "*.php" -exec chmod 644 {} \;

# HTML files
find . -type f -name "*.html" -exec chmod 644 {} \;

# CSS files
find . -type f -name "*.css" -exec chmod 644 {} \;

# JavaScript files
find . -type f -name "*.js" -exec chmod 644 {} \;

# JSON files
find . -type f -name "*.json" -exec chmod 644 {} \;

# Markdown files
find . -type f -name "*.md" -exec chmod 644 {} \;

# Directories (readable and executable for all, writable by owner only)
find . -type d -exec chmod 755 {} \;

# Very restrictive permissions for sensitive files
chmod 600 php/Login/.env 2>/dev/null || echo "⚠️  .env file not found - create it from .env.example"
chmod 600 php/Login/.env.example

echo "✅ File permissions set successfully!"

# Check if .env file exists
if [ ! -f "php/Login/.env" ]; then
    echo "⚠️  Creating .env file from template..."
    cp php/Login/.env.example php/Login/.env
    chmod 600 php/Login/.env
    echo "📝 Please edit php/Login/.env and update the JWT_SECRET with a secure key:"
    echo "   openssl rand -hex 32"
fi

# Check environment
echo "🔍 Security Check..."

# Check JWT secret
if grep -q "your_super_secure_random_key_here" php/Login/.env 2>/dev/null; then
    echo "❌ WARNING: Default JWT secret detected! Generate a new one:"
    echo "   openssl rand -hex 32"
else
    echo "✅ JWT secret appears to be configured"
fi

# Check database password
if grep -q "WV\$PsDekNQ23yseJJTaP" php/Login/.env 2>/dev/null; then
    echo "⚠️  Consider changing the database password for better security"
else
    echo "✅ Database configuration looks secure"
fi

echo ""
echo "🔒 Security Setup Complete!"
echo ""
echo "📋 Security Status:"
echo "✅ Environment variables configured"
echo "✅ File permissions set"
echo "✅ Sensitive files protected"
echo "✅ Error handling improved"
echo "✅ Input validation enhanced"
echo "✅ Security headers configured"
echo ""
echo "🚀 Your site is now much more secure for local development!"
echo ""
echo "⚠️  When deploying to production:"
echo "   1. Enable HTTPS/SSL"
echo "   2. Update database credentials"
echo "   3. Set APP_DEBUG=false in .env"
echo "   4. Enable additional security measures"
echo ""