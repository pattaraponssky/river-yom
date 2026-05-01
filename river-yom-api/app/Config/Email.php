<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class Email extends BaseConfig
{

    public string $fromName = 'Admin River Yom'; // ชื่อผู้ส่งอีเมล
    public string $fromEmail = 'dbtech.engineering.5@gmail.com'; // เปลี่ยนเป็นอีเมลของคุณ

    public string $protocol = 'smtp';
    public string $SMTPHost = 'smtp.gmail.com'; // หรือ smtp.mailtrap.io ถ้าใช้ Mailtrap
    public int $SMTPPort = 587;
    public string $SMTPUser = 'dbtech.engineering.5@gmail.com'; // อีเมลของคุณ
    public string $SMTPPass = 'mhnw wrpd cdjv lqnw'; // รหัสผ่านแอปของ Gmail หรือรหัสผ่านปกติ
    public string $SMTPCrypto = 'tls';
    public bool   $SMTPKeepAlive = false;
    public int    $SMTPTimeout = 5;

    public string $wordWrap = 'true';
    public string $wrapChars = '76';
    public string $mailType = 'html'; // หรือ 'text'
    public string $charset = 'UTF-8';
    public bool   $validate = false;
    public int    $priority = 3;
    public string $CRLF = "\r\n";
    public string $newline = "\r\n";
    public bool   $BCCBatchMode = false;
    public int    $BCCBatchSize = 200;
    public bool   $DSN = false;
}