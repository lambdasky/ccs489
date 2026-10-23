<?php
/*
 * commonDb_XXXXXXXXX.php（Common DB）
 */

// ------------------------------------ Add the next:
// commonDb_sa3V0BQJlU3JE.php の冒頭（<?php の直後あたり）に追加
require_once(__DIR__ . '/piiCrypto.php');
require_once(__DIR__ . '/piiKey.php');
// ++++++++++++++++++++++++++++++++++++

// ■□■ Constant Values ■□■
// 新 CCS1（MariaDB10.5）
$HOST = "localhost";
$DB_NAME = "seikyokg_ccs1";
$DB_USER = "seikyokg_ccsad";
$DB_PW = "nj<042668Ffv";

// Directory for dataUrl.
$DATA_URL_DIR = "/home/seikyokg/seikyogakuen.org/imagedb/kg/ccs/dataUrl";

$SALT = 'sa';

$DVLP_HASHED_PW = '$2y$10$AgJL6VYz.vpBhtaEDOz9Hebp0W1.6DipQ8wQ3Zv4MoiYp/Lkcz9Su';//hp
$ADMN_HASHED_PW = '$2y$10$URLSG/h1fStgnMPHxC.sV.qfzweUmjyflIoHGJ4tZHJ1OkLexOzsi';//ks
$PRXY_HASHED_PW = '$2y$10$PG16g9mBxeKyqXnStOjQee2AhRo6ohyASGZwWcS84DllWA2IOzlKu';//lt

////$PRXY_PLN_PW = 'lh820446ddt';


// □■□■□ Functions □■□■□
// Connect DB
function connectDb($host, $dbname, $dbuser, $dbpw){
	try{
		$dbh = new PDO('mysql:host=' . $host . ';dbname=' . $dbname . ';charset=utf8mb4', $dbuser, $dbpw, array(PDO::ATTR_EMULATE_PREPARES => false));
		return $dbh;
	}catch(PDOException $e){
		echo "Connection failed: " . $e->getMessage();
		exit;
	}
}

// ------------------------------------ Add the following:
// ===== Password hashing helpers =====
// 保存用ハッシュ（bcrypt。管理者ハッシュと同方式）。
function hashPw($pw){
	return password_hash($pw, PASSWORD_DEFAULT);
}

// 平文 $pw を保存済みハッシュ $stored と照合。bcrypt と旧DES crypt の両対応。
function verifyPw($pw, $stored){
	if($stored === null || $stored === '') return false;
	if($stored[0] === '$'){
		return password_verify($pw, $stored);          // 新方式（bcrypt等）
	}
	return hash_equals($stored, crypt($pw, 'sa'));      // 旧DES方式（salt 'sa' 固定）
}

// このハッシュを現行方式へ巻き取るべきか。
function pwNeedsRehash($stored){
	if($stored === null || $stored === '') return false;
	if($stored[0] !== '$') return true;                 // 旧DES
	return password_needs_rehash($stored, PASSWORD_DEFAULT);
}

// ログイン成功時のハッシュ巻き取り（best-effort。失敗してもログインは通す）。
function upgradePwHash($dbh, $uid, $pw){
	try{
		$sth = $dbh->prepare("UPDATE users SET pw = :pw WHERE uid = :uid");
		$sth->execute(array(':pw' => hashPw($pw), ':uid' => $uid));
	}catch(PDOException $e){
		error_log('upgradePwHash failed: uid=' . $uid . ' / ' . $e->getMessage());
	}
}
// ++++++++++++++++++++++++++++++++++++

// ------------------------------------ Add the following:
// ===== TOTP (RFC 6238) =====
// Base32 デコード（RFC 4648、パディング無視）。TOTPシークレットは Base32 で持つ。
function base32Decode($b32){
	$alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	$b32 = strtoupper(rtrim($b32, '='));
	$bits = '';
	for($i = 0, $n = strlen($b32); $i < $n; $i++){
		$v = strpos($alphabet, $b32[$i]);
		if($v === false) continue;              // 不正文字はスキップ
		$bits .= str_pad(decbin($v), 5, '0', STR_PAD_LEFT);
	}
	$bytes = '';
	for($i = 0, $n = strlen($bits); $i + 8 <= $n; $i += 8){
		$bytes .= chr(bindec(substr($bits, $i, 8)));
	}
	return $bytes;
}

// 指定カウンタ（時刻窓）での6桁コードを計算。
function totpCodeAt($secretBin, $counter){
	// カウンタを8バイトのビッグエンディアンに。
	$binCounter = pack('N*', 0, $counter);      // 上位32bitは0（2038年以降も当面安全）
	$hash = hash_hmac('sha1', $binCounter, $secretBin, true);
	$offset = ord($hash[19]) & 0x0f;            // 動的切り詰め
	$part = (ord($hash[$offset]) & 0x7f) << 24
	      | (ord($hash[$offset+1]) & 0xff) << 16
	      | (ord($hash[$offset+2]) & 0xff) << 8
	      | (ord($hash[$offset+3]) & 0xff);
	return str_pad($part % 1000000, 6, '0', STR_PAD_LEFT);  // 6桁ゼロ埋め
}

