<?php
/*
 * prtHtml.php (Print Html)
 */

// get self file-version.
$version = str_replace('printHtml', '', basename(__FILE__, '.php'));

// Require exrernal files.
define('EXTERNAL_CCS_DIR', "/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs");
require_once(EXTERNAL_CCS_DIR . '/commonPrep' . $version . '.php');

// file-version
$jsVersion = jsonSafeEncode($version);

$jsPhase = jsonSafeEncode($phase);

// ★★★　for debug　★★★
$jsUser = jsonSafeEncode(isset($_GET['user'])? $_GET['user']: '');
$jsPp = jsonSafeEncode(isset($_GET['pp'])? $_GET['pp']: '');
// ★★★★★★★★★★★★★

$pathPrintMainJs = '../js/printMain' . $version . '.js';

$verPrintMainJs = filemtime($pathPrintMainJs);//UTC



$htBuf = <<<_EOT_
<!DOCTYPE html>
<html lang='ja'>
<head>
<meta charset='UTF-8'>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>
const version = {$jsVersion}
let phase = {$jsPhase}
const user = {$jsUser}//for debug★★★★★★★★★★★★
const pp = {$jsPp}//for debug★★★★★★★★★★★★
</script>
<title>CCS489 APPLICATION PRINT</title>
</head>
<body>
<div id='root'></div>
<div id='EXPT'></div>
<br><br>
</body>

<script src='{$pathPrintMainJs}?ver={$verPrintMainJs}'></script>

</html>
_EOT_;

echo $htBuf;

?>
