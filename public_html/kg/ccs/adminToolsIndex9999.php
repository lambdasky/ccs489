<?php
$version = str_replace('adminToolsIndex', '', basename(__FILE__, '.php'));

// Ignore the above "$version".
$version = '';
require_once('./includes/adminToolsHtml' . $version . '.php');
?>
