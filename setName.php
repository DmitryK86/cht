<?php

const USER_NAME_COOKIE_KEY = '_uname';

if (!isset($_GET['name'])){
    echo json_encode(['success' => false, 'message' => 'Empty name']);
    exit();
}

setcookie(USER_NAME_COOKIE_KEY, $_GET['name'], time()+60*60*24*30*365);

echo json_encode(['success' => true]);;
exit();