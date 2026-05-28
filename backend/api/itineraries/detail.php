<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();
$id     = (int)($_GET['id'] ?? 0);

function getItinerary($db, $id) {
    $stmt = $db->prepare('SELECT i.*, d.name as destination_name, d.image as destination_image, d.country FROM itineraries i LEFT JOIN destinations d ON i.destination_id = d.id WHERE i.id = ?');
    $stmt->execute([$id]);
    $it = $stmt->fetch();
    if (!$it) return null;

    $stmt = $db->prepare('SELECT it.*, t.type, t.company, t.departure_city, t.arrival_city, t.departure_code, t.arrival_code, t.departure_time, t.arrival_time, t.class_type FROM itinerary_transports it JOIN transports t ON it.transport_id = t.id WHERE it.itinerary_id = ?');
    $stmt->execute([$id]);
    $it['transports'] = $stmt->fetchAll();

    $stmt = $db->prepare('SELECT ia.*, a.name, a.type, a.price_per_night, a.stars, a.rating, a.address FROM itinerary_accommodations ia JOIN accommodations a ON ia.accommodation_id = a.id WHERE ia.itinerary_id = ?');
    $stmt->execute([$id]);
    $it['accommodations'] = $stmt->fetchAll();

    $stmt = $db->prepare('SELECT iact.*, act.name, act.category, act.price as activity_price, act.duration_hours, act.image, act.description FROM itinerary_activities iact JOIN activities act ON iact.activity_id = act.id WHERE iact.itinerary_id = ?');
    $stmt->execute([$id]);
    $it['activities'] = $stmt->fetchAll();

    return $it;
}

function recalcTotal($db, $id) {
    $it = getItinerary($db, $id);
    $total = 0;
    foreach ($it['transports'] as $t) $total += $t['price'] ?? 0;
    foreach ($it['accommodations'] as $a) $total += $a['price'] ?? 0;
    foreach ($it['activities'] as $act) $total += $act['price'] ?? 0;
    $db->prepare('UPDATE itineraries SET total_price = ? WHERE id = ?')->execute([$total, $id]);
    return $total;
}

if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID requis']); exit(); }

