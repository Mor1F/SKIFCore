<?php
// Настройки подключения к MariaDB
$host = 'localhost'; 
$db   = 'SKIFVault';
$user = 'SKIFVault';
$pass = 'SHGrFSbw*S4S!Bg$UAL4ShZ+HSRBcsef';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // В продакшене лучше не выводить ошибку на экран, но для отладки оставим
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?>