<?php
/*
 * commonPrep.php (Common Preparation)
 */
//session_start();

// We get the json-string which has posted, and convert it to an object.
$posted = json_decode(file_get_contents("php://input"), true);
// ------------------------------------ Add the next:
if(!is_array($posted)) $posted = array();   // ← 追加
// ++++++++++++++++++++++++++++++++++++

// Try using no session.
foreach($_GET as $key => $value) $$key = myHtmlEntities($value);
foreach($posted as $key => $value) $$key = myHtmlEntities($value);

// ★★★ myHtmlEntities
function myHtmlEntities($string){
	if(is_array($string)){
		return array_map("myHtmlEntities", $string);
	}else{
		return htmlentities($string, ENT_QUOTES, 'UTF-8');
	}
}

// Reset (Unset, Disconnect and Destroy) all data registered to a session
function resetSession(){
	// Unset my private(?) parameter "$$key" s:
	foreach(array_keys($_SESSION) as $key){
		global $$key;
		$$key = NULL;
	}
	// Unset all of the session variables.
	$_SESSION = array();
	// If it's desired to kill the session, also delete the session cookie.
	// Note: This will destroy the session, and not just the session data!
	if(isset($_COOKIE[session_name()])){
		setcookie(session_name(), '', time() - 42000, '/');
	}
	// Finally, destroy the session.
	session_destroy();
}

// Shortening for json_encode.
function jsonSafeEncode($data){
	return json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
}


// □■□■□ For Debug □■□■□
// ★★★ for DEBUG：Write data（string, array ok!) into file.
function writeInto($file, $buf){
	$fp = fopen($file, 'w');
	fwrite($fp, $buf);
	fclose($fp);
}

// Latest
function save_var_dump($file, $arr){
	ob_start();
	var_dump($arr);
	$buf = ob_get_contents();
	ob_end_clean();
	file_put_contents($file, $buf);
}

?>
