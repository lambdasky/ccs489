<?php
// 一時ファイル：~/seikyogakuen.org/public_html/kg/ccs/_migrate_pii.php
// 実行前に DB をバックアップすること。実行後は即削除すること。
header('Content-Type: text/plain; charset=UTF-8');
ini_set('display_errors', '1');          // ★一時：エラーを画面表示
error_reporting(E_ALL);                  // ★一時

// ★ 接続先を明示。試験は ccs9、本番は ccs。取り違え防止に手で確認してから実行。
//require_once('/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs/commonDb_sa3V0BQJlU3JE.php');
require_once('/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs/commonDb_sa3V0BQJlU3JE20261012.php');
// commonDb が piiCrypto / piiKey も読み込む。

// --- セーフティ: 接続先DBを表示して目視確認させる ---
echo "=== PII migration ===\n";
echo "Target DB: {$DB_NAME} @ {$HOST}\n";
echo "対象DBを確認してください。違っていたら今すぐ閉じること。\n\n";

// --- dry-run / 本実行の切り替え ---
// URLに ?go=yes が無ければ件数カウントのみ（何も書き換えない）。
$doWrite = (isset($_GET['go']) && $_GET['go'] === 'yes');
echo $doWrite? ">>> 本実行モード（UPDATE します）\n\n": ">>> DRY-RUN（件数のみ。?go=yes で本実行）\n\n";

$dbh = connectDb($HOST, $DB_NAME, $DB_USER, $DB_PW);
$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1行を指定列について暗号化UPDATE。既に暗号化済みの列はスキップ（冪等）。
function migrateRow($dbh, $table, $pk, $pkval, $fields, $doWrite){
	// 現在値を取得
	$cols = implode(',', $fields);
	$sth = $dbh->prepare("SELECT $cols FROM $table WHERE $pk = ?");
	$sth->execute(array($pkval));
	$row = $sth->fetch(PDO::FETCH_ASSOC);
	if(!$row) return 0;

	$sets = array(); $vals = array(); $changed = 0;
	foreach($fields as $f){
		$cur = $row[$f];
		if($cur === null || $cur === '') continue;        // 空は触らない
		if(isEncryptedPii($cur)) continue;                // 既に暗号化済み → スキップ
		$sets[] = "$f = ?";
		$vals[] = encryptPii($cur);
		$changed++;
	}
	if($changed === 0) return 0;
	if($doWrite){
		$vals[] = $pkval;
		$up = $dbh->prepare("UPDATE $table SET " . implode(',', $sets) . " WHERE $pk = ?");
		$up->execute($vals);
	}
	return $changed;
}

// --- users ---
$userFields = $PII_FIELDS_USER;                            // 氏名・住所・電話
$userJsonFields = array('fam_members', 'fam_rel');         // JSON（文字列として暗号化）
$sth = $dbh->query("SELECT uid FROM users");
$uids = $sth->fetchAll(PDO::FETCH_COLUMN);
$uCnt = 0; $uRowsTouched = 0;
foreach($uids as $uid){
	$c = migrateRow($dbh, 'users', 'uid', $uid, $userFields, $doWrite);
	// JSON列も同じ関数で（既に暗号化済みなら isEncryptedPii でスキップされる）
	$c += migrateRow($dbh, 'users', 'uid', $uid, $userJsonFields, $doWrite);
	if($c > 0){ $uCnt += $c; $uRowsTouched++; }
}
echo "users: {$uRowsTouched} 行で {$uCnt} 列を" . ($doWrite? "暗号化しました": "暗号化予定") . "\n";

// --- children ---
$childFields = $PII_FIELDS_CHILD;                          // 氏名
$sth = $dbh->query("SELECT cid FROM children");
$cids = $sth->fetchAll(PDO::FETCH_COLUMN);
$cCnt = 0; $cRowsTouched = 0;
foreach($cids as $cid){
	$c = migrateRow($dbh, 'children', 'cid', $cid, $childFields, $doWrite);
	if($c > 0){ $cCnt += $c; $cRowsTouched++; }
}
echo "children: {$cRowsTouched} 行で {$cCnt} 列を" . ($doWrite? "暗号化しました": "暗号化予定") . "\n";

echo "\n=== done ===\n";
$dbh = null;
?>
