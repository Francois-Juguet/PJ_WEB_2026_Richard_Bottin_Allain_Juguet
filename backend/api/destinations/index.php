<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $where  = [];
    $params = [];

    if (!empty($_GET['search'])) {
        $where[]  = '(d.name LIKE ? OR d.country LIKE ? OR d.description LIKE ?)';
        $s        = '%' . $_GET['search'] . '%';
        $params   = array_merge($params, [$s, $s, $s]);
    }
    if (!empty($_GET['category'])) {
        $where[]  = 'd.category = ?';
        $params[] = $_GET['category'];
    }
    if (!empty($_GET['min_price'])) {
        $where[]  = 'd.price_from >= ?';
        $params[] = (float)$_GET['min_price'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 'd.price_from <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    if (!empty($_GET['featured'])) {
        $where[]  = 'd.is_featured = 1';
    }
    if (!empty($_GET['country'])) {
        $where[]  = 'd.country = ?';
        $params[] = $_GET['country'];
    }

    $sort  = match ($_GET['sort'] ?? 'featured') {
        'price_asc'  => 'd.price_from ASC',
        'price_desc' => 'd.price_from DESC',
        'rating'     => 'd.rating DESC',
        'reviews'    => 'd.reviews_count DESC',
        default      => 'd.is_featured DESC, d.rating DESC'
    };

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $limit    = min((int)($_GET['limit'] ?? 12), 50);
    $offset   = (int)($_GET['page'] ?? 0) * $limit;

    $sql  = "SELECT d.*, u.first_name as provider_name FROM destinations d LEFT JOIN users u ON d.provider_id = u.id $whereSQL ORDER BY $sort LIMIT $limit OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $destinations = $stmt->fetchAll();

    $countStmt = $db->prepare("SELECT COUNT(*) FROM destinations d $whereSQL");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    echo json_encode(['data' => $destinations, 'total' => (int)$total, 'limit' => $limit]);

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'provider']);
    $body = json_decode(file_get_contents('php://input'), true);

    $name        = htmlspecialchars(trim($body['name'] ?? ''));
    $country     = htmlspecialchars(trim($body['country'] ?? ''));
    $category    = $body['category'] ?? '';
    $description = htmlspecialchars($body['description'] ?? '');
    $image       = filter_var($body['image'] ?? '', FILTER_SANITIZE_URL);
    $price_from  = (float)($body['price_from'] ?? 0);
    $region      = htmlspecialchars(trim($body['region'] ?? ''));

    if (!$name || !$country || !$category) {
        http_response_code(400);
        echo json_encode(['error' => 'Champs obligatoires manquants']);
        exit();
    }

    $stmt = $db->prepare('INSERT INTO destinations (name, country, region, description, image, category, price_from, provider_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$name, $country, $region, $description, $image, $category, $price_from, $user['id']]);
    $id   = $db->lastInsertId();

    $stmt = $db->prepare('SELECT * FROM destinations WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode($stmt->fetch());
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
