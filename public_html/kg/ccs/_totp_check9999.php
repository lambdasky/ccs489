<?php
// 一時ファイル：~/seikyogakuen.org/public_html/kg/ccs/_totp_check.php
// 使用後は即削除。?uid=admin_coba&code=スマホの6桁
header('Content-Type: text/plain; charset=UTF-8');
require_once('/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs/commonDb_sa3V0BQJlU3JE.php');
$dbh = connectDb($HOST, $DB_NAME, $DB_USER, $DB_PW);

$uid  = isset($_GET['uid'])? $_GET['uid']: '';
$code = isset($_GET['code'])? preg_replace('/\D/', '', $_GET['code']): '';

$sth = $dbh->prepare("SELECT totp_secret FROM pwent WHERE uid = :uid");
$sth->execute(array(':uid' => $uid));
$row = $sth->fetch(PDO::FETCH_ASSOC);
if(!$row){ echo "no such uid\n"; exit; }

$stored = $row['totp_secret'];
echo "stored(先頭20): " . substr($stored, 0, 20) . " ...\n";

$secret = decryptPii($stored);
echo "decrypted secret: [{$secret}]\n";
echo "secret length: " . strlen($secret) . "\n";
echo "server time: " . date('Y-m-d H:i:s') . " (unixtime " . time() . ")\n";

$secretBin = base32Decode($secret);
echo "base32Decode byte length: " . strlen($secretBin) . "\n";

$counter = intdiv(time(), 30);
echo "counter: {$counter}\n";
echo "--- サーバが計算する6桁（前後3窓） ---\n";
for($w = -3; $w <= 3; $w++){
	echo sprintf("  w=%+d : %s\n", $w, totpCodeAt($secretBin, $counter + $w));
}
echo "入力コード: [{$code}]\n";
echo "verifyTotp(window=1): " . var_export(verifyTotp($secret, $code, 1), true) . "\n";
echo "verifyTotp(window=3): " . var_export(verifyTotp($secret, $code, 3), true) . "\n";
?>
