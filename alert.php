<?php

const ALERT_FILE_PATH = __DIR__ . '/data/alert.sign';

function sendAlert()
{
    if (file_exists(ALERT_FILE_PATH)){
        return;
    }
    $params = include 'params.php';
    $date = date('Y.m.d');
    $time = date('H:i:s');
    $rand = random_int(1000, 10000);
    $ch = curl_init();
    curl_setopt_array(
        $ch,
        array(
            CURLOPT_URL => "https://api.telegram.org/bot{$params['botId']}/sendMessage",
            CURLOPT_POST => TRUE,
            CURLOPT_RETURNTRANSFER => TRUE,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_POSTFIELDS => array(
                'chat_id' => $params['chatId'],
                'text' => "Postgres: TPS  exceeded on ntgdev.com
Problem started at {$time} on {$date}
Problem name: Postgres: TPS  exceeded on ntgdev.com
Severity: High
Original problem ID: {$rand}",
            ),
        )
    );
    curl_exec($ch);
    curl_close();

    file_put_contents(ALERT_FILE_PATH, 1);
}


sendAlert();