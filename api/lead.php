<?php
/**
 * SIG Eagle Eye: emails SIG when someone uses "Want to speak to us first?" on /contact/.
 *
 * Only SIG gets an email; the visitor sees their confirmation on the page. The debit
 * order sign-up never reaches this script.
 * On localhost nothing is mailed: the message is written to the server log instead.
 * Standard PHP only. Hostinger's PHP mail() sends from the domain's own mailbox.
 */
declare(strict_types=1);

const SIG_EMAIL = 'info@sigeagleeye.co.za';
const SIG_NAME = 'SIG Eagle Eye';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

/** A posted field, trimmed, without control characters, at most $max characters. */
function field(string $key, int $max = 300): string
{
    $value = (string) ($_POST[$key] ?? '');
    $value = preg_replace('/[^\P{C}\n]/u', '', $value) ?? '';
    return mb_substr(trim($value), 0, $max);
}

/** The same, squeezed onto one line: safe for subjects. */
function line(string $key, int $max = 200): string
{
    return trim(preg_replace('/\s+/u', ' ', field($key, $max)) ?? '');
}

function send_mail(string $subject, string $body, string $replyTo): bool
{
    $headers = implode("\r\n", [
        'From: ' . SIG_NAME . ' <' . SIG_EMAIL . '>',
        'Reply-To: ' . $replyTo,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);
    $local = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1', '::1'], true);
    if ($local) {
        error_log('[lead.php] would email ' . SIG_EMAIL . ": {$subject}\n{$body}\n");
        return true;
    }
    $encoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return mail(SIG_EMAIL, $encoded, $body, $headers, '-f' . SIG_EMAIL);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'POST only']);
}
if (field('company_website') !== '') {
    reply(200, ['ok' => true]); // honeypot: look successful, send nothing
}

$name = line('name', 120);
$email = field('email', 200);
$phone = line('phone', 40);
$callback = line('callback', 80);
if ($name === '' || $phone === '' || $callback === '' || field('consent') !== 'yes'
    || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reply(422, ['ok' => false, 'error' => 'Missing or invalid details']);
}

$company = line('company', 160);
$rows = [
    'Call them back' => $callback,
    'Name' => $name,
    'Phone' => $phone,
    'Email' => $email,
    'Role' => line('role', 120),
    'Company' => $company,
    'Industry' => line('industry'),
    'Cameras' => line('cameras', 9),
    'Sites' => line('sites', 9),
    'What they do' => field('about', 2000),
    'On their mind' => line('concerns', 400),
];
$details = [];
foreach ($rows as $label => $value) {
    if ($value !== '') {
        $details[] = "{$label}: {$value}";
    }
}

$sent = send_mail(
    "Call back request: {$company}, {$callback}",
    "Someone asked to speak to us before signing up.\n\n" . implode("\n", $details),
    $email
);
reply($sent ? 200 : 500, ['ok' => $sent]);
