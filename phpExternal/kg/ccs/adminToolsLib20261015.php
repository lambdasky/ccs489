<?php
/*
 * aToolsLib.php (Admin Tools Library)
 */


// ■□■□■□■□■□ FUNCTIONS □■□■□■□■□■

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


// Get all events
function getEvents($dbh){
	try{
		$sql = "SELECT * FROM events ORDER BY eid ASC";
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


function getRegistrations($dbh){
	// -------------------------------- Add the following:
	global $PII_FIELDS_USER, $PII_FIELDS_CHILD;
	// ++++++++++++++++++++++++++++++++
	try{
		$sql = "SELECT * FROM view_registrations";
		$sth = $dbh->query($sql);
		$registrations = array(); $i = 0;
		/*
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$row['pastpt'] = explode(',', $row['pastpt']);
			$registrations[$i] = $row;
			$i++;
		}
		*/
		// ---------------------------- Replace the previous one with:
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$row = decryptPiiFields($row, $PII_FIELDS_USER);
			$row = decryptPiiFields($row, $PII_FIELDS_CHILD);
			$row['pastpt'] = explode(',', $row['pastpt']);
			$registrations[$i] = $row;
			$i++;
		}		
		// ++++++++++++++++++++++++++++
		return $registrations;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}


function getReservationsEvents($dbh){
	try{
		$sql = "SELECT * FROM view_reservations_events";
		$sth = $dbh->query($sql);
		$reservationsEvents = array(); $i = 0;
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$reservationsEvents[$i] = $row;
			$i++;
		}
		return $reservationsEvents;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}


// Get the records of view_reservations_related.
// $posted['eids'] may be an array (of eid's). When it is empty, the function returns the all records. Otherwise, the records with the specified eid's.
// ------------------------------------ Replace the previous one with:
function getReservationsRelated($dbh, $posted){
	// -------------------------------- Add the following:
	global $PII_FIELDS_USER, $PII_FIELDS_CHILD;
	// ++++++++++++++++++++++++++++++++
	try{
		$eids = isset($posted['eids']) && is_array($posted['eids'])? $posted['eids']: array();
		if(empty($eids)){
			$sql = "SELECT * FROM view_reservations_related";
			$sth = $dbh->prepare($sql);
			$sth->execute();
		}else{
			$placeholders = implode(',', array_fill(0, count($eids), '?'));
			$sql = "SELECT * FROM view_reservations_related WHERE eid IN ($placeholders)";
			$sth = $dbh->prepare($sql);
			$sth->execute(array_values($eids));   // ? に順に束縛
		}
		$reservationsRelated = array(); $i = 0;
		/*
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$row['pastpt'] = explode(',', $row['pastpt']);
			$row['fam_members'] = $row['fam_members']? json_decode($row['fam_members'], true): null;
			$row['fam_rel'] = $row['fam_rel']? json_decode($row['fam_rel'], true): null;
			$reservationsRelated[$i] = $row;
			$i++;
		}
		*/
		// ---------------------------- Replace the previous one with:
		while($row = $sth->fetch(PDO::FETCH_ASSOC)){
			$row = decryptPiiFields($row, $PII_FIELDS_USER);
			$row = decryptPiiFields($row, $PII_FIELDS_CHILD);
			$row['pastpt'] = explode(',', $row['pastpt']);
			$row['fam_members'] = $row['fam_members']? json_decode(decryptPii($row['fam_members']), true): null;
			$row['fam_rel'] = $row['fam_rel']? json_decode(decryptPii($row['fam_rel']), true): null;
			$reservationsRelated[$i] = $row;
			$i++;
		}
		// ++++++++++++++++++++++++++++
		return $reservationsRelated;
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}
// ++++++++++++++++++++++++++++++++++++

// Read data (dataUrl) from a file.
// If the file does not exist, an empty string is returned.
function readFromFile($filePath){
	if(is_file($filePath)){
		return file_get_contents($filePath);
	}else{
		return '';
	}
}


function getDataUrls($dbh, $posted){
	global $DATA_URL_DIR;
	$dataUrls = array();
	foreach($posted['uid_cids'] as $uid_cid){
		$dataUrls[$uid_cid] = readFromFile($DATA_URL_DIR . '/' . $uid_cid);
	}
	return $dataUrls;
}


// Update checks(participate, sel)
// ------------------------------------ Replace the previous one with:
function updateChecks($dbh, $posted){
	try{
		// participate, sel それぞれを安全に更新するヘルパ。
		$applyChecks = function($dbh, $col, $map){
			// $col は内部で固定した列名のみ許可（FE値は使わない）。
			if(!in_array($col, array('participate', 'sel'), true)) return;
			if(!is_array($map) || empty($map)) return;
			// rid は整数、値は 0/1 のみ採用。不正は捨てる。
			$clean = array();
			foreach($map as $rid => $val){
				$rid = filter_var($rid, FILTER_VALIDATE_INT);
				if($rid === false) continue;
				$val = ($val === 1 || $val === '1')? 1: 0;
				$clean[$rid] = $val;
			}
			if(empty($clean)) return;
			// CASE WHEN rid = ? THEN ? ... を、rid の IN(...) で対象行に限定して組む。
			$caseExpr = "CASE";
			$params = array();
			foreach($clean as $rid => $val){
				$caseExpr .= " WHEN rid = ? THEN ?";
				$params[] = $rid;
				$params[] = $val;
			}
			$caseExpr .= " ELSE $col END";
			$inPlaceholders = implode(',', array_fill(0, count($clean), '?'));
			$sql = "UPDATE reservations SET $col = $caseExpr WHERE rid IN ($inPlaceholders)";
			$params = array_merge($params, array_keys($clean));   // IN(...) 用に rid を再度束縛
			$sth = $dbh->prepare($sql);
			$sth->execute($params);
		};

		$applyChecks($dbh, 'participate', isset($posted['participate'])? $posted['participate']: array());
		$applyChecks($dbh, 'sel',         isset($posted['sel'])         ? $posted['sel']         : array());
		return 'updated';
	}catch(PDOException $e){
		echo "Error: " . $e->getMessage();
		exit;
	}
}
// ++++++++++++++++++++++++++++++++++++

// "ChangeNursery" is only for administrators. It actually changes the "eid" of a reservation. When the aa event is "not nursery", then the eid will be changed to "nursery" (but the apr1age remains the same).For example, 'aa2024040120' is changed to 'aa2024040121'. And the resverse direction is also done as well.
function changeNursery($dbh, $posted){
	global $extraAuth;
	global $SUBJECT_PREFIX;
	global $LOGIN_GUIDE;
	global $SIGNATURE;
	// -------------------------------- Add the following:
	global $PII_FIELDS_CHILD;
	// ++++++++++++++++++++++++++++++++
	try{
		$res = array('result' => false, 'neweid' => '', 'report' => '');
		// Get the reservation before changing for later comparison.
		$sql = "SELECT * FROM view_reservations_related WHERE rid = :rid";
		$sth = $dbh->prepare($sql);
		$aval = array(':rid' => $posted['rid']);
		$sth->execute($aval);
		$row0 = $sth->fetch(PDO::FETCH_ASSOC);
		// ---------------------------- Add the following:
		$row0 = decryptPiiFields($row0, $PII_FIELDS_CHILD);   // ★ 直後に復号
		// ++++++++++++++++++++++++++++
		// Update the eid so that the nursery (of eid) is reversed.
		$sql = "UPDATE reservations SET eid = :neweid WHERE rid = :rid AND cid = :cid AND eid = :eid";
		$sth = $dbh->prepare($sql);
		$neweid = substr($posted['eid'], 0, -1) . (1 - $posted['nursery']);
		$aval = array(':rid' => $posted['rid'], ':cid' => $posted['cid'], ':eid' => $posted['eid'], ':neweid' => $neweid);
		$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$dbh->beginTransaction();
		$sth->execute($aval);
		$dbh->commit();
		// Retrieve the changed eid, which also serves as confirmation.
		$sql = "SELECT * FROM view_reservations_related WHERE rid = :rid";
		$sth = $dbh->prepare($sql);
		$aval = array(':rid' => $posted['rid']);
		$sth->execute($aval);
		$row1 = $sth->fetch(PDO::FETCH_ASSOC);
		// Verify that the eid has been changed.
		$res['result'] = true;
		$res['neweid'] = $row1['eid'];
		$res['report'] = $row0['clname'] . $row0['cfname'] . "さまの予約を\n" . $row0['etitle'] . "\nから\n" . $row1['etitle'] . "\nに変更しました。";
		return $res;
	}catch(PDOException $e){
		$dbh->rollback();
		throw $e;
	}
}

?>
