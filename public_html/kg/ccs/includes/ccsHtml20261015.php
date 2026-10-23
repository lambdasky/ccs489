<?php
/*
 * ccsHtml.php (CCS Create HTML)
 */

// get self file-version.
$version = str_replace('ccsHtml', '', basename(__FILE__, '.php'));

// Require exrernal files.
define('EXTERNAL_CCS_DIR', "/home/seikyokg/seikyogakuen.org/phpExternal/kg/ccs");
require_once(EXTERNAL_CCS_DIR . '/commonPrep' . $version . '.php');

// file-version
$jsVersion = jsonSafeEncode($version);

// versions of js and css
$pathCcsMainJs = './js/ccsMain' . $version . '.js';
$pathCcsMainCss = './css/ccsMain' . $version . '.css';
$verCcsMainJs = filemtime($pathCcsMainJs);//UTC
$verCcsMainCss = filemtime($pathCcsMainCss);//UTC

// Parse QueryString
$jsPhase = jsonSafeEncode(isset($_GET['phase'])? $_GET['phase']: 'start');
$jsUid = jsonSafeEncode(isset($_GET['uid'])? $_GET['uid']: '');
$jsEmail = jsonSafeEncode(isset($_GET['email'])? $_GET['email']: '');
$jsPw = jsonSafeEncode(isset($_GET['pw'])? $_GET['pw']: '');

// ------------------------------------ Add the next:
$jsToken = jsonSafeEncode(isset($_GET['token'])? $_GET['token']: '');
// ++++++++++++++++++++++++++++++++++++

$jsTyps = jsonSafeEncode(isset($_GET['typs'])? $_GET['typs']: '');// restricted types
$jsAddTyps = jsonSafeEncode(isset($_GET['addTyps'])? $_GET['addTyps']: '');// types added for debug.

// now is given such as 2020/10/01+08:00:00
$jsNow = jsonSafeEncode(isset($_GET['now'])? $_GET['now']: '');

// whether to display in the new version, etc.
$jsDspWtngState = jsonSafeEncode(isset($_GET['dspWtngState'])? $_GET['dspWtngState']: '');
$jsDspAdminInfo = jsonSafeEncode(isset($_GET['dspAdminInfo'])? $_GET['dspAdminInfo']: '');
$jsStartAt = jsonSafeEncode(isset($_GET['startAt'])? $_GET['startAt']: '');

// Current URL
$currentUrl = (empty($_SERVER['HTTPS'])? 'http://': 'https://') . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
$jsBasicUrl = jsonSafeEncode(preg_replace('/\?.*$/', '', $currentUrl));

// PR pritority passphrase.
$jsPrPriPassphrase = jsonSafeEncode(isset($_GET['prPriPassphrase'])? $_GET['prPriPassphrase']: '');

$jsAftLoggedIn = jsonSafeEncode(isset($_GET['aftloggedin'])? $_GET['aftloggedin']: '');


$ht_buf = <<<_EOT_
<!DOCTYPE html>
<html lang='ja'>
<head>
<meta charset='UTF-8'>

<!-- Add the next: -->
<meta name='referrer' content='no-referrer'>
<!-- ++++++++++++++++ -->

<meta name='viewport' content='width=device-width,initial-scale=1'>
<script src='https://ajaxzip3.github.io/ajaxzip3.js' charset='utf-8'></script>
<!--
<script src='https://yubinbango.github.io/yubinbango/yubinbango.js' charset='UTF-8'></script>
-->
<script src='./js/addHyphensToPhoneNumber.js'></script>
<script>
// initilize by QueryString
const orgPhase = {$jsPhase}// to identify especially 'formRegUser'.
let phase = {$jsPhase}
let uid = {$jsUid}
let email = {$jsEmail}
let pw = {$jsPw}

// ------------------------------------ Add the next:
const token = {$jsToken}
// ++++++++++++++++++++++++++++++++++++

// constants from QueryString
let qsTyps = {$jsTyps}
const qsAddTyps = {$jsAddTyps}

const qsDspWtngState = {$jsDspWtngState}
const qsDspAdminInfo = {$jsDspAdminInfo}
const qsStartAt = {$jsStartAt}

const qsPrPriPassphrase = {$jsPrPriPassphrase}
const qsAftLoggedIn = {$jsAftLoggedIn}
const qsNow = {$jsNow}

// constant from FileVersion
const version = {$jsVersion}

// constant URL, Priority
const basicUrl ={$jsBasicUrl}

</script>
<link rel='stylesheet' href='//ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css'>
<link rel='stylesheet' href='{$pathCcsMainCss}?ver={$verCcsMainCss}'>
<title id='title00'>KG-CCS</title>
</head>
<body id='body0'>
<div id='outerWrap'></div><!-- whole -->
<br><br>
<!--
<div id='privacyPolicy'>
	<a target='_blank' href='./docs/abtPrivacyPolicy_kgCcs489.html'>［プライバシーポリシー］</a>
</div>
-->
<!-- End whole -->
<br><br>

<script src='{$pathCcsMainJs}?ver={$verCcsMainJs}'></script>

</body>
</html>
_EOT_;

echo $ht_buf;

?>

