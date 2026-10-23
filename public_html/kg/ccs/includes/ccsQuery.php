<?php
/*
 * ccsQuery.php (CCS Query)
 */

$version = str_replace('ccsQuery', '', basename(__FILE__, '.php'));

// Require exrernal files.
define('EXTERNAL_CCS_DIR', "/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs");
require_once(EXTERNAL_CCS_DIR . '/commonPrep' . $version . '.php');
require_once(EXTERNAL_CCS_DIR . '/commonDb_sa3V0BQJlU3JE' . $version . '.php');
require_once(EXTERNAL_CCS_DIR . '/ccsLib' . $version . '.php');

$dbh = connectDb($HOST, $DB_NAME, $DB_USER, $DB_PW);

$response = array();

$response['dbName'] = $DB_NAME;

// $response['extraAuth'] (=$extraAuth) takes one of the values {'Administrator', 'Developer', 'SuperUser', ''(empty string)}.
$extraAuth = identifyExtraAuth($pw);
/*
$response['extraAuth'] = empty($pw)? '': $extraAuth;
*/
// ------------------------------------ replace the above with:
if(empty($extraAuth) && !empty($token)){
	if(verifyAuthToken($dbh, $token, 'proxy') === $uid){
		$extraAuth = 'Proxy';   // 消費しない（TTL内のみ有効）
	}
}
$response['extraAuth'] = $extraAuth;
// ++++++++++++++++++++++++++++++++++++

// ★★★★★　Debug　★★★★★
//save_var_dump('000_post', $posted);//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
// ★★★★★★★★★★★★★★★

// Set the language and internal encoding to UTF-8.
mb_language('uni');
mb_internal_encoding('UTF-8');

// ------------------------------------ Add $token's in the following:
if($phase === 'regEmail'){
	$result = registerEmail($dbh, $phase, $email);
}elseif($phase === 'regUser'){
	$result = registerUser($dbh, $phase, $email, $uid, $pw, $newPw, $token, $ulname, $ufname, $ulname_k, $ufname_k, $hohequsr, $hlname, $hfname, $hlname_k, $hfname_k, $zipcode, $prefecture, $cityarea, $street, $building, $uphone, $hphone, $scharea, $schareaplus);
	$newPw = $result['newPw'];// Is this really necessary?
}elseif($phase === 'modUser'){//using registerUser()
	registerUser($dbh, $phase, $email, $uid, $pw, $newPw, $token, $ulname, $ufname, $ulname_k, $ufname_k, $hohequsr, $hlname, $hfname, $hlname_k, $hfname_k, $zipcode, $prefecture, $cityarea, $street, $building, $uphone, $hphone, $scharea, $schareaplus);
}elseif($phase === 'sendPwResetUrl'){
	$result = sendPwResetUrl($dbh, $phase, $email, $uid);
}elseif($phase === 'testNewEmail'){
	$result = testNewEmail($dbh, $email, $uid, $pw, $newEmail);
}elseif($phase === 'chgEmail'){
	$result = changeEmail($dbh, $phase, $email, $uid, $pw, $newEmail, $ulname, $ufname);
}elseif($phase === 'chgPw' || $phase === 'resetPw'){
	$result = changePw($dbh, $phase, $email, $uid, $pw, $newPw, $token, $ulname, $ufname);
}elseif($phase === 'addChild'){
	$result = addChild($dbh, $email, $uid, $pw, $clname, $cfname, $clname_k, $cfname_k, $cbirth, $csex, $pastpt, $ulname, $ufname);
}elseif($phase === 'modChild'){
	$result = modifyChild($dbh, $email, $uid, $pw, $cid, $clname, $cfname, $clname_k, $cfname_k, $cbirth, $csex, $pastpt, $ulname, $ufname);
}elseif($phase === 'delChild'){
	$result = deleteChild($dbh, $email, $uid, $pw, $cid, $ulname, $ufname, $clname, $cfname);
}elseif($phase === 'addResv'){
	$result = addReservation($dbh, $email, $uid, $pw, $eid, $typ, $cid, $posblKey, $pastpt, $comment, $entdate, $graddate, $commute, $concurrency, $eng_course, $utNow, $admnInfo);
}elseif($phase === 'delResv'){
	$result = deleteReservation($dbh, $email, $uid, $pw, $cid, $rid, $eid, $typ, $wtngLen);
	if($advUid || $advRid){
		$resultWtng = infoWtngState($dbh, $eid, $advUid, $advRid);
	}
}elseif($phase === 'updFamState'){// Updating family state.
	if(authenticateUser($dbh, $uid, $pw)){
		$result = updateFamState($dbh, $uid, $fam_members, $fam_rel);
	}
}elseif($phase === 'updPortrait'){// Upadating portrait image.
	$result = updatePortrait($dbh, $email, $uid, $pw, $cid, $newDataUrl);
}elseif($phase === 'delPortrait'){
	$result = deleteDataUrlFile($dbh, $uid, $pw, $cid);
}
// ++++++++++++++++++++++++++++++++++++

// Phases not to require the information of UCR (user, children and reservations).
$NOT_REQ_UCR = ['start', 'regEmail', 'sendPwResetUrl'];
// Get UCR information if $phase is not in $NOT_REQ_UCR.
if(!in_array($phase, $NOT_REQ_UCR)){
	$response['ucr'] = getUsrinfChildrenResvsByUid($dbh, $email, $uid, $pw);
}

// Phases requiring Types, future Events and future Reservations.
// $REQ_TYP_EVT_RSV = ['start', 'refreshAvblEvt', 'login', 'formAddResv', 'addResv', 'delResv'];
$REQ_TYP_EVT_RSV = ['start', 'refreshAvblEvt', 'login', 'modUser', 'addChild', 'modChild', 'delChild', 'formAddResv', 'addResv', 'delResv'];
// Get all events information if $phase is in $phasesToGetEvents.
if(in_array($phase, $REQ_TYP_EVT_RSV)){
	$response['types'] = getTypes($dbh);
	$response['fuEvts'] = getFutureEvents($dbh);
	$response['fuResvs'] = getFutureReservations($dbh);
}

// Phases that do not require $response['bool'] and $response['report'].
$NOT_REQ_RES_REP = ['start', 'login', 'regUser', 'refreshAvblEvt', 'formAddResv'];
// Set $response['bool'] and $response['report'] if $phase is not in $NOT_REQ_RES_REP
if(!in_array($phase, $NOT_REQ_RES_REP)){
	$response['bool'] = $result['bool'];
	$response['report'] = $result['report'];
}

// When phase is 'delResv', there is anotehr return info.
if($phase === 'delResv'){
	$response['boolWtng'] = $resultWtng['bool'];
	$response['sndMsgWtng'] = $resultWtng['sndMsg'];
	$response['reportWtng'] = $resultWtng['report'];
}

$dbh = null;

// For the spoogfing login by the administrators.
//$response['usrPwPln'] = $PRXY_PLAIN_PW;

header('Content-type: application/json; charset: utf-8');
echo jsonSafeEncode($response);

?>

