<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    $results = [];

    // Destinations
    $stmt = $db->prepare('
        SELECT f.id as fav_id, f.entity_type, f.entity_id, f.created_at,
               d.name as item_name, d.image, d.country as location,
               d.price_from as price, d.rating
        FROM favorites f
        JOIN destinations d ON f.entity_id = d.id
        WHERE f.user_id = ? AND f.entity_type = "destination"
        ORDER BY f.created_at DESC');
    $stmt->execute([$user['id']]);
    $results = array_merge($results, $stmt->fetchAll());

    // Accommodations
    $stmt = $db->prepare('
        SELECT f.id as fav_id, f.entity_type, f.entity_id, f.created_at,
               a.name as item_name, a.image,
               CONCAT(COALESCE(d.name, ""), IF(d.country IS NOT NULL, CONCAT(", ", d.country), "")) as location,
               a.price_per_night as price, a.rating
        FROM favorites f
        JOIN accommodations a ON f.entity_id = a.id
        LEFT JOIN destinations d ON a.destination_id = d.id
        WHERE f.user_id = ? AND f.entity_type = "accommodation"
        ORDER BY f.created_at DESC');
    $stmt->execute([$user['id']]);
    $results = array_merge($results, $stmt->fetchAll());

    // Activities
    $stmt = $db->prepare('
        SELECT f.id as fav_id, f.entity_type, f.entity_id, f.created_at,
               act.name as item_name, act.image,
               COALESCE(d.name, "") as location,
               act.price, act.rating
        FROM favorites f
        JOIN activities act ON f.entity_id = act.id
        LEFT JOIN destinations d ON act.destination_id = d.id
        WHERE f.user_id = ? AND f.entity_type = "activity"
        ORDER BY f.created_at DESC');
    $stmt->execute([$user['id']]);
    $results = array_merge($results, $stmt->fetchAll());

    usort($results, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    echo json_encode($results);

} elseif ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $type = in_array($body['entity_type'] ?? '', ['destination', 'accommodation', 'activity']) ? $body['entity_type'] : null;
    $eid  = (int)($body['entity_id'] ?? 0);

    if (!$type || !$eid) { http_response_code(400); echo json_encode(['error' => 'Données invalides']); exit(); }

    $stmt = $db->prepare('SELECT id FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?');
    $stmt->execute([$user['id'], $type, $eid]);
    $existing = $stmt->fetch();

    if ($existing) {
        $db->prepare('DELETE FROM favorites WHERE id = ?')->execute([$existing['id']]);
        echo json_encode(['favorited' => false, 'message' => 'Retiré des favoris']);
    } else {
        $db->prepare('INSERT INTO favorites (user_id, entity_type, entity_id) VALUES (?, ?, ?)')->execute([$user['id'], $type, $eid]);
        echo json_encode(['favorited' => true, 'message' => 'Ajouté aux favoris']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
