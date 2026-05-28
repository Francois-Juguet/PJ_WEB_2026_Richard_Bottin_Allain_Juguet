<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT i.*, d.name as destination_name, d.image as destination_image, d.country FROM itineraries i LEFT JOIN destinations d ON i.destination_id = d.id WHERE i.user_id = ? ORDER BY i.created_at DESC');
    $stmt->execute([$user['id']]);
    $itineraries = $stmt->fetchAll();

    foreach ($itineraries as &$it) {
        $stmt = $db->prepare('SELECT it.*, t.type, t.company, t.departure_city, t.arrival_city, t.departure_time, t.arrival_time, t.price as transport_price FROM itinerary_transports it JOIN transports t ON it.transport_id = t.id WHERE it.itinerary_id = ?');
        $stmt->execute([$it['id']]);
        $it['transports'] = $stmt->fetchAll();

        $stmt = $db->prepare('SELECT ia.*, a.name, a.type, a.price_per_night, a.stars, a.rating FROM itinerary_accommodations ia JOIN accommodations a ON ia.accommodation_id = a.id WHERE ia.itinerary_id = ?');
        $stmt->execute([$it['id']]);
        $it['accommodations'] = $stmt->fetchAll();

        $stmt = $db->prepare('SELECT iact.*, act.name, act.category, act.price as activity_price, act.duration_hours, act.image FROM itinerary_activities iact JOIN activities act ON iact.activity_id = act.id WHERE iact.itinerary_id = ?');
        $stmt->execute([$it['id']]);
        $it['activities'] = $stmt->fetchAll();
    }

    echo json_encode($itineraries);

} elseif ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('INSERT INTO itineraries (user_id, title, destination_id, start_date, end_date, travelers, status) VALUES (?, ?, ?, ?, ?, ?, "draft")');
    $stmt->execute([
        $user['id'],
        htmlspecialchars($body['title'] ?? 'Mon voyage'),
        !empty($body['destination_id']) ? (int)$body['destination_id'] : null,
        $body['start_date'] ?? null,
        $body['end_date'] ?? null,
        (int)($body['travelers'] ?? 1)
    ]);
    $id = $db->lastInsertId();

    echo json_encode(['id' => (int)$id, 'message' => 'Itinéraire créé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
