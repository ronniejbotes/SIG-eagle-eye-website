<?php
/**
 * SIG Eagle Eye: emails what people send from the get-started funnel on /contact/.
 *
 *   type=meeting  A larger operation asking to talk. SIG gets the details, and the
 *                 visitor gets an email saying someone will contact them shortly
 *                 to set up a meeting.
 *   type=install  A small site that booked an installation online. SIG gets the
 *                 booking, and the customer gets a confirmation.
 *
 * Bank details never reach this script. The debit order step is a simulation and its
 * fields have no name attribute, so the browser never sends them.
 * On localhost nothing is mailed: the messages are written to the server log instead.
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

/** The same, squeezed onto one line: safe for subjects and greetings. */
function line(string $key, int $max = 200): string
{
    return trim(preg_replace('/\s+/u', ' ', field($key, $max)) ?? '');
}

function encode_subject(string $subject): string
{
    return '=?UTF-8?B?' . base64_encode($subject) . '?=';
}

function send_mail(string $to, string $subject, string $body, string $replyTo): bool
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
        error_log("[lead.php] would email {$to}: {$subject}\n{$body}\n");
        return true;
    }
    return mail($to, encode_subject($subject), $body, $headers, '-f' . SIG_EMAIL);
}

/** "Label: value" lines, skipping anything left blank. */
function lines(array $rows): string
{
    $out = [];
    foreach ($rows as $label => $value) {
        if ($value !== '') {
            $out[] = "{$label}: {$value}";
        }
    }
    return implode("\n", $out);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'POST only']);
}
if (field('company_website') !== '') {
    reply(200, ['ok' => true]); // honeypot: look successful, send nothing
}

$type = field('type', 20);
$name = line('name', 120);
$email = field('email', 200);
if (!in_array($type, ['meeting', 'install'], true) || $name === '' || field('consent') !== 'yes'
    || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reply(422, ['ok' => false, 'error' => 'Missing or invalid details']);
}

$first = explode(' ', $name)[0];
$cameras = (int) field('cameras', 9);
$sites = (int) field('sites', 9);
$company = line('company', 160);
$sign = "\n\n" . SIG_NAME . "\n" . SIG_EMAIL;

if ($type === 'meeting') {
    $details = lines([
        'Company' => $company,
        'Industry' => line('industry'),
        'Cameras' => (string) $cameras,
        'Sites' => (string) $sites,
        'What they do' => field('about', 2000),
        'On their mind' => line('concerns', 400),
        'Name' => $name,
        'Role' => line('role', 120),
        'Email' => $email,
        'Phone' => line('phone', 40),
    ]);
    $toSig = send_mail(
        SIG_EMAIL,
        "Meeting request: {$company} ({$cameras} cameras, {$sites} sites)",
        "A larger operation asked to talk. Contact them within one business day to set up a meeting.\n\n{$details}",
        $email
    );
    $toVisitor = $toSig && send_mail(
        $email,
        'We have your request | ' . SIG_NAME,
        "Hi {$first},\n\nThank you for telling us about {$company}. Someone from our team will contact you shortly, "
            . "within one business day, to set up a meeting.\n\nThis is what you sent us:\n\n{$details}{$sign}",
        SIG_EMAIL
    );
} else {
    $reference = line('reference', 20);
    $details = lines([
        'Reference' => $reference,
        'Installation' => line('install_date') . ', arriving ' . line('install_time', 40),
        'Site address' => line('address', 300),
        'Cameras' => (string) $cameras,
        'Monthly' => line('monthly', 40) . ' by debit order on the ' . line('debit_day', 10) . ', from ' . line('first_debit', 40),
        'Name' => $name,
        'Business' => $company,
        'Industry' => line('industry'),
        'Email' => $email,
        'Phone' => line('phone', 40),
    ]);
    $toSig = send_mail(
        SIG_EMAIL,
        "Installation booked: {$reference}, " . line('install_date'),
        "A small site booked an installation online. The calendar and debit order on the website are still "
            . "simulations, so confirm the date and set up the debit order with the customer.\n\n{$details}",
        $email
    );
    $toVisitor = $toSig && send_mail(
        $email,
        "Your installation is booked: {$reference} | " . SIG_NAME,
        "Hi {$first},\n\nYour SIG Eagle Eye installation is booked.\n\n{$details}\n\n"
            . "If anything changes, reply to this email.{$sign}",
        SIG_EMAIL
    );
}

if (!$toSig) {
    reply(500, ['ok' => false, 'error' => 'Could not send']);
}
reply(200, ['ok' => true, 'confirmation' => $toVisitor]);