if ($method === 'GET') {
    $it = getItinerary($db, $id);
    if (!$it || $it['user_id'] != $user['id']) { http_response_code(404); echo json_encode(['error' => 'Non trouvé']); exit(); }
    echo json_encode($it);

} elseif ($method === 'PUT') {
    $it = getItinerary($db, $id);
    if (!$it || $it['user_id'] != $user['id']) { http_response_code(404); echo json_encode(['error' => 'Non trouvé']); exit(); }
    $body = json_decode(file_get_contents('php://input'), true);
    $action = $body['action'] ?? '';

    if ($action === 'add_transport') {
        $transportId = (int)$body['transport_id'];
        $stmt = $db->prepare('SELECT price FROM transports WHERE id = ?');
        $stmt->execute([$transportId]);
        $transport = $stmt->fetch();
        if (!$transport) { http_response_code(404); echo json_encode(['error' => 'Transport non trouvé']); exit(); }

        $price = $transport['price'] * (int)($body['passengers'] ?? $it['travelers']);
        $db->prepare('INSERT INTO itinerary_transports (itinerary_id, transport_id, direction, passengers, price) VALUES (?, ?, ?, ?, ?)')->execute([
            $id, $transportId, $body['direction'] ?? 'outbound', (int)($body['passengers'] ?? $it['travelers']), $price
        ]);

        // Notification
        $db->prepare('INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $user['id'], 'Transport ajouté', 'Un transport a été ajouté à votre itinéraire.', 'transport', $id, 'itinerary'
        ]);

    } elseif ($action === 'add_accommodation') {
        $accId   = (int)$body['accommodation_id'];
        $checkin = $body['check_in'];
        $checkout = $body['check_out'];
        $rooms   = (int)($body['rooms'] ?? 1);

        $stmt = $db->prepare('SELECT price_per_night FROM accommodations WHERE id = ?');
        $stmt->execute([$accId]);
        $acc  = $stmt->fetch();
        if (!$acc) { http_response_code(404); echo json_encode(['error' => 'Hébergement non trouvé']); exit(); }

        $nights = (new DateTime($checkin))->diff(new DateTime($checkout))->days;
        $price  = $acc['price_per_night'] * $nights * $rooms;

        $db->prepare('INSERT INTO itinerary_accommodations (itinerary_id, accommodation_id, check_in, check_out, rooms, price) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $id, $accId, $checkin, $checkout, $rooms, $price
        ]);

        // Marquer disponibilité
        $current = new DateTime($checkin);
        $end     = new DateTime($checkout);
        while ($current < $end) {
            $date = $current->format('Y-m-d');
            $db->prepare('INSERT INTO accommodation_availability (accommodation_id, date, available_rooms, status) VALUES (?, ?, ?, "partial") ON DUPLICATE KEY UPDATE available_rooms = GREATEST(available_rooms - ?, 0), status = IF(available_rooms - ? <= 0, "full", "partial")')->execute([$accId, $date, $rooms, $rooms, $rooms]);
            $current->modify('+1 day');
        }

        $db->prepare('INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $user['id'], 'Hébergement ajouté', 'Un hébergement a été ajouté à votre itinéraire.', 'accommodation', $id, 'itinerary'
        ]);

    } elseif ($action === 'add_activity') {
        $actId = (int)$body['activity_id'];
        $participants = (int)($body['participants'] ?? $it['travelers']);

        $stmt = $db->prepare('SELECT price FROM activities WHERE id = ?');
        $stmt->execute([$actId]);
        $act  = $stmt->fetch();
        if (!$act) { http_response_code(404); echo json_encode(['error' => 'Activité non trouvée']); exit(); }

        $price = $act['price'] * $participants;
        $db->prepare('INSERT INTO itinerary_activities (itinerary_id, activity_id, scheduled_date, scheduled_time, participants, price) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $id, $actId, $body['scheduled_date'] ?? null, $body['scheduled_time'] ?? '09:00:00', $participants, $price
        ]);

        $db->prepare('INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $user['id'], 'Activité ajoutée', 'Une activité a été ajoutée à votre itinéraire.', 'activity', $id, 'itinerary'
        ]);

    } elseif ($action === 'update_info') {
        $allowed = ['title', 'destination_id', 'start_date', 'end_date', 'travelers'];
        $updates = [];
        $params  = [];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $updates[] = "$f = ?";
                $params[]  = $body[$f];
            }
        }
        if ($updates) {
            $params[] = $id;
            $db->prepare('UPDATE itineraries SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
        }

    } elseif ($action === 'remove_transport') {
        $db->prepare('DELETE FROM itinerary_transports WHERE id = ? AND itinerary_id = ?')->execute([(int)$body['item_id'], $id]);

    } elseif ($action === 'remove_accommodation') {
        $db->prepare('DELETE FROM itinerary_accommodations WHERE id = ? AND itinerary_id = ?')->execute([(int)$body['item_id'], $id]);

    } elseif ($action === 'remove_activity') {
        $db->prepare('DELETE FROM itinerary_activities WHERE id = ? AND itinerary_id = ?')->execute([(int)$body['item_id'], $id]);
    }

    $total = recalcTotal($db, $id);
    $updated = getItinerary($db, $id);
    echo json_encode($updated);

} elseif ($method === 'DELETE') {
    $stmt = $db->prepare('SELECT user_id FROM itineraries WHERE id = ?');
    $stmt->execute([$id]);
    $it = $stmt->fetch();
    if (!$it || $it['user_id'] != $user['id']) { http_response_code(404); echo json_encode(['error' => 'Non trouvé']); exit(); }
    $db->prepare('DELETE FROM itineraries WHERE id = ?')->execute([$id]);
    echo json_encode(['message' => 'Itinéraire supprimé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
