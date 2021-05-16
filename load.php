<?php

require 'vendor/autoload.php';

// Setting up the data store

$dir = __DIR__.'/data';

$config = new \JamesMoss\Flywheel\Config($dir, array(
    'formatter' => new \JamesMoss\Flywheel\Formatter\JSON,
));

$repo = new \JamesMoss\Flywheel\Repository('shouts', $config);

$name = $_COOKIE['_uname'] ?? null;
if ($name){
    $lastSeenRepo = new \JamesMoss\Flywheel\Repository('last-seen', $config);
    $old = $lastSeenRepo->query()
        ->where('name', '==', $name)
        ->execute();
    if ($old){
        foreach ($old as $_o){
            $lastSeenRepo->delete($_o->id);
        }
    }
    $data = new \JamesMoss\Flywheel\Document(
        [
            'name' => $name,
            'createdAt' => time(),
        ]
    );

    $lastSeenRepo->store($data);
}

// Send the 20 latest shouts as json

$shouts = $repo->query()
        ->orderBy('createdAt ASC')
        ->limit(20,0)
        ->execute();

$results = array();

$config = array(
    'language' => '\RelativeTime\Languages\English',
    'separator' => ', ',
    'suffix' => true,
    'truncate' => 1,
);
        
foreach($shouts as $shout) {
    $shout->timeAgo = date('H:i', $shout->createdAt);
    $results[] = $shout;
}

header('Content-type: application/json');
echo json_encode($results);
