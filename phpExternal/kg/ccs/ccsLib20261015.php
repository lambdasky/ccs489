<?php
/*
 * ccsLib.php（CCS Library for the Query）
 */

// ■□■ Constant Values ■□■

// utNow(UNIXTIME) → $fmDtNow("Y-m-d H:i:s")
$fmDtNow = date("Y-m-d H:i:s", (int)($curUt / 1000));

//priorPassphrase=QhU$CsmYS%203SU@f8TRw
//priorPassphrase=QhU%203SU@f8TRw
$qsToAdd = $priorTyp === 'aa'? "&typs=aa&priorPassphrase=QhU\$CsmYS%203SU@f8TRw": "";

// $qsAmpTyps is for the URL to be placed in the automated email by "infoWtngState".
// It should be noted that the destination of the email by "infoWtngState" is different from the user who deleted the reservation.
// We could use "typs" instead of "typ" and it even makes more sense. But here we leave it at "typ". Because "typ" is clearly sent when phase === 'delResv'.
$qsAmpTyps = ($typ === 'aa' || $typ === 'pr')? '&typs=' . $typ: '';

// For message (subject and body).
$PREF_SUBJ = "［KG-CCS］ ";

// The Horizontal Rule as the delimiters for the message to the user.
$HR0 = str_repeat('-', 20);
$HR_BEGIN = "{$HR0} BEGIN MESSAGE {$HR0}";
$HR_END = "{$HR0} END MESSAGE {$HR0}";

$LOGIN_GUIDE = "\n\n\nログインはこちらから！\n" . $basicUrl . "?phase=start" . $qsAmpTyps . "&email=" . $email . "&uid=" . $uid . $qsToAdd;

$KG_SIGN = "\n\n\n===========\n認定こども園\n清教学園幼稚園\n\n";

$SYS_SIGN = "\n\n\n\n## " . str_repeat('-', 12) . "\n## KG-CCS\n\n";

// Email addresses.
//$FROM = 'ccs@kg.seikyo.ed.jp';
$FROM = 'kg-ccs@seikyogakuen.org';

$DVLP_EMAIL = 'lambdasky@coba.cc';

// $ARR_CC is basically empty.
$ARR_BCC = $ARR_CC = array();

$ARR_KANRI = array('sawadamari@kg.seikyo.ed.jp', 'n.fujiwara@kg.seikyo.ed.jp', 'k-motoki@kg.seikyo.ed.jp', 'coba@kg.seikyo.ed.jp');

// Staff's emails
$STAFF_EMAILS = ['lambdasky@coba.cc', 'yoneko@coba.cc', 'musashi@coba.cc', 'yakushi@coba.cc', 'miyako@coba.cc'];

// $ADMN_EMAIL, $ARR_BCC.

if(preg_match('/@(coba.cc|seikyo.ed.jp)$/', $email) || in_array($email, $STAFF_EMAILS)){
	// It is under development work.
	$ADMN_EMAIL = 'lambdasky@yahoo.co.jp';
	$ARR_BCC = array('lambdasky@kobatec.com');
}else{
	$ADMN_EMAIL = 'ccs@kg.seikyo.ed.jp';
	$ARR_BCC = array('c.inoue@kg.seikyo.ed.jp', 'lambdasky@gmail.com');
	if(!empty($typ)){// i.e. In case of "addResv" or "delResv":
		if($typ === 'aa' || $typ === 'pr'){
			$ARR_BCC = array_merge($ARR_BCC, $ARR_KANRI);
			if($typ === 'pr'){
				array_push($ARR_BCC, 'takahashimariko@kg.seikyo.ed.jp');
			}
		}
	}
}

// $extraAuth will be identified in "ccsQuery.php" and sent to FE as $response['extraAuth'].
$extraAuth = '';

// □■□■□ Functions for query.php □■□■□

//
function dspTypName($typ){
	$typNames = array('aa' => '入園出願', 'pr' => 'スマイル', 'wk' => 'わくわくキッズ', 'bc' => 'ベビーCLUB', 'be' => 'ベビーCLUBイベント', 'er' => '絵本ルーム', 'op' => 'にこにこ広場', 'ce' => '保育体験');
	return array_key_exists($typ, $typNames)? $typNames[$typ]: 'Unknown Type';
}

// Identify the value of $extraAuth from $pw.
function identifyExtraAuth($pw){
	global $SALT;
	global $ADMN_HASHED_PW, $DVLP_HASHED_PW, $PRXY_HASHED_PW;
	if(password_verify($pw, $ADMN_HASHED_PW)){
		return 'Administrator';
	}elseif(password_verify($pw, $DVLP_HASHED_PW)){
		return 'Developer';
	}elseif(password_verify($pw, $PRXY_HASHED_PW)){
		return 'Proxy';
	}else{
		return '';// This "emptiness" is important for it will be used as "if($extraauth)"
	}
}

// Send Message.
// "$msg" is the message data consisting of the following array.
// $msg == array('from' => …, 'to' => …, 'arrCc' => …, 'arrBcc' => …, 'subject' => …, 'body' => …)
function sendMessage($msg){
	if(empty($msg['from']) || empty($msg['to']) || empty($msg['subject']) || empty($msg['body'])) return false;
	$headers = "From: " . $msg['from'] . "\n";
	if(count($msg['arrCc'])){
		foreach($msg['arrCc'] as $cc){
			$headers .= "Cc: " . $cc . "\n";
		}
	}
	if(count($msg['arrBcc'])){
		foreach($msg['arrBcc'] as $bcc){
			$headers .= "Bcc: " . $bcc . "\n";
		}
	}
	//mb_language('uni');
	//mb_internal_encoding('UTF-8');
	return mb_send_mail($msg['to'], $msg['subject'], $msg['body'], $headers);
}

