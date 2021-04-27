<?php

require 'vendor/autoload.php';
// Setting up the data store
$dir = __DIR__.'/data';

$config = new \JamesMoss\Flywheel\Config($dir, array(
    'formatter' => new \JamesMoss\Flywheel\Formatter\JSON,
));

$repo = new \JamesMoss\Flywheel\Repository('shouts', $config);

$oldShouts = $repo->findAll();
foreach($oldShouts as $old) {
    $repo->delete($old->id);
}

echo 'Done!';
