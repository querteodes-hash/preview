<?php
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$detectedWallets = array_map('htmlspecialchars', $input['detectedWallets'] ?? []);
$platform = htmlspecialchars($input['platform'] ?? '??????????');
$email = filter_var(strtolower(trim($input['email'] ?? '')), FILTER_SANITIZE_EMAIL);

$usersFile = __DIR__ . '/../data/DB/Users.json';
$usersData = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : ['users' => []];

if (!isset($usersData['users']) || !is_array($usersData['users'])) {
    $usersData['users'] = [];
}

$updated = false;
if ($email) {
    foreach ($usersData['users'] as &$user) {
        if (isset($user['email']) && strtolower(trim($user['email'])) === $email) {
            $user['wallets'] = $detectedWallets;
            $user['walletsPlatform'] = $platform;
            $updated = true;
            break;
        }
    }
    unset($user);
}

if ($updated) {
    if (!file_put_contents($usersFile, json_encode($usersData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT))) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'error' => 'Failed to save data']);
        exit;
    }
}

echo json_encode(['status' => $updated ? 'success' : 'user_not_found']);
?>