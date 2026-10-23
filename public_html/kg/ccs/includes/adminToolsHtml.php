<?php
/*
 * adminToolsHtml.php
 */

// Get self file-version.
$version = str_replace('adminToolsHtml', '', basename(__FILE__, '.php'));

// Require exrernal files.
define('EXTERNAL_CCS_DIR', "/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs");
require_once(EXTERNAL_CCS_DIR . '/commonPrep' . $version . '.php');

// file-version
$jsVersion = jsonSafeEncode($version);

$pathAdminToolsMainJs = './js/adminToolsMain' . $version . '.js';
$pathAdminToolsMainCss = './css/adminToolsMain' . $version . '.css';

$verAdminToolsMainJs = filemtime($pathAdminToolsMainJs);//UTC
$verAdminToolsMainCss = filemtime($pathAdminToolsMainCss);//UTC

$jsPhase = jsonSafeEncode($phase);

////$jsUser = jsonSafeEncode(isset($_GET['user'])? $_GET['user']: '');
////$jsPp = jsonSafeEncode(isset($_GET['pp'])? $_GET['pp']: '');

// Print parameters for printMain.js
$jsOffsetX = jsonSafeEncode(isset($_GET['offsetX'])? $_GET['offsetX']: '0');
$jsOffsetY = jsonSafeEncode(isset($_GET['offsetY'])? $_GET['offsetY']: '0');
$jsScaleX = jsonSafeEncode(isset($_GET['scaleX'])? $_GET['scaleX']: '1.00');
$jsScaleY = jsonSafeEncode(isset($_GET['scaleY'])? $_GET['scaleY']: '0.90');


$htBuf = <<<_EOT_
<!DOCTYPE html>
<html lang='ja'>
<head>
<meta charset='UTF-8'>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>
// constant from FileVersion
const version = {$jsVersion}

let phase = {$jsPhase}
////const user = {$jsUser}
////const pp = {$jsPp}
const offsetX = {$jsOffsetX}
const offsetY = {$jsOffsetY}
const scaleX = {$jsScaleX}
const scaleY = {$jsScaleY}
</script>
<link rel='stylesheet' href='{$pathAdminToolsMainCss}?ver={$verAdminToolsMainCss}'>
<title>CCS489 Admin Tools</title>
</head>
<body>
<div id='root'><!-- Begin root -->
	<div id='EXPT'></div>
	<div id='header'></div>
	<div id='loginForm'></div>
	<div id='buttons'></div>
	<div id='main'></div>
	<div id='footer'></div>
	<div id='report'></div>

	<div id='TEMP_REAL'></div>
</div><!-- End root -->
<br><br>
</body>

<script src='{$pathAdminToolsMainJs}?ver={$verAdminToolsMainJs}'></script>
<script>
makeFormScreen()
</script>

</html>
_EOT_;

echo $htBuf;

?>
