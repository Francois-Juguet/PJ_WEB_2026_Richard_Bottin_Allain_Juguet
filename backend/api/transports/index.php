<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $where  = ['t.available_seats > 0'];
    $params = [];

    if (!empty($_GET['type'])) {
        $where[]  = 't.type = ?';
        $params[] = $_GET['type'];
    }
    if (!empty($_GET['from'])) {
        $where[]  = 't.departure_city LIKE ?';
        $params[] = '%' . $_GET['from'] . '%';
    }
    if (!empty($_GET['to'])) {
        $where[]  = 't.arrival_city LIKE ?';
        $params[] = '%' . $_GET['to'] . '%';
    }
    if (!empty($_GET['date'])) {
        $where[]  = 'DATE(t.departure_time) = ?';
        $params[] = $_GET['date'];
    }
    if (!empty($_GET['class'])) {
        $where[]  = 't.class_type = ?';
        $params[] = $_GET['class'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 't.price <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    if (!empty($_GET['direct'])) {
        $where[]  = 't.is_direct = 1';
    }

    $sort = match ($_GET['sort'] ?? 'price') {
        'duration'   => 'TIMESTAMPDIFF(MINUTE, t.departure_time, t.arrival_time) ASC',
        'departure'  => 't.departure_time ASC',
        'price_desc' => 't.price DESC',
        default      => 't.price ASC'
    };

    $whereSQL = 'WHERE ' . implode(' AND ', $where);
    $sql      = "SELECT t.*, TIMESTAMPDIFF(MINUTE, t.departure_time, t.arrival_time) as duration_minutes FROM transports t $whereSQL ORDER BY $sort";
    $stmt     = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    $user = requireRole('admin');
    $body = json_decode(file_get_contents('php://input'), true);

    $required = ['type', 'company', 'departure_city', 'arrival_city', 'departure_time', 'arrival_time', 'price', 'available_seats', 'total_seats'];
    foreach ($required as $r) {
        if (empty($body[$r])) {
            http_response_code(400);
            echo json_encode(['error' => "Champ '$r' requis"]);
            exit();
        }
    }

    $stmt = $db->prepare('INSERT INTO transports (type, company, departure_city, arrival_city, departure_code, arrival_code, departure_time, arrival_time, price, available_seats, total_seats, class_type, is_direct, stops) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $body['type'], $body['company'], $body['departure_city'], $body['arrival_city'],
        $body['departure_code'] ?? null, $body['arrival_code'] ?? null,
        $body['departure_time'], $body['arrival_time'],
        (float)$body['price'], (int)$body['available_seats'], (int)$body['total_seats'],
        $body['class_type'] ?? 'economy', (bool)($body['is_direct'] ?? true), (int)($body['stops'] ?? 0)
    ]);

    echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Transport créé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
