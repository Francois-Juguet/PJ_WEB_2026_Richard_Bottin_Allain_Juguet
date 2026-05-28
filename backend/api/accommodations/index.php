<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $where  = [];
    $params = [];

    if (!empty($_GET['destination_id'])) {
        $where[]  = 'a.destination_id = ?';
        $params[] = (int)$_GET['destination_id'];
    }
    if (!empty($_GET['type'])) {
        $where[]  = 'a.type = ?';
        $params[] = $_GET['type'];
    }
    if (!empty($_GET['min_price'])) {
        $where[]  = 'a.price_per_night >= ?';
        $params[] = (float)$_GET['min_price'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 'a.price_per_night <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    if (!empty($_GET['stars'])) {
        $where[]  = 'a.stars >= ?';
        $params[] = (int)$_GET['stars'];
    }
    if (!empty($_GET['capacity'])) {
        $where[]  = 'a.max_capacity >= ?';
        $params[] = (int)$_GET['capacity'];
    }

    $sort = match ($_GET['sort'] ?? 'rating') {
        'price_asc'  => 'a.price_per_night ASC',
        'price_desc' => 'a.price_per_night DESC',
        'stars'      => 'a.stars DESC',
        default      => 'a.rating DESC'
    };

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql      = "SELECT a.*, d.name as destination_name, d.country FROM accommodations a JOIN destinations d ON a.destination_id = d.id $whereSQL ORDER BY $sort";
    $stmt     = $db->prepare($sql);
    $stmt->execute($params);
    $accs = $stmt->fetchAll();

    foreach ($accs as &$acc) {
        $acc['amenities'] = json_decode($acc['amenities'] ?? '[]');
        $acc['images']    = json_decode($acc['images'] ?? '[]');
    }

    echo json_encode($accs);

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'provider']);
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('INSERT INTO accommodations (destination_id, name, type, description, address, price_per_night, max_capacity, stars, amenities, images, provider_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        (int)$body['destination_id'],
        htmlspecialchars($body['name'] ?? ''),
        $body['type'] ?? 'hotel',
        htmlspecialchars($body['description'] ?? ''),
        htmlspecialchars($body['address'] ?? ''),
        (float)($body['price_per_night'] ?? 0),
        (int)($body['max_capacity'] ?? 2),
        (int)($body['stars'] ?? 0),
        json_encode($body['amenities'] ?? []),
        json_encode($body['images'] ?? []),
        $user['id']
    ]);

    echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Hébergement créé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
