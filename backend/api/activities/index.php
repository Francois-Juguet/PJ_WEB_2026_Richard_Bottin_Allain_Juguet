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
    if (!empty($_GET['category'])) {
        $where[]  = 'a.category = ?';
        $params[] = $_GET['category'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 'a.price <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    if (!empty($_GET['search'])) {
        $where[]  = '(a.name LIKE ? OR a.description LIKE ?)';
        $s        = '%' . $_GET['search'] . '%';
        $params   = array_merge($params, [$s, $s]);
    }

    $sort = match ($_GET['sort'] ?? 'rating') {
        'price_asc'  => 'a.price ASC',
        'price_desc' => 'a.price DESC',
        'duration'   => 'a.duration_hours ASC',
        default      => 'a.rating DESC'
    };

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql      = "SELECT a.*, d.name as destination_name, d.country FROM activities a JOIN destinations d ON a.destination_id = d.id $whereSQL ORDER BY $sort";
    $stmt     = $db->prepare($sql);
    $stmt->execute($params);
    $activities = $stmt->fetchAll();

    foreach ($activities as &$act) {
        $act['included'] = json_decode($act['included'] ?? '[]');
    }

    echo json_encode($activities);

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'provider']);
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('INSERT INTO activities (destination_id, name, category, description, price, duration_hours, max_participants, included, image, provider_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        (int)$body['destination_id'],
        htmlspecialchars($body['name'] ?? ''),
        $body['category'] ?? 'tour',
        htmlspecialchars($body['description'] ?? ''),
        (float)($body['price'] ?? 0),
        (float)($body['duration_hours'] ?? 2),
        (int)($body['max_participants'] ?? 10),
        json_encode($body['included'] ?? []),
        filter_var($body['image'] ?? '', FILTER_SANITIZE_URL),
        $user['id']
    ]);

    echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Activité créée']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
