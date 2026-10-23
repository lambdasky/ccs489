<?php
require_once('/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs/piiKey.php');
require_once('/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs/piiCrypto.php');

$samples = array('山田太郎', '', '大阪府河内長野市○○町1-2-3', '{"a":1,"b":"あ"}');
foreach($samples as $s){
	$enc = encryptPii($s);
	$dec = decryptPii($enc);
	echo htmlspecialchars("plain=[$s]\n enc=[$enc]\n dec=[$dec]\n match=" . ($s === $dec? 'OK': 'NG') . "\n\n");
}
// 平文素通しの確認（既に平文の値を復号に通しても壊れない）
echo "passthrough=[" . htmlspecialchars(decryptPii('山田太郎')) . "]\n";
?>
