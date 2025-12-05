<?php
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$platform = filter_var(strtolower($_GET['platform'] ?? ''), FILTER_SANITIZE_STRING);
$links_file = __DIR__ . '/../data/DB/Links.json';

if (!file_exists($links_file)) {
    http_response_code(404);
    echo json_encode(['error' => 'Links file not found']);
    exit;
}

$links_data = json_decode(file_get_contents($links_file), true);
if (!is_array($links_data)) {
    $links_data = [];
}

$link = '';
switch ($platform) {
    case 'windows':
        $link = $links_data['windows'] ?? '';
        break;
    case 'mac':
    case 'macos':
        $link = $links_data['mac'] ?? $links_data['macos'] ?? '';
        break;
    default:
        $link = '';
}

if ($link) {
    header('Location: ' . filter_var($link, FILTER_SANITIZE_URL), true, 302);
    exit;
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Download link not found for this platform']);
    exit;
}
?>