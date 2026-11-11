<?php
/**
 * SIG Eagle Eye: sends mail by logging in to the mailbox over SMTP.
 *
 * Mail sent with PHP's mail() leaves from the web server without a DKIM signature for
 * sigeagleeye.com, so it lands in spam. Logging in to smtp.hostinger.com as the mailbox
 * gets the message signed (selector hostingermail-a) and passes SPF, DKIM and DMARC.
 *
 * The mailbox password lives in smtp-password.txt next to public_html, or in the hosting
 * account's top folder, on the server only. Never put it in this repository: the
 * repository is public.
 *
 * This file only defines functions; .htaccess returns 404 for it anyway.
 * Standard PHP only.
 */
declare(strict_types=1);

const SMTP_HOST = 'smtp.hostinger.com';
const SMTP_PORT = 465;

/**
 * Where smtp-password.txt may sit, outside every web root: the site's own folder (next to
 * public_html), then the hosting account's top folder (the one holding domains/).
 */
function smtp_password_files(): array
{
    $root = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    if ($root === '') {
        return [];
    }
    return [dirname($root) . '/smtp-password.txt', dirname($root, 3) . '/smtp-password.txt'];
}

/** The mailbox password from the first smtp-password.txt found, or '' when there isn't one. */
function smtp_password(): string
{
    foreach (smtp_password_files() as $file) {
        if (is_file($file) && is_readable($file)) {
            return trim((string) file_get_contents($file));
        }
    }
    return '';
}

/**
 * A complete plain-text message: headers, a blank line, then the body, all with CRLF.
 * $headers are 'Name: value' lines that the caller has already made safe.
 */
function smtp_message(array $headers, string $body): string
{
    $body = str_replace(["\r\n", "\r"], "\n", $body);
    $body = quoted_printable_encode(str_replace("\n", "\r\n", $body));
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: quoted-printable';
    return implode("\r\n", $headers) . "\r\n\r\n" . $body;
}

/**
 * Logs in and sends $message from $from to $to. Port 465 uses TLS from the start.
 * Returns false on any failure and writes the server's reply (never the password) to the
 * error log.
 */
function smtp_send(string $host, int $port, string $user, string $password, string $from, string $to, string $message): bool
{
    $context = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host]]);
    $scheme = $port === 465 ? 'ssl' : 'tcp';
    $socket = @stream_socket_client("{$scheme}://{$host}:{$port}", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
    if ($socket === false) {
        $GLOBALS['smtp_last_error'] = "connect: {$errno} {$errstr}";
        error_log("[lead.php] SMTP could not connect to {$host}:{$port}: {$errstr}");
        return false;
    }
    stream_set_timeout($socket, 15);

    $step = static function (?string $command, int $expect, string $label) use ($socket): bool {
        if ($command !== null) {
            fwrite($socket, $command . "\r\n");
        }
        $reply = '';
        while (($line = fgets($socket, 1024)) !== false) {
            $reply .= $line;
            if (strlen($line) < 4 || $line[3] !== '-') {
                break; // last line of the reply
            }
        }
        if ((int) substr($reply, 0, 3) === $expect) {
            return true;
        }
        $first = trim((string) strtok($reply, "\r\n"));
        $GLOBALS['smtp_last_error'] = "{$label}: " . ($first !== '' ? $first : 'no reply');
        error_log("[lead.php] SMTP {$label} failed: " . ($first !== '' ? $first : 'no reply'));
        return false;
    };

    // A line that starts with a dot gets a second dot, so it can't end the message early.
    $data = preg_replace('/^\./m', '..', $message) ?? $message;

    $sent = $step(null, 220, 'greeting')
        && $step('EHLO ' . (gethostname() ?: 'localhost'), 250, 'EHLO')
        && $step('AUTH LOGIN', 334, 'AUTH')
        && $step(base64_encode($user), 334, 'username')
        && $step(base64_encode($password), 235, 'login')
        && $step("MAIL FROM:<{$from}>", 250, 'MAIL FROM')
        && $step("RCPT TO:<{$to}>", 250, 'RCPT TO')
        && $step('DATA', 354, 'DATA')
        && $step($data . "\r\n.", 250, 'message');

    fwrite($socket, "QUIT\r\n");
    fclose($socket);
    return $sent;
}

/** TEMPORARY diagnostic: which way the last lead went and whether the file was seen. No secrets. */
function lead_diag(string $route): void
{
    $files = [];
    foreach (smtp_password_files() as $file) {
        $files[$file] = is_file($file) ? 'found' : 'missing';
    }
    $info = ['at' => gmdate('c'), 'route' => $route, 'smtp_error' => $GLOBALS['smtp_last_error'] ?? null, 'files' => $files];
    @file_put_contents(dirname(__DIR__) . '/.lead-diag.json', json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}
