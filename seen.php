<?php

require 'vendor/autoload.php';

// Setting up the data store

$dir = __DIR__.'/data';

$config = new \JamesMoss\Flywheel\Config($dir, array(
    'formatter' => new \JamesMoss\Flywheel\Formatter\JSON,
));

$repo = new \JamesMoss\Flywheel\Repository('last-seen', $config);

// Send the 20 latest shouts as json

$shouts = $repo->query()
    ->orderBy('createdAt ASC')
    ->execute();

$results = array();

foreach($shouts as $shout) {
    $res['name'] = $shout->name;
    $res['time'] = date('Y-m-d H:i:s', $shout->createdAt);

    $results[] = $res;
}

header('Content-type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT);
