<?php
// 一時ファイル：~/seikyogakuen.org/public_html/kg/ccs/_totp_setup.php
// 使用後は即削除。?uid=xxx で対象adminを指定。
header('Content-Type: text/html; charset=UTF-8');
require_once('/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs/commonDb_sa3V0BQJlU3JE20261015.php');
// commonDb が piiCrypto / piiKey も読む。

$dbh = connectDb($HOST, $DB_NAME, $DB_USER, $DB_PW);
echo "<p>Target DB: {$DB_NAME}</p>";

$targetUid = isset($_GET['uid'])? $_GET['uid']: '';
if($targetUid === ''){
	// uid 一覧を出すだけ
	$sth = $dbh->query("SELECT uid, (totp_secret IS NOT NULL) AS has_secret FROM pwent");
	echo "<h3>pwent の uid 一覧</h3><ul>";
	foreach($sth->fetchAll(PDO::FETCH_ASSOC) as $r){
		echo "<li>{$r['uid']} " . ($r['has_secret']? '（登録済）': '（未登録）') . " — <a href='?uid=" . urlencode($r['uid']) . "'>このuidで生成</a></li>";
	}
	echo "</ul>";
	exit;
}

// 対象 uid の存在確認（ここまでは同じ）
$sth = $dbh->prepare("SELECT uid FROM pwent WHERE uid = :uid");
$sth->execute(array(':uid' => $targetUid));
if(!$sth->fetch()){ echo "uid が存在しません"; exit; }

// ★ 生成と保存を1アクセスで完結。表示したものがそのまま保存される。
$secret = generateTotpSecret();
$enc = encryptPii($secret);
$up = $dbh->prepare("UPDATE pwent SET totp_secret = :s WHERE uid = :uid");
$up->execute(array(':s' => $enc, ':uid' => $targetUid));

$issuer = 'KG-CCS-Admin';
$label  = rawurlencode($issuer . ':' . $targetUid);
$otpauth = "otpauth://totp/{$label}?secret={$secret}&issuer=" . rawurlencode($issuer) . "&digits=6&period=30";

echo "<p><b>{$targetUid} のシークレットを生成・保存しました。</b></p>";
echo "<p>下記をスマホに登録してください。<b>このページを再読み込みすると別のシークレットに変わり、登録済みのものは無効になります。</b></p>";
echo "<p>uid: <b>{$targetUid}</b></p>";
echo "<p>シークレット（手入力用）: <code style='font-size:1.3em'>{$secret}</code></p>";
echo "<p>otpauth URI:<br><code>" . htmlspecialchars($otpauth) . "</code></p>";
// QRは Google Charts 等の外部に投げず、URIを手入力してもらう方針。QR表示が要るなら後述。
echo "<p>Google Authenticator 等で、上記シークレットを手入力で追加してください（種類: 時間ベース）。</p>";
?>