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
$inviteCode = filter_var($input['inviteCode'] ?? '', FILTER_SANITIZE_STRING);

if (!$email || !$inviteCode) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$users_file = __DIR__ . '/../data/DB/Users.json';
$users_data = file_exists($users_file) ? json_decode(file_get_contents($users_file), true) : ['users' => []];

foreach ($users_data['users'] as $user) {
    if (strtolower($user['email']) === strtolower($email) && $user['inviteCode'] === $inviteCode) {
        echo json_encode(['success' => true, 'user' => [
            'name' => htmlspecialchars($user['name']),
            'email' => htmlspecialchars($user['email']),
            'inviteCode' => htmlspecialchars($user['inviteCode'])
        ]]);
        exit;
    }
}

http_response_code(401);
echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
exit;
?>