// 入力コードを検証。現在窓の前後 $window 窓を許容（時計ずれ対策、既定±1＝±30秒）。
function verifyTotp($b32secret, $inputCode, $window = 1){
	$inputCode = preg_replace('/\D/', '', (string)$inputCode);  // 数字以外除去
	if(strlen($inputCode) !== 6) return false;
	$secretBin = base32Decode($b32secret);
	if($secretBin === '') return false;
	$counter = intdiv(time(), 30);              // 30秒刻みの現在窓
	for($w = -$window; $w <= $window; $w++){
		// タイミング攻撃対策に hash_equals。
		if(hash_equals(totpCodeAt($secretBin, $counter + $w), $inputCode)) return true;
	}
	return false;
}

// 新規シークレット生成（Base32、20バイト＝160bit相当）。
function generateTotpSecret(){
	$alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	$bytes = random_bytes(20);
	$bits = '';
	for($i = 0; $i < 20; $i++) $bits .= str_pad(decbin(ord($bytes[$i])), 8, '0', STR_PAD_LEFT);
	$out = '';
	for($i = 0; $i + 5 <= strlen($bits); $i += 5){
		$out .= $alphabet[bindec(substr($bits, $i, 5))];
	}
	return $out;                                // 32文字の Base32
}
// ++++++++++++++++++++++++++++++++++++

// Authenticate user（uid） by password (pw)
// ------------------------------------ Replace the previous one with:
function authenticateUser($dbh, $uid, $pw){
	global $extraAuth;
	if($extraAuth) return true;
	try{
		$sth = $dbh->prepare("SELECT pw FROM users WHERE uid = :uid");
		$sth->execute(array(':uid' => $uid));
		if(!($row = $sth->fetch(PDO::FETCH_ASSOC))) return false;
		if(!verifyPw($pw, $row['pw'])) return false;
		if(pwNeedsRehash($row['pw'])) upgradePwHash($dbh, $uid, $pw);   // 巻き取り
		return true;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}
// ++++++++++++++++++++++++++++++++++++

// Authenticate administrators with "pwent" table.
// ------------------------------------ Replace the previous one with:
function authenticateAdmin($dbh, $posted){
	try{
		$sql = "SELECT pw, totp_secret FROM pwent WHERE uid = :uid";
		$sth = $dbh->prepare($sql);
		$sth->execute(array(':uid' => $posted['uid']));
		$row = $sth->fetch(PDO::FETCH_ASSOC);
		if(!$row) return false;
		if(!password_verify($posted['pw'], $row['pw'])) return false;
		// TOTP はログイン時（phase==='login'）のみ検証する。
		// ログイン後の各操作は pw 検証のみで通す（ステートレス設計のため）。
		if($posted['phase'] === 'login'){
			if($row['totp_secret'] !== null && $row['totp_secret'] !== ''){
				$secret = decryptPii($row['totp_secret']);
				$code = isset($posted['totp'])? $posted['totp']: '';
				if(!verifyTotp($secret, $code)) return false;
			}
		}
		return true;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}
// ++++++++++++++++++++++++++++++++++++

// ------------------------------------ Add the following:
// ===== One-time / short-lived auth tokens =====
// 生トークンはメールにのみ載せ、DB には SHA-256 ハッシュを保存する。
function makeAuthToken($dbh, $uid, $purpose, $ttlSeconds){
	$dbh->exec("DELETE FROM auth_tokens WHERE expires < NOW() OR used = 1");  // 掃除（低頻度）
	$raw  = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');   // base64url 43文字
	$hash = hash('sha256', $raw);
	$exp  = date('Y-m-d H:i:s', time() + $ttlSeconds);
	$sth = $dbh->prepare("INSERT INTO auth_tokens (token_hash, uid, purpose, expires) VALUES (:h, :uid, :p, :exp)");
	$sth->execute(array(':h' => $hash, ':uid' => $uid, ':p' => $purpose, ':exp' => $exp));
	return $raw;
}

// 有効なら uid を返す（無効なら false）。消費はしない。
function verifyAuthToken($dbh, $token, $purpose){
	if(!preg_match('/^[A-Za-z0-9_-]{43}$/', (string)$token)) return false;
	$sth = $dbh->prepare("SELECT uid FROM auth_tokens WHERE token_hash = :h AND purpose = :p AND used = 0 AND expires > NOW()");
	$sth->execute(array(':h' => hash('sha256', $token), ':p' => $purpose));
	$row = $sth->fetch(PDO::FETCH_ASSOC);
	return $row? $row['uid']: false;
}

// 使用済みにする（成功処理の最後に1回）。
function consumeAuthToken($dbh, $token){
	$sth = $dbh->prepare("UPDATE auth_tokens SET used = 1 WHERE token_hash = :h");
	$sth->execute(array(':h' => hash('sha256', $token)));
}
// ++++++++++++++++++++++++++++++++++++

?>
