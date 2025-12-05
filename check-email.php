<?php
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);

if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email']);
    exit;
}

$users_file = __DIR__ . '/../data/DB/Users.json';
$users_data = file_exists($users_file) ? json_decode(file_get_contents($users_file), true) : ['users' => []];

$emailExists = false;
foreach ($users_data['users'] as $user) {
    if (strtolower($user['email']) === strtolower($email)) {
        $emailExists = true;
        break;
    }
}

echo json_encode(['success' => true, 'emailExists' => $emailExists]);
?>