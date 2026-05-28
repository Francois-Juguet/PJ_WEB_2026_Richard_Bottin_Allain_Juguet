<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db   = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT id, email, first_name, last_name, role, avatar, phone, created_at FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $profile = $stmt->fetch();

    // Stats
    $stmt = $db->prepare('SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = "confirmed"');
    $stmt->execute([$user['id']]);
    $profile['bookings_count'] = (int)$stmt->fetchColumn();

    $stmt = $db->prepare('SELECT COUNT(*) FROM itineraries WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $profile['itineraries_count'] = (int)$stmt->fetchColumn();

    $stmt = $db->prepare('SELECT COUNT(*) FROM favorites WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $profile['favorites_count'] = (int)$stmt->fetchColumn();

    echo json_encode($profile);

} elseif ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);
    $allowed = ['first_name', 'last_name', 'phone'];
    $updates = [];
    $params  = [];

    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $updates[] = "$f = ?";
            $params[]  = htmlspecialchars(trim($body[$f]));
        }
    }

    if (!empty($body['password'])) {
        if (strlen($body['password']) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Mot de passe trop court']);
            exit();
        }
        $updates[] = 'password = ?';
        $params[]  = password_hash($body['password'], PASSWORD_BCRYPT);
    }

    if ($updates) {
        $params[] = $user['id'];
        $db->prepare('UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
    }

    $stmt = $db->prepare('SELECT id, email, first_name, last_name, role, avatar, phone, created_at FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    echo json_encode($stmt->fetch());
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
