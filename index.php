<?php
session_start();

// Generate CSRF token if not set
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Validate CSRF token for POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['csrf_token']) || $input['csrf_token'] !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid CSRF token']);
        exit;
    }
}

// Get request path
$request = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request = trim($request, '/');

// Serve homepage
if ($request === '') {
    include __DIR__ . '/main.html';
    exit;
}

// Serve registry.html without redirect
if ($request === 'registry.html') {
    include __DIR__ . '/registry.html';
    exit;
}

// Block direct access to sensitive directories
if (preg_match('#^/(data|DB|TGbot|bot|api)(/|$)#i', $request)) {
    http_response_code(403);
    echo 'Forbidden';
    exit;
}

// Protected routes requiring authentication
$protected_routes = ['admin', 'auth', 'download'];
if (in_array($request, $protected_routes) || strpos($request, 'api/') === 0) {
    if (!isset($_SESSION['user'])) {
        // Store the intended URL to redirect after login
        $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'];
        include __DIR__ . '/registry.html';
        exit;
    }
}

// Serve other HTML files
$htmlFile = __DIR__ . "/$request";
if (file_exists($htmlFile) && pathinfo($htmlFile, PATHINFO_EXTENSION) === 'html') {
    include $htmlFile;
    exit;
}

// Route API requests
$route = $_GET['route'] ?? '';
$api_dir = __DIR__ . '/../api/';
$allowed_api_routes = [
    'check-auth.php',
    'check-user.php',
    'check-email.php',
    'validate-code.php',
    'login.php',
    'save-users.php',
    'track_wallets.php',
    'get-link.php',
    'track_download.php'
];

if (strpos($route, 'api/') === 0) {
    $route = substr($route, 4); // Remove 'api/' prefix
}

if (in_array($route, $allowed_api_routes) && file_exists($api_dir . $route)) {
    require $api_dir . $route;
    exit;
}

// Serve static files
$file = $_SERVER['DOCUMENT_ROOT'] . '/' . $request;
if (is_file($file) && !preg_match('/\.(php|json)$/i', $file)) {
    return false; // Let the server handle static files
}

// 404 for unknown routes
http_response_code(404);
echo 'Not Found';
exit;
?>