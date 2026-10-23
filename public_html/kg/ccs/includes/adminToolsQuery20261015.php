<?php
/*
 * adminToolsQuery.php
 */

$version = str_replace('adminToolsQuery', '', basename(__FILE__, '.php'));

// Require exrernal files.
define('EXTERNAL_CCS_DIR', "/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs");
require_once(EXTERNAL_CCS_DIR . '/commonPrep' . $version . '.php');
require_once(EXTERNAL_CCS_DIR . '/commonDb_sa3V0BQJlU3JE' . $version . '.php');
require_once(EXTERNAL_CCS_DIR . '/adminToolsLib' . $version . '.php');

/*
$dbh = connectDb($HOST, $DB_NAME, $DB_USER, $DB_PW);

$response = array('report' => '', 'types' => array(), 'events' => array(), 'registrations' => array(), 'reservationsRelated' => array(), 'messages' => array());
$response['dbName'] = $DB_NAME;

// ★★★★★　Debug　★★★★★
//writeArrayInto($posted, './000_posted.txt');//★★★★★★★★★
//$dbgCnt = 0;
//writeInto('20230927_OK', './000_log_' . $dbgCnt++);//★★★★★★★★★
// ★★★★★★★★★★★★★★★


if(authenticateAdmin($dbh, $posted)){
	if($posted['phase'] === 'login'){
		$response['types'] = getTypes($dbh);
		$response['events'] = getEvents($dbh);
		$response['registrations'] = getRegistrations($dbh);
		$response['reservationsEvents'] = getReservationsEvents($dbh);
		$response['reservationsRelated'] = getReservationsRelated($dbh, $posted);
	// ------------------------------------ Add the next:
	}elseif($posted['phase'] === 'getProxyToken' && !empty($posted['targetUid'])){
		$response['proxyToken'] = makeAuthToken($dbh, $posted['targetUid'], 'proxy', 300);
	// ++++++++++++++++++++++++++++++++++++
	}elseif($posted['phase'] === 'updateChecks'){
		$response['report'] = updateChecks($dbh, $posted);
		$response['registrations'] = getRegistrations($dbh);
		$response['reservationsRelated'] = getReservationsRelated($dbh, $posted);
	}elseif($posted['phase'] === 'getDataUrls'){
		$response['dataUrls'] = getDataUrls($dbh, $posted);
	}elseif($posted['phase'] === 'changeNursery'){
		$res = changeNursery($dbh, $posted);
		$response['result'] = $res['result'];
		$response['neweid'] = $res['neweid'];
		$response['report'] = $res['report'];
	}elseif($posted['phase'] === 'getResvRelWithinEids' && !empty($posted['eids'])){
		$response['reservationsRelatedWithinEids'] = getReservationsRelated($dbh, $posted);
	}
}else{
	$response['report'] = 'Not_Authenticated';
}

$dbh = null;

// For the proxy login by the administrators.
////$response['prxyPlnPw'] = $PRXY_PLN_PW;

header('Content-type: application/json; charset: utf-8');
echo jsonSafeEncode($response);
*/
// ------------------------------------ Replace the above with:
$dbh = connectDb($HOST, $DB_NAME, $DB_USER, $DB_PW);

$response = array('report' => '', 'types' => array(), 'events' => array(), 'registrations' => array(), 'reservationsRelated' => array(), 'messages' => array());
$response['dbName'] = $DB_NAME;

if($posted['phase'] === 'login'){
	// ログインは pw + totp を検証（authenticateAdmin が担当）。
	if(authenticateAdmin($dbh, $posted)){
		// 成功したら admin セッショントークンを発行して返す。
		$response['adminToken'] = makeAuthToken($dbh, $posted['uid'], 'admin_session', 8 * 3600);
		$response['types'] = getTypes($dbh);
		$response['events'] = getEvents($dbh);
		$response['registrations'] = getRegistrations($dbh);
		$response['reservationsEvents'] = getReservationsEvents($dbh);
		$response['reservationsRelated'] = getReservationsRelated($dbh, $posted);
	}else{
		$response['report'] = 'Not_Authenticated';
	}
}else{
	// ログイン以外は adminToken で認証（pw/totp は見ない）。
	$tokUid = isset($posted['adminToken'])? verifyAuthToken($dbh, $posted['adminToken'], 'admin_session'): false;
	if($tokUid !== false && $tokUid === $posted['uid']){
		if($posted['phase'] === 'getProxyToken' && !empty($posted['targetUid'])){
			$response['proxyToken'] = makeAuthToken($dbh, $posted['targetUid'], 'proxy', 300);
		}elseif($posted['phase'] === 'updateChecks'){
			$response['report'] = updateChecks($dbh, $posted);
			$response['registrations'] = getRegistrations($dbh);
			$response['reservationsRelated'] = getReservationsRelated($dbh, $posted);
		}elseif($posted['phase'] === 'getDataUrls'){
			$response['dataUrls'] = getDataUrls($dbh, $posted);
		}elseif($posted['phase'] === 'changeNursery'){
			$res = changeNursery($dbh, $posted);
			$response['result'] = $res['result'];
			$response['neweid'] = $res['neweid'];
			$response['report'] = $res['report'];
		}elseif($posted['phase'] === 'getResvRelWithinEids' && !empty($posted['eids'])){
			$response['reservationsRelatedWithinEids'] = getReservationsRelated($dbh, $posted);
		}
	}else{
		$response['report'] = 'Not_Authenticated';
	}
}

$dbh = null;
header('Content-type: application/json; charset: utf-8');
echo jsonSafeEncode($response);
// ++++++++++++++++++++++++++++++++++++

?>
