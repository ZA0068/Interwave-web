#!/usr/bin/env php
<?php
// Simple SCSS compiler using scssphp
// Usage: php tools/compile-scss.php [compile|watch]

$root = dirname(__DIR__);
$autoload = $root . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    fwrite(STDERR, "Please run `composer install` first to install scssphp.\n");
    exit(1);
}
require $autoload;

use ScssPhp\ScssPhp\Compiler;
use ScssPhp\ScssPhp\Exception\CompilerException;

$input = $root . '/scss/contents/Main.scss';
$output = $root . '/css/styles.css';

$mode = $argv[1] ?? 'compile';
$compiler = new Compiler();
$compiler->setImportPaths($root . '/scss');
$compiler->setFormatter(ScssPhp\ScssPhp\Formatter\Compressed::class);

function compile_scss() {
    global $compiler, $input, $output;
    if (!file_exists($input)) {
        fwrite(STDERR, "SCSS entry not found: $input\n");
        return false;
    }
    try {
        $scss = file_get_contents($input);
        $result = $compiler->compileString($scss);
        $css = $result->getCss();
        $dir = dirname($output);
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        file_put_contents($output, $css);
        fwrite(STDOUT, "Compiled: $input -> $output\n");
        return true;
    } catch (CompilerException $e) {
        fwrite(STDERR, "SCSS compile error: " . $e->getMessage() . "\n");
        return false;
    }
}

if ($mode === 'watch') {
    fwrite(STDOUT, "Watching SCSS files in scss/ (press Ctrl+C to stop)\n");
    $lastMtime = 0;
    while (true) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($GLOBALS['root'] . '/scss'));
        $changed = false;
        foreach ($it as $f) {
            if ($f->isFile()) {
                $mtime = $f->getMTime();
                if ($mtime > $lastMtime) {
                    $changed = true;
                    $lastMtime = $mtime;
                }
            }
        }
        if ($changed) {
            compile_scss();
        }
        sleep(1);
    }
} else {
    exit(compile_scss() ? 0 : 1);
}

?>