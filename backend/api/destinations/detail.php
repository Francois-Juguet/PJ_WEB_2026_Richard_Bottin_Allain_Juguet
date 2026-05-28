<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$id     = (int)($_GET['id'] ?? 0);

if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID requis']); exit(); }

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT d.*, u.first_name as provider_name FROM destinations d LEFT JOIN users u ON d.provider_id = u.id WHERE d.id = ?');
    $stmt->execute([$id]);
    $dest = $stmt->fetch();
    if (!$dest) { http_response_code(404); echo json_encode(['error' => 'Destination non trouvée']); exit(); }

    // Hébergements
    $stmt = $db->prepare('SELECT * FROM accommodations WHERE destination_id = ? ORDER BY rating DESC');
    $stmt->execute([$id]);
    $dest['accommodations'] = $stmt->fetchAll();

    // Activités
    $stmt = $db->prepare('SELECT * FROM activities WHERE destination_id = ? ORDER BY rating DESC');
    $stmt->execute([$id]);
    $dest['activities'] = $stmt->fetchAll();

    // Avis
    $stmt = $db->prepare('SELECT r.*, u.first_name, u.last_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.entity_type = "destination" AND r.entity_id = ? ORDER BY r.created_at DESC LIMIT 10');
    $stmt->execute([$id]);
    $dest['reviews'] = $stmt->fetchAll();

    echo json_encode($dest);

} elseif ($method === 'PUT') {
    $user = requireRole(['admin', 'provider']);
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('SELECT * FROM destinations WHERE id = ?');
    $stmt->execute([$id]);
    $dest = $stmt->fetch();
    if (!$dest) { http_response_code(404); echo json_encode(['error' => 'Non trouvée']); exit(); }
    if ($user['role'] !== 'admin' && $dest['provider_id'] != $user['id']) {
        http_response_code(403); echo json_encode(['error' => 'Accès interdit']); exit();
    }

    $fields  = ['name', 'country', 'region', 'description', 'image', 'category', 'price_from', 'is_featured'];
    $updates = [];
    $params  = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $updates[] = "$f = ?";
            $params[]  = $f === 'is_featured' ? (bool)$body[$f] : $body[$f];
        }
    }
    if ($updates) {
        $params[] = $id;
        $db->prepare('UPDATE destinations SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
    }

    $stmt = $db->prepare('SELECT * FROM destinations WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode($stmt->fetch());

} elseif ($method === 'DELETE') {
    requireRole('admin');
    $db->prepare('DELETE FROM destinations WHERE id = ?')->execute([$id]);
    echo json_encode(['message' => 'Destination supprimée']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
