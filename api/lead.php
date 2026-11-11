<?php
/**
 * SIG Eagle Eye: emails the team when someone sends the lead form on /contact/.
 *
 * The form asks for a name, email and phone number only. Every lead is also appended to
 * a log file outside the web root (../sig-leads/ next to public_html), so a lead is never
 * lost if an email goes astray. The visitor gets no email.
 *
 * Protections: POST only, same-site Origin or Referer, small bodies only, a honeypot,
 * strict validation, a per-visitor and an overall hourly limit, and no visitor input in
 * any mail header except a validated Reply-To address.
 *
 * On localhost nothing is mailed or logged to disk: the message goes to the server log.
 * Standard PHP only.
 */
declare(strict_types=1);

ini_set('display_errors', '0');

const TO_EMAIL = 'info@cognexa.co.za';
const FROM_EMAIL = 'info@cognexa.co.za';
const FROM_NAME = 'SIG Eagle Eye website';
const MAX_BODY_BYTES = 8192;
const LIMIT_PER_VISITOR = 5;   // leads per visitor per hour
const LIMIT_OVERALL = 60;      // leads per hour from everyone together
const INDUSTRIES = [
    'manufacturing' => 'Manufacturing',
    'logistics' => 'Logistics & fleet',
    'mining' => 'Mining & earthmoving',
    'healthcare' => 'Healthcare facilities',
    'retail' => 'Retail & warehousing',
    'security' => 'Security operations',
];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');

function reply(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

/** A posted field, trimmed, without control characters, at most $max characters. */
function field(string $key, int $max): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    $value = preg_replace('/\p{C}+/u', ' ', $value) ?? '';
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    return mb_substr($value, 0, $max);
}

function is_local(): bool
{
    return in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1', '::1'], true);
}

/** True when the request came from a page on this same site. */
function same_site(): bool
{
    $host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')) ?? '');
    if ($host === '') {
        return false;
    }
    $source = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($source === '' || $source === 'null') {
        $source = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    }
    $sourceHost = strtolower((string) (parse_url($source, PHP_URL_HOST) ?? ''));
    return $sourceHost !== '' && $sourceHost === $host;
}

/**
 * Counts this request against a bucket and says whether it is still within $limit per hour.
 * Buckets are small files in the system temp folder, locked while they are updated.
 */
function within_limit(string $bucket, int $limit): bool
{
    $dir = sys_get_temp_dir() . '/sig-lead-limits';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return true; // can't count, so don't block real people
    }
    $handle = @fopen($dir . '/' . hash('sha256', $bucket), 'c+');
    if ($handle === false) {
        return true;
    }
    flock($handle, LOCK_EX);
    $now = time();
    $times = json_decode((string) stream_get_contents($handle), true);
    $times = array_values(array_filter(is_array($times) ? $times : [], fn ($t) => is_int($t) && $t > $now - 3600));
    $ok = count($times) < $limit;
    if ($ok) {
        $times[] = $now;
    }
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($times));
    flock($handle, LOCK_UN);
    fclose($handle);
    return $ok;
}

/** Appends the lead to ../sig-leads/leads-YYYY-MM.log, outside the web root. */
function keep_copy(array $lead): void
{
    $root = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
    if ($root === '' || is_local()) {
        return;
    }
    $dir = dirname(rtrim($root, '/')) . '/sig-leads';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        error_log('[lead.php] could not create the lead log folder');
        return;
    }
    $file = $dir . '/leads-' . gmdate('Y-m') . '.log';
    $isNew = !is_file($file);
    if (@file_put_contents($file, json_encode($lead, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) === false) {
        error_log('[lead.php] could not write the lead log');
        return;
    }
    if ($isNew) {
        @chmod($file, 0600);
    }
}

function send_mail(string $subject, string $body, string $replyTo): bool
{
    if (is_local()) {
        error_log('[lead.php] would email ' . TO_EMAIL . ": {$subject}\n{$body}\n");
        return true;
    }
    $headers = implode("\r\n", [
        'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
        'Reply-To: ' . $replyTo,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);
    $encoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return mail(TO_EMAIL, $encoded, $body, $headers, '-f' . FROM_EMAIL);
}

/* ---------------- Checks ---------------- */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, ['ok' => false, 'error' => 'POST only']);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_BODY_BYTES) {
    reply(413, ['ok' => false, 'error' => 'Too large']);
}
if (!same_site()) {
    reply(403, ['ok' => false, 'error' => 'Not allowed']);
}
if (field('company_website', 200) !== '') {
    reply(200, ['ok' => true]); // honeypot: look successful, send nothing
}

$name = field('name', 120);
$email = field('email', 200);
$phone = field('phone', 40);
$industryKey = field('industry', 40);
$industry = INDUSTRIES[$industryKey] ?? '';

$digits = preg_replace('/\D/', '', $phone) ?? '';
if ($name === ''
    || filter_var($email, FILTER_VALIDATE_EMAIL) === false
    || !preg_match('/^[0-9+()\s.\-]+$/', $phone)
    || strlen($digits) < 9 || strlen($digits) > 15) {
    reply(422, ['ok' => false, 'error' => 'Missing or invalid details']);
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$forwarded = trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
if (!within_limit('all', LIMIT_OVERALL) || !within_limit("visitor|{$ip}|{$forwarded}", LIMIT_PER_VISITOR)) {
    reply(429, ['ok' => false, 'error' => 'Too many requests']);
}

/* ---------------- Send ---------------- */

$when = (new DateTimeImmutable('now', new DateTimeZone('Africa/Johannesburg')))->format('j F Y, H:i');
$rows = [
    'Name' => $name,
    'Email' => $email,
    'Phone' => $phone,
    'Came from' => $industry !== '' ? "the {$industry} page" : '',
    'Sent' => "{$when} SAST",
];
$lines = [];
foreach ($rows as $label => $value) {
    if ($value !== '') {
        $lines[] = "{$label}: {$value}";
    }
}

keep_copy(['sent' => gmdate('c'), 'name' => $name, 'email' => $email, 'phone' => $phone, 'industry' => $industryKey]);

$sent = send_mail(
    "SIG Eagle Eye enquiry: {$name}",
    "Someone wants to talk to us about SIG Eagle Eye. Reply to this email to answer them.\n\n" . implode("\n", $lines) . "\n",
    $email
);
reply($sent ? 200 : 500, ['ok' => $sent]);
