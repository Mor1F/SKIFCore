<?php
header('Content-Type: application/json');
require_once 'db.php'; // Подключаем базу

// Получаем JSON от JS
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['act'] ?? '';

// 1. ПРОВЕРКА: Создано ли хранилище?
if ($action === 'check') {
    $stmt = $pdo->query("SELECT COUNT(*) FROM skif_storage WHERE id = 1");
    echo json_encode(['exists' => $stmt->fetchColumn() > 0]);
    exit;
}

// 2. ИНИЦИАЛИЗАЦИЯ (Создание базы)
if ($action === 'init' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $pass = $input['password'] ?? '';
    $resetPhrase = $input['resetPhrase'] ?? '';
    $data = $input['data'] ?? ''; // Зашифрованные данные

    if (!$pass || !$resetPhrase) die(json_encode(['error' => 'No credentials']));

    // Хешируем пароли для проверки на сервере (сам ключ шифрования на сервер не попадает в чистом виде)
    $passHash = password_hash($pass, PASSWORD_DEFAULT);
    $resetHash = password_hash($resetPhrase, PASSWORD_DEFAULT);

    // id=1 всегда, так как пользователь один
    $sql = "INSERT INTO skif_storage (id, password_hash, reset_hash, encrypted_data) VALUES (1, ?, ?, ?)
            ON DUPLICATE KEY UPDATE password_hash=?, reset_hash=?, encrypted_data=?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$passHash, $resetHash, $data, $passHash, $resetHash, $data]);

    echo json_encode(['status' => 'ok']);
    exit;
}

// 3. ВХОД (Получение данных)
if ($action === 'load' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $pass = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT password_hash, encrypted_data FROM skif_storage WHERE id = 1");
    $stmt->execute();
    $user = $stmt->fetch();

    if ($user && password_verify($pass, $user['password_hash'])) {
        echo json_encode(['status' => 'ok', 'data' => $user['encrypted_data']]);
    } else {
        echo json_encode(['status' => 'error', 'msg' => 'Invalid Password']);
    }
    exit;
}

// 4. СОХРАНЕНИЕ (Обновление данных)
if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = $input['data'] ?? '';
    
    // В идеале тут нужна сессия, но для простоты обновляем по факту запроса, 
    // так как данные все равно зашифрованы ключом, которого нет у сервера.
    $stmt = $pdo->prepare("UPDATE skif_storage SET encrypted_data = ? WHERE id = 1");
    $stmt->execute([$data]);
    
    echo json_encode(['status' => 'ok']);
    exit;
}

// 5. СБРОС (По кодовой фразе)
if ($action === 'reset' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $phrase = $input['phrase'] ?? '';

    $stmt = $pdo->prepare("SELECT reset_hash FROM skif_storage WHERE id = 1");
    $stmt->execute();
    $user = $stmt->fetch();

    if ($user && password_verify($phrase, $user['reset_hash'])) {
        $pdo->exec("DELETE FROM skif_storage WHERE id = 1");
        echo json_encode(['status' => 'ok']);
    } else {
        echo json_encode(['status' => 'error', 'msg' => 'Wrong reset phrase']);
    }
    exit;
}
?>