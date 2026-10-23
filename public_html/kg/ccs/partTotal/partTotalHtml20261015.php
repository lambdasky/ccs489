<?php
/*
 * partTotalHtml.php (Participation Total HTML)
 */

// Get self file-version.
$version = str_replace('partTotalHtml', '', basename(__FILE__, '.php'));

// Main JS file and its version.
$pathPartTotalMainJs = '../js/partTotalMain' . $version . '.js';
$verPartTotalMainJs = filemtime($pathPartTotalMainJs);//UTC


$htBuf = <<<_EOT_
<!DOCTYPE html>
<html lang='ja'>
<head>
<meta charset='UTF-8'>
<meta name="viewport" content="width=device-width,initial-scale=1">

<style>
body {
	overflow-wrap: anywhere; /* 収まらない場合に折り返す */
	word-break: normal; /* 単語の分割はデフォルトに依存 */
	line-break: strict; /* 禁則処理を厳格に適用 */
}

div.partTotal {
	margin: 0px;
	width: auto;
	height: auto;
	font-weight: bold;
	color: darkslategray;
}

.partTotal div.topWrap {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	margin: 30px 0px 0px 30px;
	width: 845px;
}

.topWrap div.topTitle {
	font-size: 27px;
}

.topWrap div#totalBy {
	display: flex;
	margin 0px;
	width: 120px;
}

#totalBy div {
	width: 48px;
	height: 24px;
	padding-top: 2px;
	text-align: center;
	font-size: 14px;
}

#totalBy div.on {
	background-color: #f09199;
	color: #ffffff;
}

#totalBy div.off {
	background-color: #f4f4f4;
	color: #e5e4e6;
}

.partTotal div.ymAndTypDisp {
	margin: 0px 0px 160px 40px;
}

.partTotal div.fy {
	margin: 20px 0px 85px 0px;
}

.partTotal div.fyTitle {
	margin: 0px 0px 15px 0px;
	font-size: 23px;
}

.partTotal div.ymTypTitle {
	margin: 0px 0px 2px 6px;
	font-size: 16px;
}

.partTotal .ccs{color: forestgreen;}
.partTotal .aa{color: hotpink;}
.partTotal .pr{color: royalblue;}
.partTotal .wk{color: #4169e1;}
.partTotal .bc{color: #ec94a1;}
.partTotal .er{color: #ff8c00;}
.partTotal .op{color: #3cb371;}
.partTotal .be{color: #ff69b4;}
.partTotal .ce{color: #00ced1;}
.partTotal .BA{color: mediumblue;}
.partTotal .WV{color: crimson;}

.partTotal div.tableWrap {
	margin: 0px 0px 32px 16px;
}

.partTotal table, td, th {
	border-collapse: collapse;
	border: 1px solid #333333;
	vertical-align: middle;
	font-weight: bold;
}

.partTotal table {
	table-layout: fixed;
}

.partTotal th {
	font-weight: bold;
	font-size: 12px;
	background-color: darkcyan; 
	color: white;
}

.partTotal tr.totalRow th {
	background-color: indianred;
}

.partTotal td {
	padding: 2px 6px;
	text-align: center;
	font-weight: bold;
	font-size: 12px;
	color: darkcyan;
}

.partTotal td.eid {
	width: 85px;
	padding: 2px;
	font-size: 9px !important;
}

.partTotal td.date_s {
	width: 90px;
}

.partTotal td.etitle {
	width: 400px;
	text-align: left !important;
}

.partTotal td.resv, td.part, td.abs {
	width: 50px;
}

.partTotal td.colspan3 {
	width: 595px;
}

.partTotal tr.totalRow td {
	background-color: lightcyan;
}
</style>

<title>Participation Total</title>
</head>
<body>
<div id='root'><!-- Begin root -->
	<div id='header'></div>
	<div id='main'></div>
	<div id='footer'></div>
</div><!-- End root -->
<br><br>

<script src='{$pathPartTotalMainJs}?ver={$verPartTotalMainJs}'></script>

</body>
</html>
_EOT_;

echo $htBuf;

?>


