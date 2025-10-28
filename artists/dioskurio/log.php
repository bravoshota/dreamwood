<?php
/* Append-only JSONL logger
   Writes one compact JSON object per line to load-YYYY-MM-DD.txt in this folder.
   Returns 204 for speed. Protect files via .htaccess if needed.
*/
header('Content-Type: text/plain');
header('Cache-Control: no-store');
http_response_code(204);

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = []; }

// Fill basics if missing
if (empty($data['time']))   { $data['time'] = gmdate('c'); }
if (!array_key_exists('src', $data)) {
  $ref = isset($_SERVER['HTTP_REFERER']) ? strtolower($_SERVER['HTTP_REFERER']) : '';
  if (strpos($ref,'instagram')!==false)      $data['src']='instagram';
  elseif (strpos($ref,'facebook')!==false)   $data['src']='facebook';
  elseif (strpos($ref,'messenger')!==false)  $data['src']='messenger';
  else                                       $data['src'] = $ref ?: 'unknown';
}
if (empty($data['device']) || empty($data['os'])) {
  $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
  $device = 'Other'; $os = 'Other';
  if (preg_match('/iPhone|iPad|iPod/i',$ua)) { $device='iPhone/iPad'; $os='iOS'; }
  elseif (preg_match('/Android/i',$ua))      { $device='Android';    $os='Android'; }
  elseif (preg_match('/Macintosh/i',$ua))    { $device='Mac';        $os='macOS'; }
  elseif (preg_match('/Windows/i',$ua))      { $device='Windows';    $os='Windows'; }
  $data['device'] = $data['device'] ?? $device;
  $data['os']     = $data['os']     ?? $os;
}

$line = json_encode($data, JSON_UNESCAPED_SLASHES);
$fname = __DIR__ . DIRECTORY_SEPARATOR . 'load-' . gmdate('Y-m-d') . '.txt';
file_put_contents($fname, $line . "\n", FILE_APPEND | LOCK_EX);