// Send CCS-Messages.
function sendCcsMessage($pw, $usrEmail, $usrSubject, $usrBody, $typ, $admnInfo = ''){
	global $SALT;
	global $ADMN_HASHED_PW, $DVLP_HASHED_PW, $PRXY_HASHED_PW;
	global $FROM, $ADMN_EMAIL, $DVLP_EMAIL;
	global $ARR_CC, $ARR_BCC;
	global $HR_BEGIN, $HR_END;
	global $SYS_SIGN;
	// "$msg" is the message data consisting of the following array. It is for the users and the administrators. Of course, the contents vary depending on the destination.
	$msg = array('from' => $FROM, 'to' => '', 'arrCc' => array(), 'arrBcc' => array(), 'subject' => '', 'body' => '');
	// "$admnInfoToInsert" is an arranged text for the message (to anministrators) from $admnInfo.
	$admnInfoToInsert = empty($admnInfo)? "": ("\n\n\n\n" . preg_replace("/_EOL_\s*_HOL_/", "\n", $admnInfo));
	// "$doneBy" means the person who did the procedure.
	$doneBy = '';// This "empty" means the "user".
	if(password_verify($pw, $ADMN_HASHED_PW)){
		$doneBy = 'ADMN';
	}elseif(password_verify($pw, $PRXY_HASHED_PW)){
		$doneBy = 'PRXY';
	}elseif(password_verify($pw, $DVLP_HASHED_PW)){
		$doneBy = 'DVLP';
	}
	$result = array('bool' => false, 'report' => '');
	if(empty($doneBy)){// When done by the user (ordinary case):
		// Send a message to the user.
		$msg['to'] = $usrEmail;
		$msg['subject'] = $usrSubject;
		$msg['body'] = $usrBody;
		$usrRes = sendMessage($msg);
		// Send a message to administrators, etc.
		$msg['to'] = $ADMN_EMAIL;
		$msg['arrBcc'] = $ARR_BCC;
		$msg['subject'] .= " ## for ADMINs";
		$msg['body'] = "## Report for Administrators ##\n\n## 《利用者》により下記手続きが実行され、MESSAGEの内容が利用者に送信されました。\n\n\n\n{$HR_BEGIN}\n件名：{$usrSubject}\n\n本文：\n" . preg_replace('/\n*$/', '', $usrBody) . "\n{$HR_END}\n{$admnInfoToInsert}\n{$SYS_SIGN}";
		$admnRes = sendMessage($msg);
		// Prepare $result.
		$result['bool'] = $usrRes && $admnRes;
		$result['report'] = "Message to User: {$usrEmail}" . ($usrRes? 'Succeeded': 'Failed') . "\n";
		$result['report'] .= "Message to ADMINISTRATORs: {$admn}" . ($admnRes? 'Succeeded': 'Failed');
	}else{// Otherwise (in case done by staff)
		$msg['subject'] = "＊ ADMINs ONLY ＊ {$usrSubject}";
		switch($doneBy){
			case 'ADMN':
				$doerName = '管理者';
				$msg['to'] = $ADMN_EMAIL;
				$msg['arrBcc'] = $ARR_BCC;
				break;
			case 'PRXY':
				$doerName = '利用者代理';
				$msg['to'] = $ADMN_EMAIL;
				$msg['arrBcc'] = $ARR_BCC;
				break;
			case 'DVLP':
				$doerName = '開発者';
				$msg['to'] = $DVLP_EMAIL;
				break;
		}
		$msg['body'] = "＊ Report for Administrators ONLY ＊\n\n＊ 《{$doerName}》により下記手続きが実行され、MESSAGEの内容が管理者、利用者代理等のスタッフのみに送信されました。\n\n\n\n{$HR_BEGIN}\n件名：{$usrSubject}\n\n本文：\n" . preg_replace('/\n*$/', '', $usrBody) . "\n{$HR_END}\n{$admnInfoToInsert}\n{$SYS_SIGN}";
		$result['bool'] = sendMessage($msg);
		$result['report'] = "Message to {$doneBy}: {$msg['to']}". ($result['bool']? 'successfully sent.': 'Failed.');
	}
	return $result;
}

// Get all types
function getTypes($dbh){
	try{
		$sql = "SELECT * FROM types ORDER BY did ASC";
		$sth = $dbh->query($sql);
		$types = array(); $i = 0;
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$types[$i] = $row;
			$i++;
		}
		return $types;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}

// Get future（not-held）events.
function getFutureEvents($dbh){
	global $fmDtNow;
	try{
		// Assume that acc0 < acc1 < edate.
		$sql = "SELECT * FROM events WHERE acc0 <= '" . $fmDtNow . "' AND '" . $fmDtNow . "' < edate ORDER BY fyear DESC, edate ASC, apr1age DESC, nursery ASC";
		$sth = $dbh->query($sql);
		$events = array(); $i = 0;
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$events[$i] = $row;
			$i++;
		}
		return $events;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}

// Get reservations（of future events）.
function getFutureReservations($dbh){
	global $fmDtNow;
	try{
		// Assume that acc0 < acc1 < edate.
		// For privacy protection, we must not use "view_reservations_related" here.
		$sql = "SELECT * FROM view_reservations_events WHERE acc0 <= '" . $fmDtNow . "' AND '" . $fmDtNow . "' < edate ORDER BY rid ASC";
		$sth = $dbh->query($sql);
		$reservations = array(); $i = 0;
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$reservations[$i] = $row;
			$i++;
		}
		return $reservations;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}

