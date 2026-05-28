<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$accId  = (int)($_GET['id'] ?? 0);

if ($method === 'GET') {
    $checkin  = $_GET['check_in']  ?? '';
    $checkout = $_GET['check_out'] ?? '';

    if (!$accId) { http_response_code(400); echo json_encode(['error' => 'ID requis']); exit(); }

    $stmt = $db->prepare('SELECT * FROM accommodations WHERE id = ?');
    $stmt->execute([$accId]);
    $acc = $stmt->fetch();
    if (!$acc) { http_response_code(404); echo json_encode(['error' => 'Hébergement non trouvé']); exit(); }

    if ($checkin && $checkout) {
        $stmt = $db->prepare('SELECT * FROM accommodation_availability WHERE accommodation_id = ? AND date BETWEEN ? AND ? ORDER BY date');
        $stmt->execute([$accId, $checkin, $checkout]);
        $availability = $stmt->fetchAll();

        // Vérifier si disponible sur toute la période
        $dates     = [];
        $current   = new DateTime($checkin);
        $end       = new DateTime($checkout);
        while ($current < $end) {
            $dates[] = $current->format('Y-m-d');
            $current->modify('+1 day');
        }

        $bookedDates = array_column($availability, 'date');
        $isAvailable = true;
        foreach ($dates as $d) {
            if (in_array($d, $bookedDates)) {
                $avail = $availability[array_search($d, $bookedDates)];
                if ($avail['status'] === 'full') { $isAvailable = false; break; }
            }
        }

        echo json_encode([
            'accommodation' => $acc,
            'is_available'  => $isAvailable,
            'availability'  => $availability,
            'nights'        => count($dates),
            'total_price'   => count($dates) * $acc['price_per_night']
        ]);
    } else {
        $stmt = $db->prepare('SELECT * FROM accommodation_availability WHERE accommodation_id = ? ORDER BY date');
        $stmt->execute([$accId]);
        echo json_encode($stmt->fetchAll());
    }

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'provider']);
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('INSERT INTO accommodation_availability (accommodation_id, date, available_rooms, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE available_rooms = ?, status = ?');
    $stmt->execute([
        $accId,
        $body['date'],
        (int)$body['available_rooms'],
        $body['status'] ?? 'available',
        (int)$body['available_rooms'],
        $body['status'] ?? 'available'
    ]);

    echo json_encode(['message' => 'Disponibilité mise à jour']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
