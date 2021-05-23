<?php

require 'vendor/autoload.php';

$name = $_COOKIE['_uname'] ?? null;
storeLastSeen($name);

$repo = getRepository('shouts');
// Send the 20 latest shouts as json
$shouts = $repo->query()
        ->orderBy('createdAt ASC')
        ->limit(20,0)
        ->execute();

$results = array();
        
foreach($shouts as $shout) {
    $shout->timeAgo = date('H:i', $shout->createdAt);
    $shout->isOnline = isOnline($shout->name);
    $results[] = $shout;
}

header('Content-type: application/json');
echo json_encode($results);
exit();

function getRepository($repoName)
{
    $dir = __DIR__.'/data';
    $config = new \JamesMoss\Flywheel\Config($dir, array(
        'formatter' => new \JamesMoss\Flywheel\Formatter\JSON,
    ));

    return new \JamesMoss\Flywheel\Repository($repoName, $config);
}

function storeLastSeen($name)
{
    if (!$name){
        return;
    }
    $lastSeenRepo = getRepository('last-seen');
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

function isOnline($name)
{
    static $data = null;
    if ($data === null){
        $lastSeenRepo = getRepository('last-seen');
        $result = $lastSeenRepo->findAll();
        foreach ($result as $res){
            $data[$res->name] = $res->createdAt;
        }
    }

    return $data[$name] >= (time() - 15);
}
