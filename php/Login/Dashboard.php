<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    // Redirect to login page if not logged in
    header("Location: /html/contents/Index.html");
    exit;
}

// Optionally, get user info from database
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/User.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);
$user->id = $_SESSION['user_id'];
$userInfo = $user->getUserInfo(); // assuming you have this method
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Interwave</title>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <header class="site-header">
        <div class="container">
            <h1 class="brand">Interwave</h1>
            <nav class="main-nav">
                <a href="/">Home</a>
                <a href="/dashboard.php">Dashboard</a>
                <div class="icon"></div> <!-- session icon -->
            </nav>
        </div>
    </header>

    <main class="container">
        <h2>Welcome, <?php echo htmlspecialchars($userInfo['username'] ?? 'User'); ?>!</h2>
        <p>This is your dashboard.</p>

        <section>
            <button id="logoutBtn">Logout</button>
        </section>

        <section>
            <h3>Status</h3>
            <span id="sessionStatus">Checking session...</span>
        </section>
    </main>

    <script type="module">
        import sessionManager from '/js/components/SessionManager.js';

        // Update status text
        const statusEl = document.getElementById('sessionStatus');
        function updateStatus(isLoggedIn) {
            statusEl.textContent = isLoggedIn ? 'Logged In' : 'Logged Out';
            statusEl.style.color = isLoggedIn ? 'green' : 'red';
        }

        // Hook into session manager
        const originalUpdateIcon = sessionManager.updateIconState.bind(sessionManager);
        sessionManager.updateIconState = function(isLoggedIn) {
            originalUpdateIcon(isLoggedIn);
            updateStatus(isLoggedIn);
        };

        // Initial status check
        sessionManager.refreshSessionState();

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await sessionManager.handleIconClick();
        });
    </script>
</body>
</html>
