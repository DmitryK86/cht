<?php

require 'vendor/autoload.php';
require 'alert.php';

// Configure the data store

$dir = __DIR__.'/data';

$config = new \JamesMoss\Flywheel\Config($dir, array(
    'formatter' => new \JamesMoss\Flywheel\Formatter\JSON,
));

$repo = new \JamesMoss\Flywheel\Repository('shouts', $config);

// Store the posted shout data to the data store

if(isset($_POST["name"]) && isset($_POST["comment"])) {

    $name = htmlspecialchars($_POST["name"]);
    $name = str_replace(array("\n", "\r"), '', $name);

    $comment = htmlspecialchars($_POST["comment"]);
    $comment = preg_replace(
        '#((https?|ftp)://(\S*?\.\S*?))([\s)\[\]{},;"\':<]|\.\s|$)#i',
        "<a href=\"$1\" target=\"_blank\">$3</a>$4",
        $comment
    );

    $replyText = $_POST['reply'] ?? '';

    if (!empty($replyText)){
        $comment = str_replace($replyText, '', $comment);
    }

    $imageSrc = '';
    if (isset($_FILES['image']['error']) && $_FILES['image']['error'] == UPLOAD_ERR_OK){
        $imageSrc = '/data/uploads/' . basename($_FILES['image']['name']);
        $uploadFile = __DIR__ . $imageSrc;
        move_uploaded_file($_FILES['image']['tmp_name'], $uploadFile);
    }

    // Storing a new shout

    $shout = new \JamesMoss\Flywheel\Document(array(
        'text' => $comment,
        'name' => $name,
        'replyText' => $replyText,
        'createdAt' => time(),
        'imgSrc' => $imageSrc,
    ));

    $repo->store($shout);

    if ($name != 'dk'){
        sendAlert();
    }
}
