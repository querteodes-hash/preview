<?php
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$users_file = __DIR__ . '/../data/DB/Users.json';

function getUserIP() {
    $headers = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_REAL_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_CLIENT_IP',
        'HTTP_X_FORWARDED',
        'HTTP_X_CLUSTER_CLIENT_IP',
        'HTTP_FORWARDED_FOR',
        'HTTP_FORWARDED'
    ];
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ipList = explode(',', $_SERVER[$header]);
            foreach ($ipList as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
    }
    return filter_var($_SERVER['REMOTE_ADDR'] ?? 'unknown', FILTER_VALIDATE_IP) ?: 'unknown';
}

$newUser = [
    'name' => filter_var($input['name'] ?? '', FILTER_SANITIZE_STRING),
    'email' => filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL),
    'inviteCode' => filter_var($input['inviteCode'] ?? '', FILTER_SANITIZE_STRING),
    'ip' => getUserIP(),
    'os' => filter_var($input['os'] ?? '', FILTER_SANITIZE_STRING),
    'browser' => filter_var($input['browser'] ?? '', FILTER_SANITIZE_STRING),
    'browserVersion' => filter_var($input['browserVersion'] ?? '', FILTER_SANITIZE_STRING),
    'browserLanguage' => filter_var($input['browserLanguage'] ?? '', FILTER_SANITIZE_STRING),
    'browserPlatform' => filter_var($input['browserPlatform'] ?? '', FILTER_SANITIZE_STRING),
    'browserUserAgent' => filter_var($input['browserUserAgent'] ?? '', FILTER_SANITIZE_STRING),
    'loggedIn' => true
];

if (!$newUser['name'] || !$newUser['email'] || !$newUser['inviteCode']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$users_data = file_exists($users_file) ? json_decode(file_get_contents($users_file), true) : ['users' => []];
if (!isset($users_data['users']) || !is_array($users_data['users'])) {
    $users_data['users'] = [];
}

$emailExists = false;
$newEmail = strtolower(trim($newUser['email']));
foreach ($users_data['users'] as $user) {
    if (strtolower(trim($user['email'])) === $newEmail) {
        $emailExists = true;
        break;
    }
}

if ($emailExists) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Email already registered']);
    exit;
}

$users_data['users'][] = $newUser;
if (!file_put_contents($users_file, json_encode($users_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save user']);
    exit;
}

echo json_encode(['success' => true, 'user' => [
    'name' => htmlspecialchars($newUser['name']),
    'email' => htmlspecialchars($newUser['email']),
    'inviteCode' => htmlspecialchars($newUser['inviteCode'])
]]);
?>