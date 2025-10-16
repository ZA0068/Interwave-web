PHP-only SCSS workflow (no Node.js)

Requirements:
- PHP 7.4+ with CLI enabled
- Composer (https://getcomposer.org/)

Setup:
1. From the project root run:

   composer install

2. Compile SCSS one-off:

   php tools/compile-scss.php compile

3. Watch SCSS and auto-compile on changes:

   php tools/compile-scss.php watch

Notes:
- The entrypoint is `scss/contents/Main.scss`. The compiled file is written to `css/styles.css`.
- If your hosting doesn't allow running composer, compile locally and upload `css/styles.css` and `css/` assets.
- The script uses `scssphp/scssphp` for compilation.
