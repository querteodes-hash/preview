<?php
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$inviteCode = filter_var($input['inviteCode'] ?? '', FILTER_SANITIZE_STRING);

if (!$inviteCode || strlen($inviteCode) !== 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid invite code']);
    exit;
}

$db_file = __DIR__ . '/../data/TGbot/db.json';
$db_data = file_exists($db_file) ? json_decode(file_get_contents($db_file), true) : ['users' => []];

$codeExists = false;
foreach ($db_data['users'] as $user) {
    if ($user['code'] === $inviteCode) {
        $codeExists = true;
        break;
    }
}

echo json_encode(['success' => true, 'codeExists' => $codeExists]);
?>