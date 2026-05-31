<?php
// Gestion des activités : recherche par destination, catégorie, prix et texte libre

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
        $where[]  = 'a.categorie = ?';
        $params[] = $_GET['category'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 'a.prix <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    if (!empty($_GET['search'])) {
        $where[]  = '(a.nom LIKE ? OR a.description LIKE ?)';
        $s        = '%' . $_GET['search'] . '%';
        $params   = array_merge($params, [$s, $s]);
    }

    $sort = match ($_GET['sort'] ?? 'rating') {
        'price_asc'  => 'a.prix ASC',
        'price_desc' => 'a.prix DESC',
        'duration'   => 'a.duree_heures ASC',
        default      => 'a.note DESC'
    };

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql      = "SELECT a.*, d.nom as destination_nom, d.pays FROM activites a JOIN destinations d ON a.destination_id = d.id $whereSQL ORDER BY $sort";
    $stmt     = $db->prepare($sql);
    $stmt->execute($params);
    $activites = $stmt->fetchAll();

    foreach ($activites as &$act) {
        $act['inclus'] = json_decode($act['inclus'] ?? '[]');
    }

    echo json_encode($activites);

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'prestataire']);
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('INSERT INTO activites (destination_id, nom, categorie, description, prix, duree_heures, participants_max, inclus, image, prestataire_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        (int)$body['destination_id'],
        htmlspecialchars($body['nom'] ?? $body['name'] ?? ''),
        $body['categorie'] ?? $body['category'] ?? 'circuit',
        htmlspecialchars($body['description'] ?? ''),
        (float)($body['prix'] ?? $body['price'] ?? 0),
        (float)($body['duree_heures'] ?? $body['duration_hours'] ?? 2),
        (int)($body['participants_max'] ?? $body['max_participants'] ?? 10),
        json_encode($body['inclus'] ?? $body['included'] ?? []),
        filter_var($body['image'] ?? '', FILTER_SANITIZE_URL),
        $user['id']
    ]);

    echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Activité créée']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