// Get user by email.
function getRecordByEmail($dbh, $email){
	try{
		$sql = "SELECT * FROM users WHERE email = :email";
		$sth = $dbh->prepare($sql);
		$aval = array(':email' => $email);
		$sth->execute($aval);
		return $sth->fetch(PDO::FETCH_ASSOC);
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}

// Get record from users by uid.
function getRecordByUid($dbh, $uid){
	try{
		$sql = "SELECT * FROM users WHERE uid = :uid";
		$sth = $dbh->prepare($sql);
		$aval = array(':uid' => $uid);
		$sth->execute($aval);
		return $sth->fetch(PDO::FETCH_ASSOC);
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}

// Make random string
function makeRandomString($length) {
	$alphanumeric = array_merge(range('a', 'z'), range('0', '9'), range('A', 'Z'));
	$rndStr = '';
	for ($i = 0; $i < $length; $i++) {
		$rndStr .= $alphanumeric[rand(0, count($alphanumeric) - 1)];
	}
	return $rndStr;
}

// Register email (insert email into 'users').
// ------------------------------------ Replace the previous one with:
function registerEmail($dbh, $phase, $email){
	global $PREF_SUBJ, $basicUrl, $KG_SIGN, $qsToAdd;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array(), 'validUserRegd' => false);
	try{
		$initPw = makeRandomString(16);  // 列を埋めるためだけの未使用値
		if($row = getRecordByEmail($dbh, $email, '')){
			$uid = $row['uid'];
			if($row['valid']){
				$result['validUserRegd'] = true;
				$result['report'] = "A valid user with this email is already registered.";
				return $result;
			}
			$sql = "UPDATE users SET pw = :pw WHERE uid = :uid AND email = :email";
		}else{
			$uid = strtoupper(dechex(round(1000 * microtime(true))));
			if(preg_match('/^lambdasky@|@(coba.cc|seikyo.ed.jp)$/', $email)) $uid = "ABCDEF" . $uid;
			$sql = "INSERT INTO users (uid, email, pw) VALUES (:uid, :email, :pw)";
		}
		$sth = $dbh->prepare($sql);
		$aval = array(':uid' => $uid, ':email' => $email, ':pw' => hashPw($initPw));
		try{
			$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$dbh->beginTransaction();
			$sth->execute($aval);
			$dbh->commit();
		}catch(PDOException $e){
			$dbh->rollback();
			throw $e;
		}
		if($sth->rowCount()){
			$token = makeAuthToken($dbh, $uid, 'reg', 7 * 24 * 3600);  // 7日間
			$subject = $PREF_SUBJ . "メールアドレス登録通知";
			$body  = "子育て支援プログラム利用者登録へようこそ！\n\n";
			$body .= "メールアドレス（" . $email . "）が登録されました。\n\n\n";
			$body .= "まだ利用者登録は完了していません。次のURL（有効期限：7日間）から本登録を行ってください。\n\n\n";
			$body .= "更にそれに続いて子ども情報の追加を行ってください。\n\n\n";
			$body .= "［利用者登録］" . $basicUrl . "?phase=regUserForm&email=" . $email . "&uid=" . $uid . "&token=" . $token . $qsToAdd . "\n\n\n\n";
			$body .= $KG_SIGN;
			if($result['sndMsg'] = sendCcsMessage($pw, $email, $subject, $body, $typ)){
				$result['bool'] = true;
				$result['report'] = "Email address registered and notification sent.\n";
			}
		}
		return $result;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}
// ++++++++++++++++++++++++++++++++++++

// Register User（UPDATE users SET ・・・ WHERE uid = $uid）
// 新 PW を返す（すぐに getStateChildrenResvsByUid() を実行するため）
// ------------------------------------ Replace the previous one with:
function registerUser($dbh, $phase, $email, $uid, $pw, $newPw, $token, $ulname, $ufname, $ulname_k, $ufname_k, $hohequsr, $hlname, $hfname, $hlname_k, $hfname_k, $zipcode, $prefecture, $cityarea, $street, $building, $uphone, $hphone, $scharea, $schareaplus){
	global $extraAuth;
	global $SALT;
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array(), 'newPw' => '');
	try{
		// 現パスワード／一時パスワードをPHP側で照合（管理者 extraAuth は素通し）。
		// ---------------------------- Replace the previous one with:
		if(!$extraAuth){
			if($phase === 'regUser'){
				$tokUid = verifyAuthToken($dbh, $token, 'reg');
				if($tokUid === false){
					error_log('REGUSER tokfail len=' . strlen((string)$token) . ' head=' . substr((string)$token,0,10) . ' db=' . $DB_NAME);
					$result['report'] = 'Invalid or expired token.';
					return $result;
				}				
				$uid = $tokUid;   // トークンに紐づく uid を正とする（FE値を信用しない）
			}else{ // modUser：現パスワードで照合
				$chk = $dbh->prepare("SELECT pw FROM users WHERE uid = :uid");
				$chk->execute(array(':uid' => $uid));
				$crow = $chk->fetch(PDO::FETCH_ASSOC);
				if(!$crow || !verifyPw($pw, $crow['pw'])){
					$result['report'] = 'Authentication failed.';
					return $result;
				}
			}
		}
		// ++++++++++++++++++++++++++++

		// Additional parts for SQL.
		// When phase === 'regUser':
		$addSet = $phase === 'regUser'? 'pw = :newPw, ': '';
		// When extraAuth === true:

		// set valid = 1
		$sql = "UPDATE users SET valid = 1, " . $addSet . "ulname = :ulname, ufname = :ufname, ulname_k = :ulname_k, ufname_k = :ufname_k, hohequsr = :hohequsr, hlname = :hlname, hfname = :hfname, hlname_k = :hlname_k, hfname_k = :hfname_k, zipcode = :zipcode, prefecture = :prefecture, cityarea = :cityarea, street = :street, building = :building, uphone = :uphone, hphone = :hphone, scharea = :scharea, schareaplus = :schareaplus WHERE uid = :uid";
		
		$sth = $dbh->prepare($sql);

		$aval = array(':uid' => $uid, ':ulname' => $ulname, ':ufname' => $ufname, ':ulname_k' => $ulname_k, ':ufname_k' => $ufname_k, ':hohequsr' => $hohequsr, ':hlname' => $hlname, ':hfname' => $hfname, ':hlname_k' => $hlname_k, ':hfname_k' => $hfname_k, ':zipcode' => $zipcode, ':prefecture' => $prefecture, ':cityarea' => $cityarea, ':street' => $street, ':building' => $building, ':uphone' => $uphone, ':hphone' => $hphone, ':scharea' => $scharea, ':schareaplus' => $schareaplus);

		// ---------------------------- Add the following:
		// ★ PII暗号化（氏名・住所・電話のみ。hohequsr/scharea/schareaplus は対象外）
		foreach(array(':ulname',':ufname',':ulname_k',':ufname_k',':hlname',':hfname',':hlname_k',':hfname_k',':zipcode',':prefecture',':cityarea',':street',':building',':uphone',':hphone') as $k){
			$aval[$k] = encryptPii($aval[$k]);
		}
		// ++++++++++++++++++++++++++++

		if($phase === 'regUser') $aval = array_merge($aval, array(':newPw' => hashPw($newPw)));

		try{
			$sth->execute($aval);
			if($sth->rowCount()){
				// -------------------- Add the following:
				if($phase === 'regUser') consumeAuthToken($dbh, $token);
				// ++++++++++++++++++++

				// メール送信
				$subject = $PREF_SUBJ . (($phase === 'regUser')? "利用者登録完了通知": "利用者情報変更通知");
				$body = $ulname . $ufname . " さま\n\n";
				$body .= ($phase === 'regUser')? "ご登録ありがとうございます。\n\n": "利用者情報が変更されました。\n\n";
				$body .= "================\n";
				$body .= "氏名：" . $ulname . " " . $ufname . "\n";
				$body .= "住所：" . $zipcode . " " . $prefecture . $cityarea . $street . " " . $building . "\n";
				$body .= "電話（利用者）：" . $uphone . "\n";
				$body .= "電話（世帯主）：" . $hphone . "\n";
				$body .= "校区：" . (($scharea === 'その他')? $schareaplus: $scharea) . "\n";
				$body .= "================\n";
				$body .= ($phase === 'regUser')? "\n\n下記URLからログインしてください。未だお子さまを登録されていない場合は［子ども情報の追加］ボタンから必ずお１人はご登録ください。各種予約はお子さまのお名前でお取りいただく形になっています。": "";
				$body .= $LOGIN_GUIDE . $KG_SIGN;
				$result['sndMsg'] = sendCcsMessage($pw, $email, $subject, $body, $typ);
				if($resSndCcsMsg['result']){
					if($phase === 'regUser'){
						return $newPw;
					}else{
						$result['bool'] = true;
						$result['report'] = "利用者情報を変更し、通知を送信しました！\n" . $resSndCcsMsg['report'];
					}
				}
				if($result['sndMsg'] = sendCcsMessage($pw, $email, $subject, $body, $typ)){
					$result['bool'] = true;
					$result['report'] = "User information ". ($phase === 'regUser'? 'registered': 'changed') . "and notification sent.\n";
					if($phase === 'regUser'){
						$result['newPw'] = $newPw;
					}
				}
			}
		}catch(PDOException $e){
			$dbh->rollback();
			throw $e;
		}
		return $result;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}
// ++++++++++++++++++++++++++++++++++++

// テスト送信
// test whether the (new)email address recieves a message from @seikyogakuen.org.
function testNewEmail($dbh, $email, $uid, $pw, $newEmail){
	global $FROM;
	global $ARR_CC;
	global $ARR_BCC;
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	// ユーザ情報取得
	$usrinf = getUsrinf($dbh, $email, $uid, $pw);
	if($usrinf['loggedIn']){
		// メール送信
		$subject = $PREF_SUBJ . "テスト送信";
		$body = $usrinf['user']['ulname'] . " " . $usrinf['user']['ufname'] . " 様\n\n";
		$body .= "KG-CCS から　" . $newEmail . "　へのテスト送信です。\n\nこれで受信は確認できました。\n\nこのメールアドレスに変更する場合は、ブラウザで［変更］を実行してください！\n\n";
		$body .= $KG_SIGN;
		if($result['sndMsg'] = sendCcsMessage($pw, $newEmail, $subject, $body, $typ)){
			$result['bool'] = true;
			$result['report'] = "Test message sent to {$newEmail}.\n";
		}
	}
	return $result;
}

// メールアドレス変更
function changeEmail($dbh, $phase, $email, $uid, $pw, $newEmail, $ulname, $ufname){
	global $PREF_SUBJ;
	global $basicUrl;//not $LOGIN_GUIDE
	global $KG_SIGN;
	global $SALT;
	global $qsToAdd;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	try{
		$LOGIN_GUIDE = "\n\n\nログインはこちらから！\n" . $basicUrl . "?phase=start&email=" . $newEmail . "&uid=" . $uid;
		// Email変更と同時に set valid = 1 も行う
		$sql = "UPDATE users SET valid = 1, email = :newEmail WHERE " . (empty($uid)? "email = :email": "uid = :uid");
		$aval = array_merge(empty($uid)? array(':email' => $email): array(':uid' => $uid), array(':newEmail' => $newEmail));
		$sth = $dbh->prepare($sql);
		try{
			$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$dbh->beginTransaction();
			$sth->execute($aval);
			$dbh->commit();
		}catch(PDOException $e){
			$dbh->rollback();
			throw $e;
		}
		if($sth->rowCount()){
			// メール送信
			$result['bool'] = true;
			$body = $ulname . " " . $ufname . " さま\n\n";
			$subject = $PREF_SUBJ . "メールアドレス変更通知";
			$body .= $result['report'] = "メールアドレスが　" . $newEmail . "　に変更されました。";
			$body .= $LOGIN_GUIDE . $KG_SIGN;
			$result['report'] = "Email address changed";
			if($res0 = sendCcsMessage($pw, $email, $subject, $body, $typ)){
				$result['report'] .= "and notification sent to original address.\n";
			}
			if($res1 = sendCcsMessage($pw, $newEmail, $subject, $body, $typ)){
				$result['report'] .= "Notification sent to new address as well.\n";
			}
			$result['sndMsg'] = array('bool' => ($res0['bool'] && $res1['bool']), 'report' => ($res0['report'] . "\n" . $res1['report']));
		}else{
			$result['report'] = "Email address not changed.\n";
		}
		return $result;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}

// パスワード変更
// ------------------------------------ Replace the previous one with:
function changePw($dbh, $phase, $email, $uid, $pw, $newPw, $token, $ulname, $ufname){
	global $PREF_SUBJ, $LOGIN_GUIDE, $KG_SIGN;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	try{
		// 認証と対象 uid の確定
		if($phase === 'resetPw'){
			$targetUid = verifyAuthToken($dbh, $token, 'reset');
			if($targetUid === false){
				$result['report'] = "Invalid or expired token.";
				return $result;
			}
		}else{ // chgPw
			$crow = empty($uid)? getRecordByEmail($dbh, $email): getRecordByUid($dbh, $uid);
			if(!$crow || !verifyPw($pw, $crow['pw'])){
				$result['report'] = "Current password verification failed.";
				return $result;
			}
			$targetUid = $crow['uid'];
		}
		$urow = getRecordByUid($dbh, $targetUid);  // 通知用
		$sql = "UPDATE users SET valid = 1, pw = :newPw WHERE uid = :uid";
		$sth = $dbh->prepare($sql);
		$aval = array(':uid' => $targetUid, ':newPw' => hashPw($newPw));
		try{
			$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$dbh->beginTransaction();
			$sth->execute($aval);
			$dbh->commit();
		}catch(PDOException $e){
			$dbh->rollback();
			throw $e;
		}
		$action = $phase === 'chgPw'? '変更': 'リセット';
		if($sth->rowCount()){
			if($phase === 'resetPw') consumeAuthToken($dbh, $token);
			$subject = $PREF_SUBJ . "パスワード" . $action . "通知";
			$body  = $urow['ulname'] . " " . $urow['ufname'] . " さま\n\n";
			$body .= "パスワードが" . $action . "されました。";
			$body .= $LOGIN_GUIDE . $KG_SIGN;
			if($result['sndMsg'] = sendCcsMessage($pw, $urow['email'], $subject, $body, $typ)){
				$result['bool'] = true;
				$result['report'] = "Password " . ($phase === 'chgPw'? 'changed': 'reset') . ".\n";
			}
		}else{
			$result['report'] = "Password not changed.";
		}
		return $result;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}
// ++++++++++++++++++++++++++++++++++++

// パスワードリセット用URL送信（パスワード忘れの場合）
// ------------------------------------ Replace the previous one with:
function sendPwResetUrl($dbh, $phase, $email, $uid){
	global $PREF_SUBJ, $KG_SIGN, $basicUrl;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	try{
		if($row = empty($uid)? getRecordByEmail($dbh, $email): getRecordByUid($dbh, $uid)){
			if($row['valid']){
				$_email = $email? $email: $row['email'];
				$_uid   = $uid? $uid: $row['uid'];
				$token = makeAuthToken($dbh, $_uid, 'reset', 3600);  // 1時間
				$subject = $PREF_SUBJ . "パスワードリセット用URL通知";
				$body  = "次のURLにアクセスしてパスワードを設定してください（有効期限：1時間）。\n\n\n";
				$body .= $basicUrl . "?phase=resetPwForm&email=" . $_email . "&uid=" . $_uid . "&token=" . $token . "\n\n\n\n";
				$body .= "★もしこのメールの内容にお心当たりがない場合は、無視してください。\n";
				$body .= $KG_SIGN;
				if($result['sndMsg'] = sendCcsMessage($pw, $_email, $subject, $body, $typ)){
					$result['bool'] = true;
					$result['report'] = "A password reset token was issued and notification was sent.\n";
				}
			}else{
				$result['report'] = "Email registered, but user registration not completed.\n";
			}
		}else{
			$result['report'] = "No user registration with this email.\n";
		}
		return $result;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}
// ++++++++++++++++++++++++++++++++++++

// readline_redisplay "pastpt" data for message bodys of addChild(), modifyChild() or addReservation().
// "pastpt" means "past participation"
function dispPastPt($pastpt){
	$progName = array('ft' => '初めて', 'wk' => 'わくわくキッズ', 'bc' => 'ベビーＣＬＵＢ', 'er' => '絵本ルーム', 'op' => '室内・園庭開放', 'be' => 'ベビーＣＬＵＢイベント', 'ce' => '保育体験', 'BA' => 'BA企画', 'WV' => 'WV企画');
	$buf = '';
	$arrPastpt = explode(',', $pastpt);
	for($i = 0, $len = count($arrPastpt); $i < $len; $i++){
		$buf .= $progName[$arrPastpt[$i]] . '，';
	}
	return rtrim($buf, '，');
}

// Read data (dataUrl) from a file.
// If the file does not exist, an empty string is returned.
function readFromFile($filePath){
	if(is_file($filePath)){
		return file_get_contents($filePath);
	}else{
		return '';
	}
}

// Write data (dataUrl) into a file.
function writeDataUrlIntoFile($dir, $fname, $data){
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	if(is_dir($dir)){
		if($fp = fopen($dir .'/' . $fname, 'w')){
			if($result['bool'] = fwrite($fp, $data)){
				$result['report'] = "DataUrl has been written into a file.\n";
			}
			fclose($fp);
		}
	}
	return $result;
}

// Add Child
function addChild($dbh, $email, $uid, $pw, $clname, $cfname, $clname_k, $cfname_k, $cbirth, $csex, $pastpt, $ulname, $ufname){
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	$jaSex = array('m' => '男', 'f' => '女');
	global $SALT;
	global $DATA_URL_DIR;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array(), 'imgRes' => false);
	if(authenticateUser($dbh, $uid, $pw)){
		try{
			$sql = "INSERT INTO children (uid, clname, cfname, clname_k, cfname_k, cbirth, csex, pastpt) VALUES (:uid, :clname, :cfname, :clname_k, :cfname_k, :cbirth, :csex, :pastpt)";
			$sth = $dbh->prepare($sql);

			$aval = array(':uid' => $uid, ':clname' => $clname, ':cfname' => $cfname, ':clname_k' => $clname_k, ':cfname_k' => $cfname_k, ':cbirth' => $cbirth, ':csex' => $csex, ':pastpt' => $pastpt);

			// ------------------------ Add the following:
			// ★ PII暗号化（子ども氏名のみ。cbirth/csex/pastpt は対象外）
			foreach(array(':clname',':cfname',':clname_k',':cfname_k') as $k){
				$aval[$k] = encryptPii($aval[$k]);
			}
			// ++++++++++++++++++++++++

			try{
				$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
				$dbh->beginTransaction();
				$sth->execute($aval);
				$cid = $dbh->lastInsertId();// lastInsertId() must be obtained before commit(). If it is later, it will be 0(zero).
				$dbh->commit();
				if($sth->rowCount()){
					// メール送信
					$subject = $PREF_SUBJ . "子ども情報追加通知";
					$body = $ulname . $ufname . " さま\n\n";
					$body .= "お子さまの情報を追加しました。\n\n";
					$body .= "================\n";
					$body .= "お名前：" . $clname . " " . $cfname . "（" . $clname_k . " " . $cfname_k . "）\n";
					$body .= "生年月日（性）：" . $cbirth . "（" . $jaSex[$csex] . "）\n";
					$body .= "参加経験：" . dispPastPt($pastpt) . "\n";
					$body .= "================\n";
					$body .= $LOGIN_GUIDE . $KG_SIGN;
					if($result['sndMsg'] = sendCcsMessage($pw, $email, $subject, $body, $typ)){
						$result['bool'] = true;
						$result['report'] = "New child information added and notification sent.\n";
					}
				}
			}catch(PDOException $e){
				$dbh->rollback();
				throw $e;
			}
		}catch(PDOException $e){
			echo "Error: " . $e->getMessage();
			exit;
		}
	}
	return $result;
}

// Modify Child
function modifyChild($dbh, $email, $uid, $pw, $cid, $clname, $cfname, $clname_k, $cfname_k, $cbirth, $csex, $pastpt, $ulname, $ufname){
	global $PREF_SUBJ;
	global $KG_SIGN;
	$jaSex = array('m' => '男', 'f' => '女');
	global $SALT;
	global $DATA_URL_DIR;
	$result = array('bool' => false, 'report' => '', 'imgRes' => false);
	if(authenticateUser($dbh, $uid, $pw)){
		try{
			$sql = "UPDATE children SET clname = :clname, cfname = :cfname, clname_k = :clname_k, cfname_k = :cfname_k, cbirth = :cbirth, csex = :csex, pastpt = :pastpt WHERE cid = :cid AND uid = :uid";
			$sth = $dbh->prepare($sql);
			$aval = array(':cid' => $cid, ':uid' => $uid, ':clname' => $clname, ':cfname' => $cfname, ':clname_k' => $clname_k, ':cfname_k' => $cfname_k, ':cbirth' => $cbirth, ':csex' => $csex, ':pastpt' => $pastpt);

			// ------------------------ Add the following:
			// ★ PII暗号化（子ども氏名のみ）
			foreach(array(':clname',':cfname',':clname_k',':cfname_k') as $k){
				$aval[$k] = encryptPii($aval[$k]);
			}
			// ++++++++++++++++++++++++

			try{
				$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
				$dbh->beginTransaction();
				$sth->execute($aval);
				$dbh->commit();
			}catch(PDOException $e){
				$dbh->rollback();
				throw $e;
			}
			if($sth->rowCount()){
				// メール送信
				$subject = $PREF_SUBJ . "子ども情報変更通知";
				$body = $ulname . $ufname . " さま\n\n";
				$body .= "お子さまの情報を変更しました。\n\n";
				$body .= "================\n";
				$body .= "お名前：" . $clname . " " . $cfname . "（" . $clname_k . " " . $cfname_k . "）\n";
				$body .= "生年月日（性）：" . $cbirth . "（" . $jaSex[$csex] . "）\n";
				$body .= "参加経験：" . dispPastPt($pastpt) . "\n";
				$body .= "================\n";
				$body .= $LOGIN_GUIDE . $KG_SIGN;
				if($result['sndMsg'] = sendCcsMessage($pw, $email, $subject, $body, $typ)){
					$result['bool'] = true;
					$result['report'] = "Child information changed and notification sent.\n";
				}
			}
		}catch(PDOException $e){
			echo "Error: " . $e->getMessage();
			exit;
		}
		return $result;
	}
}

// Delete a dataUrl(Portrait) file.
function deleteDataUrlFile($dbh, $uid, $pw, $cid){
	global $DATA_URL_DIR;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	if(authenticateUser($dbh, $uid, $pw)){
		try{
			$result['bool'] = unlink($DATA_URL_DIR .'/' . $uid . '_' . $cid);
			$result['report'] = "DataUrl file has been deleted.\n";
		}catch(PDOException $e){
			$dbh->rollback();
			throw $e;
		}
	}
	return $result;
}

// Delete Child
function deleteChild($dbh, $email, $uid, $pw, $cid, $ulname, $ufname, $clname, $cfname){
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	global $SALT;
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	if(authenticateUser($dbh, $uid, $pw)){
		try{
			$sql = "UPDATE children SET valid = 0 WHERE cid = :cid AND uid = :uid";
			$sth = $dbh->prepare($sql);
			$aval = array(':cid' => $cid, ':uid' => $uid);
			try{
				$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
				$dbh->beginTransaction();
				$sth->execute($aval);
				$dbh->commit();
				if($sth->rowCount()){
					// Sending messages.
					$subject = $PREF_SUBJ . "子ども情報削除通知";
					$body = "{$ulname}{$ufname} さま\n\n";
					$body .= "{$clname}{$cfname} さまの 子ども情報 を削除しました。\n";
					$body .= $LOGIN_GUIDE . $KG_SIGN;
					if($result['sndMsg'] = sendCcsMessage($pw, $email, $subject, $body, $typ)){
						$result['bool'] = true;
						$result['report'] = "Child information deleted and notification sent.\n";
					}
				}
			}catch(PDOException $e){
				$dbh->rollback();
				throw $e;
			}
		}catch(PDOException $e){
			echo "Error: " . $e->getMessage();
			exit;
		}
	}
	return $result;
}

// Get User information with $email and $pw from users.
// ------------------------------------ Replace the previous one with:
function getUsrinf($dbh, $email, $uid, $pw){
	global $extraAuth;
	// -------------------------------- Add the following:
	global $PII_FIELDS_USER;
	// ++++++++++++++++++++++++++++++++
	$result = array('emailExists' => false, 'userExists' => false, 'loggedIn' => false, 'user' => array());
	try{
		$sql = "SELECT * FROM users WHERE " . (empty($uid)? "email = :email": "uid = :uid");
		$sth = $dbh->prepare($sql);
		$aval = empty($uid)? array(':email' => $email): array(':uid' => $uid);
		$sth->execute($aval);
		if($row = $sth->fetch(PDO::FETCH_ASSOC)){
			// ------------------------ Add the following:
			// ★ PII復号（氏名・住所・電話）
			$row = decryptPiiFields($row, $PII_FIELDS_USER);
			// ++++++++++++++++++++++++
			$result['emailExists'] = true;
			if($row['valid'] && $row['ulname']){
				$result['userExists'] = true;
				if($extraAuth || verifyPw($pw, $row['pw'])){
					$result['loggedIn'] = true;
					if(!$extraAuth && pwNeedsRehash($row['pw'])) upgradePwHash($dbh, $row['uid'], $pw);
					unset($row['pw']);          // ★ ハッシュをFEに渡さない
					/*
					$row['fam_members'] = $row['fam_members']? json_decode($row['fam_members'], true): null;
					$row['fam_rel'] = $row['fam_rel']? json_decode($row['fam_rel'], true): null;
					$result['user'] = $row;
					*/
					// ---------------- Replace the previous one with:
					// ★ JSON列は「復号 → json_decode」の順
					$row['fam_members'] = $row['fam_members']? json_decode(decryptPii($row['fam_members']), true): null;
					$row['fam_rel'] = $row['fam_rel']? json_decode(decryptPii($row['fam_rel']), true): null;
					$result['user'] = $row;
					// ++++++++++++++++
				}
			}
		}
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
	return $result;
}
// ++++++++++++++++++++++++++++++++++++

// Get children info by user.
function getChildrenByUid($dbh, $uid){
	global $DATA_URL_DIR;
	// -------------------------------- Add the following:
	global $PII_FIELDS_CHILD;
	// ++++++++++++++++++++++++++++++++
	try{
		$sql = "SELECT * FROM children WHERE uid = :uid AND (valid = 1 OR entdate IS NOT NULL) ORDER BY cbirth DESC";
		$sth = $dbh->prepare($sql);
		$aval = array(':uid' => $uid);
		$sth->execute($aval);
		$childrenExt = array(); $i = 0;
		// ---------------------------- Replace the previous one with:
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$row = decryptPiiFields($row, $PII_FIELDS_CHILD);   // ★ 子ども氏名を復号
			$row['dataUrl'] = readFromFile($DATA_URL_DIR . '/' . $uid . '_' . $row['cid']);
			$childrenExt[$i] = $row;
			$i++;
		}
		// ++++++++++++++++++++++++++++
		return $childrenExt;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}

// ↓　＊＊＊　parseEvtsResvs() (in main.js) 導入によって不要となるか・・・？
// Get reservations by user(uid)
function getReservationsByUid($dbh, $uid, $pw){
	global $SALT;
	global $ADMN_HASHED_PW;
	global $fmDtNow;
	try{
		if(password_verify($pw, $ADMN_HASHED_PW)){
			$sql = "SELECT * FROM view_reservations_related WHERE uid = :uid ORDER BY eid ASC";
		}else{
			$sql = "SELECT * FROM view_reservations_related WHERE uid = :uid AND '" . $fmDtNow . "' <= edate ORDER BY eid ASC";
		}
		//$sth = $dbh->query($sql);
		$sth = $dbh->prepare($sql);
		$aval = array(':uid' => $uid);
		$sth->execute($aval);
		$reservations = array(); $i = 0;
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$reservations[$i] = $row;
			$i++;
		}
		return $reservations;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}

// Get User-info, Children and Reservations by uid(user).
function getUsrinfChildrenResvsByUid($dbh, $email, $uid, $pw){
	$result = array('bool' => false, 'report' => '', 'usrinf' => array(), 'childrenExt' => array(), 'rsvs' => array());
	$result['usrinf'] = getUsrinf($dbh, $email, $uid, $pw);
	$_uid = empty($uid)? $result['usrinf']['user']['uid']: $uid;
	if($result['usrinf']['loggedIn']){
		$result['bool'] = true;
		$result['childrenExt'] = getChildrenByUid($dbh, $_uid);
		$result['rsvs'] = getReservationsByUid($dbh, $_uid, $pw);
	}
	return $result;
}

// Add reservation
function addReservation($dbh, $email, $uid, $pw, $eid, $typ, $cid, $posblKey, $pastpt, $comment, $entdate, $graddate, $commute, $concurrency, $eng_course, $utNow, $admnInfo){
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	// -------------------------------- Add the following:
	global $PII_FIELDS_USER, $PII_FIELDS_CHILD;
	// ++++++++++++++++++++++++++++++++
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	try{
		//update "pastpt" of "children" table.
		$sql = "UPDATE children SET pastpt = :pastpt" . ($typ === 'aa'? ', entdate = :entdate, graddate = :graddate, commute = :commute, concurrency = :concurrency, eng_course = :eng_course': '') . " WHERE cid = :cid";
		$sth = $dbh->prepare($sql);
		$aval = array_merge(array(':cid' => $cid, ':pastpt' => $pastpt), $typ === 'aa'? array(':entdate' => $entdate, ':graddate' => $graddate, ':commute' => $commute, ':concurrency' => $concurrency, ':eng_course' => $eng_course): array());
		try{
			$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$dbh->beginTransaction();
			$sth->execute($aval);
			$dbh->commit();
			//add the reservation.
			$sql = "INSERT INTO reservations (cid, uid, eid, comment) VALUES (:cid, :uid, :eid, :comment)";
			$sth = $dbh->prepare($sql);
			$aval = array(':cid' => $cid, ':uid' => $uid, ':eid' => $eid, ':comment' => $comment);
			try{
				$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
				$dbh->beginTransaction();
				$sth->execute($aval);
				$rid = $dbh->lastInsertId();//lastInsertId()はcommit()前に取るべし（後だと0になる）！
				$dbh->commit();
				if($rid){
					$sql = "SELECT * FROM view_reservations_related WHERE rid = :rid";
					$sth = $dbh->prepare($sql);
					$aval = array(':rid' => $rid);
					$sth->execute($aval);
					$row = $sth->fetch(PDO::FETCH_ASSOC);
					// ---------------- Add the following:
					$row = decryptPiiFields($row, $PII_FIELDS_USER);
					$row = decryptPiiFields($row, $PII_FIELDS_CHILD);
					// ++++++++++++++++
					// メール送信
					$object = $posblKey === 'avbl'? '予約': 'キャンセル待ち登録';
					$subject = "{$PREF_SUBJ}{$object}受付通知（" . dspTypName($typ) . "）";
					$body = $row['ulname'] . $row['ufname'] . " さま\n\n";
					$body .= "以下のとおり" . $object . "を受け付けました。\n\n";
					$body .= "================\n";
					$body .= $row['clname'] . $row['cfname'] . " さま\n";
					$body .= $row['etitle'] . "\n\n";
					if($typ !== 'aa') $body .= "参加経験：" . dispPastPt($pastpt) . "\n";
					if($typ === 'aa'){
						$body .= "入園希望日：" . $entdate . "\n";
						$commutingMethod = array('bus' => 'バスコース', 'foot' => '徒歩コース', 'parent' => '通園コースは利用しない');
						$body .= "通園コース希望：" . $commutingMethod[$commute] . "\n";
						if($concurrency){
							$body .= ($concurrency === 'hei'? "2,3号と併願": "1号専願")."\n";
						}
						if($eng_course){
							$body .= "ENGLISH Course：希望\n";
						}
					}
					if(!empty($row['comment'])){
						$body .= ($typ === 'aa'? 'ご連絡等：': ($typ !== 'pr'? 'コメント・質問など：': '')) . "\n{$row['comment']}\n";
					}
					$body .= "================\n\n";
					// October 1, after it has been determined whether or not a lottery will be held,
					$curFy = date('Y') + (date('m') < 4? -1: 0);
					$utOct1st9 = strtotime($curFy . '-10-01 09:00:00');
					if($typ === 'aa' && $utOct1st9 < (int)$utNow){
						$body .= "後日担当者から連絡させていただきます。\n\n";
					}
					$body .= "\n下記 URL からログインしてご確認・ご修正いただくことが可能です。";
					$body .= $LOGIN_GUIDE . $KG_SIGN;
					if($result['sndMsg'] = sendCcsMessage($pw, $email, $subject, $body, $typ, $admnInfo)){
						$result['bool'] = true;
						$result['report'] = "A " .((int)$wtngLen? 'Wating list': 'reservation') . " added and notification sent.\n";
					}
				}
			}catch(PDOException $e){
				$dbh->rollback();
				throw $e;
			}
		}catch(PDOException $e){
			$dbh->rollback();
			throw $e;
		}
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
	return $result;
}

// Delte reservation
function deleteReservation($dbh, $email, $uid, $pw, $cid, $rid, $eid, $typ, $wtngLen){
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	// -------------------------------- Add the following:
	global $PII_FIELDS_USER, $PII_FIELDS_CHILD;
	// ++++++++++++++++++++++++++++++++
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	try{
		// 予約削除前に予約情報の取得（メール報告のため）
		$sql = "SELECT * FROM view_reservations_related WHERE rid = :rid";
		$sth = $dbh->prepare($sql);
		$aval = array(':rid' => $rid);
		$sth->execute($aval);
		$row = $sth->fetch(PDO::FETCH_ASSOC);
		// ---------------- Add the following:
		$row = decryptPiiFields($row, $PII_FIELDS_USER);
		$row = decryptPiiFields($row, $PII_FIELDS_CHILD);
		// ++++++++++++++++
		// $typ === 'aa' の場合には、children テーブルの entdate, graddate を初期化
		if($typ === 'aa'){
			$sql = "UPDATE children SET entdate = NULL, graddate = NULL, eng_course = NULL WHERE cid = :cid";
			$sth = $dbh->prepare($sql);
			$aval = array(':cid' => $cid);
			try{
				$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
				$dbh->beginTransaction();
				$sth->execute($aval);
				$dbh->commit();
			}catch(PDOException $e){
				$dbh->rollback();
				throw $e;
			}
		}
		// 予約の削除
		$sql = "DELETE FROM reservations WHERE rid = :rid";
		$sth = $dbh->prepare($sql);
		$aval = array(':rid' => $rid);
		try{
			$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$dbh->beginTransaction();
			$sth->execute($aval);
			$dbh->commit();
		}catch(PDOException $e){
			$dbh->rollback();
			throw $e;
		}
		if($sth->rowCount()){
			// メール送信
			$object = (int)$wtngLen? 'キャンセル待ち登録': '予約';
			$subject = "{$PREF_SUBJ}{$object}削除通知（" . dspTypName($typ) . "）";
			$body = $row['ulname'] . $row['ufname'] . " さま\n\n";
			$body .= $object . "を削除しました。\n\n\n削除した" . $object . "\n";
			$body .= "================\n";
			$body .= $row['clname'] . $row['cfname'] . " さま\n";
			$body .= $row['etitle'] . "\n";
			$body .= "================\n";
			$body .= $LOGIN_GUIDE . $KG_SIGN;
			if($result['sndMsg'] = sendCcsMessage($pw, $email, $subject, $body, $typ)){
				$result['bool'] = true;
				$result['report'] = "The " .((int)$wtngLen? 'Wating list': 'reservation') . " deleted and notification sent.\n";
			}
		}
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
	return $result;
}

// Informing of waiting state especially the advancement from "waiting" to "reserved".
function infoWtngState($dbh, $eid, $advUid, $advRid){
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	global $basicUrl;
	global $qsTyps;
	global $DVLP_EMAIL;
	// -------------------------------- Add the following:
	global $PII_FIELDS_USER, $PII_FIELDS_CHILD;
	// ++++++++++++++++++++++++++++++++
	// Note that it is impossible for $advUid and $advRid to be non-empty at the smae time.
	// The process varies depending on whether $advUid or $advRid is non-empty.
	$result = array('bool' => false, 'report' => '', 'sndMsg' => array());
	if($advUid){
		try{
			$sql = "SELECT * FROM view_reservations_related WHERE eid = :eid AND uid = :uid";
			$sth = $dbh->prepare($sql);
			$aval = array(':eid' => $eid, ':uid' => $advUid);
			$sth->execute($aval);
			// There may be multiple rows matching the extraction criteria.
			$rows = array(); $i = 0;
			$chnResvs = '';
			while($row = $sth->fetch(PDO::FETCH_ASSOC)){
				// ---------------- Add the following:
				$row = decryptPiiFields($row, $PII_FIELDS_USER);
				$row = decryptPiiFields($row, $PII_FIELDS_CHILD);
				// ++++++++++++++++
				$rows[$i] = $row;
				$i++;
				$chnResvs .= "================\n";
				$chnResvs .= $row['clname'] . $row['cfname'] . " さま\n";
				$chnResvs .= $row['etitle'] . "\n";
				$chnResvs .= "================\n\n\n";
				$chnResvs .= "予約状況のご確認は次の URL から！\n" . $basicUrl . "?phase=start" . $qsTyps . "&email=" . $row['email'] . "&uid=" . $advUid . "\n\n\n";
			}
			if(count($rows)){
				$subject = "{$PREF_SUBJ}◆繰り上がり予約通知◆";
				$body = $rows[0]['ulname'] . $rows[0]['ufname'] . " さま\n\n";
				$body .= "下記内容の「キャンセル待ち登録」が「予約」に繰り上がりました。\n\n";
				$body .= $chnResvs;
				$body .= $KG_SIGN;
			}
		}catch(PDOException $e){
			echo "Error: " . $e->getMessage();
			exit;
		}
	}elseif($advRid){
		try{
			$sql = "SELECT * FROM view_reservations_related WHERE rid = :rid";
			$sth = $dbh->prepare($sql);
			$aval = array(':rid' => $advRid);
			$sth->execute($aval);
			if(($row = $sth->fetch(PDO::FETCH_ASSOC)) && $row['eid'] === $eid){
				// ---------------- Add the following:
				$row = decryptPiiFields($row, $PII_FIELDS_USER);
				$row = decryptPiiFields($row, $PII_FIELDS_CHILD);
				// ++++++++++++++++
				$subject = "{$PREF_SUBJ}◆繰り上がり予約通知◆";
				$body = $row['ulname'] . $row['ufname'] . " さま\n\n";
				$body .= "次の項目が「キャンセル待ち登録」から「予約」に繰り上がりました。\n\n\n";
				$body .= "================\n";
				$body .= $row['clname'] . $row['cfname'] . " さま\n";
				$body .= $row['etitle'] . "\n";
				$body .= "================\n\n\n";
				$body .= "予約状況のご確認は次の URL から！\n" . $basicUrl . "?phase=start" . $qsTyps . "&email=" . $row['email'] . "&uid=" . $row['uid'] . "\n\n\n";
				$body .= $KG_SIGN;
			}
		}catch(PDOException $e){
			echo "Error: " . $e->getMessage();
			exit;
		}
	}
	return $result;
}

// Update columns for family state (i.e. `fam_members` and `fam_rel`) in the `users` table.
function updateFamState($dbh, $uid, $fam_members, $fam_rel){
	global $extraAuth;
	global $SALT;
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	$result = array('bool' => false, 'report' => '');
	try{
		$sql = "UPDATE users SET fam_members = :fam_members, fam_rel = :fam_rel WHERE uid = :uid";
		$sth = $dbh->prepare($sql);

		// ---------------------------- Replace the previous one with:
		// JSON文字列化 → 暗号化、の順。復号側は decryptPii → json_decode の逆順。
		$encFamMembers = encryptPii(json_encode($fam_members, JSON_UNESCAPED_UNICODE));
		$encFamRel     = encryptPii(json_encode($fam_rel, JSON_UNESCAPED_UNICODE));
		$aval = array(':uid' => $uid, ':fam_members' => $encFamMembers, ':fam_rel' => $encFamRel);
		// ++++++++++++++++++++++++++++

		try{
			$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$dbh->beginTransaction();
			$sth->execute($aval);
			$dbh->commit();
		}catch(PDOException $e){
			$dbh->rollback();
			throw $e;
		}
		if($sth->rowCount()){
			$result['bool'] = true;
			$result['report'] = "Family state (fam_members, fam_rel) has been updated.";
		}
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
	return $result;
}

// Update Portrait.
/*
function updatePortrait($dbh, $email, $uid, $pw, $cid, $newDataUrl){
	global $extraAuth;
	global $SALT;
	global $PREF_SUBJ;
	global $LOGIN_GUIDE;
	global $KG_SIGN;
	global $DATA_URL_DIR;
	$result = array('bool' => false, 'report' => '');
	if(authenticateUser($dbh, $uid, $pw)){
		try{
			if($newDataUrl !== ""){
				$result['bool'] = writeDataUrlIntoFile($DATA_URL_DIR, $uid . '_' . $cid, $newDataUrl);
				$result['report'] = "Portrait (dataUrl) is updated!";
			}
		}catch(PDOException $e){
			echo "Error: " . $e->getMessage();
			exit;
		}
	}
	return $result;
}
*/
// ------------------------------------ Replace the previous one with:
function updatePortrait($dbh, $email, $uid, $pw, $cid, $newDataUrl){
	global $extraAuth, $SALT, $PREF_SUBJ, $LOGIN_GUIDE, $KG_SIGN, $DATA_URL_DIR;
	$result = array('bool' => false, 'report' => '');
	if(authenticateUser($dbh, $uid, $pw)){
		try{
			if($newDataUrl !== ""){
				$result['bool'] = writeDataUrlIntoFile($DATA_URL_DIR, $uid . '_' . $cid, $newDataUrl);
				$result['report'] = "Portrait (dataUrl) is updated!";
			}
		}catch(PDOException $e){
			echo "Error: " . $e->getMessage();
			exit;
		}
	}
	return $result;
}
// ++++++++++++++++++++++++++++++++++++
?>
