<?php
/*
 * piiCrypto.php — PII フィールド暗号化ヘルパー（libsodium secretbox）
 * 保存フォーマット: base64( "v1" || nonce(24B) || ciphertext )
 * 復号は "v1" 等の既知プレフィックスで始まらない値を「平文」とみなしてそのまま返す
 * （移行途中の平文/暗号文混在に耐える・移行バッチを冪等にするための設計）。
 */

// 暗号化。平文文字列 → 保存用文字列。null/空はそのまま返す（空を暗号化しない）。
function encryptPii($plain){
	global $PII_KEYS, $PII_KEY_CURRENT;
	if($plain === null || $plain === '') return $plain;
	$key = base64_decode($PII_KEYS[$PII_KEY_CURRENT]);
	$nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);        // 24B
	$cipher = sodium_crypto_secretbox($plain, $nonce, $key);
	$out = base64_encode($PII_KEY_CURRENT . $nonce . $cipher);        // "v1"+nonce+ct
	sodium_memzero($key);
	return $out;
}

// 復号。保存用文字列 → 平文。既知プレフィックスで始まらなければ平文とみなし素通し。
function decryptPii($stored){
	global $PII_KEYS;
	if($stored === null || $stored === '') return $stored;
	$raw = base64_decode($stored, true);
	if($raw === false) return $stored;                               // base64でない＝平文
	// 先頭2文字が既知の鍵バージョンか。
	$ver = substr($raw, 0, 2);
	if(!isset($PII_KEYS[$ver])) return $stored;                      // 未知＝平文として素通し
	$key = base64_decode($PII_KEYS[$ver]);
	$nonce = substr($raw, 2, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
	$cipher = substr($raw, 2 + SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
	if(strlen($nonce) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) return $stored;  // 壊れ値
	$plain = sodium_crypto_secretbox_open($cipher, $nonce, $key);
	sodium_memzero($key);
	if($plain === false) return $stored;                             // 認証失敗（改竄/別鍵）
	return $plain;
}

// 配列の指定キーだけ暗号化して返す（書き込み側で使う）。
function encryptPiiFields($arr, $fields){
	foreach($fields as $f){
		if(array_key_exists($f, $arr)) $arr[$f] = encryptPii($arr[$f]);
	}
	return $arr;
}

// 配列の指定キーだけ復号して返す（読み取り側で使う）。
function decryptPiiFields($arr, $fields){
	foreach($fields as $f){
		if(array_key_exists($f, $arr)) $arr[$f] = decryptPii($arr[$f]);
	}
	return $arr;
}

// piiCrypto.php の末尾に追加
// 暗号化対象フィールド（第1弾：email と cbirth は除外）
$PII_FIELDS_USER     = array('ulname','ufname','ulname_k','ufname_k','hlname','hfname','hlname_k','hfname_k','zipcode','prefecture','cityarea','street','building','uphone','hphone');
$PII_FIELDS_CHILD    = array('clname','cfname','clname_k','cfname_k');
// fam_members / fam_rel は JSON文字列として暗号化（json_encode の後に encryptPii）

// ------------------------------------ Add the following:
// piiCrypto.php の末尾に追加
// 既に暗号化済みか（既知の鍵バージョンで始まるか）。移行バッチの冪等性判定用。
function isEncryptedPii($stored){
	global $PII_KEYS;
	if($stored === null || $stored === '') return false;   // 空は対象外
	$raw = base64_decode($stored, true);
	if($raw === false) return false;                       // base64でない＝平文
	return isset($PII_KEYS[substr($raw, 0, 2)]);           // 先頭2文字が既知鍵バージョン
}

?>
