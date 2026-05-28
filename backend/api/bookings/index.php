<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db   = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    if ($user['role'] === 'admin') {
        $stmt = $db->prepare('SELECT b.*, u.first_name, u.last_name, u.email, i.title as trip_title, d.name as destination FROM bookings b JOIN users u ON b.user_id = u.id JOIN itineraries i ON b.itinerary_id = i.id LEFT JOIN destinations d ON i.destination_id = d.id ORDER BY b.created_at DESC');
        $stmt->execute();
    } else {
        $stmt = $db->prepare('SELECT b.*, i.title as trip_title, d.name as destination, d.image as destination_image FROM bookings b JOIN itineraries i ON b.itinerary_id = i.id LEFT JOIN destinations d ON i.destination_id = d.id WHERE b.user_id = ? ORDER BY b.created_at DESC');
        $stmt->execute([$user['id']]);
    }
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    $body        = json_decode(file_get_contents('php://input'), true);
    $itineraryId = (int)($body['itinerary_id'] ?? 0);

    $stmt = $db->prepare('SELECT * FROM itineraries WHERE id = ? AND user_id = ?');
    $stmt->execute([$itineraryId, $user['id']]);
    $it = $stmt->fetch();
    if (!$it) { http_response_code(404); echo json_encode(['error' => 'Itinéraire non trouvé']); exit(); }
    if ($it['status'] === 'cancelled') { http_response_code(400); echo json_encode(['error' => 'Itinéraire annulé']); exit(); }

    // Vérifier qu'il n'y a pas déjà une réservation
    $stmt = $db->prepare('SELECT id FROM bookings WHERE itinerary_id = ? AND status != "cancelled"');
    $stmt->execute([$itineraryId]);
    if ($stmt->fetch()) { http_response_code(409); echo json_encode(['error' => 'Réservation déjà existante pour cet itinéraire']); exit(); }

    $ref    = 'VV-' . date('Y') . '-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);
    $total  = (float)$it['total_price'];
    $method2 = htmlspecialchars($body['payment_method'] ?? 'card');

    $stmt = $db->prepare('INSERT INTO bookings (user_id, itinerary_id, booking_reference, total_price, status, payment_status, payment_method) VALUES (?, ?, ?, ?, "confirmed", "paid", ?)');
    $stmt->execute([$user['id'], $itineraryId, $ref, $total, $method2]);
    $bookingId = $db->lastInsertId();

    // Confirmer l'itinéraire
    $db->prepare('UPDATE itineraries SET status = "confirmed" WHERE id = ?')->execute([$itineraryId]);

    // Notifications
    $db->prepare('INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, "booking", ?, "booking")')->execute([
        $user['id'],
        'Réservation confirmée !',
        "Votre réservation $ref a été confirmée. Total: " . number_format($total, 2) . "€",
        $bookingId
    ]);

    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$bookingId]);
    echo json_encode($stmt->fetch());
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
