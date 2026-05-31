<?php
// Gestion des hébergements : recherche par destination, type, prix, étoiles et capacité

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
        $where[]  = 'a.prix_nuit >= ?';
        $params[] = (float)$_GET['min_price'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 'a.prix_nuit <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    if (!empty($_GET['stars'])) {
        $where[]  = 'a.etoiles >= ?';
        $params[] = (int)$_GET['stars'];
    }
    if (!empty($_GET['capacity'])) {
        $where[]  = 'a.capacite_max >= ?';
        $params[] = (int)$_GET['capacity'];
    }

    $sort = match ($_GET['sort'] ?? 'rating') {
        'price_asc'  => 'a.prix_nuit ASC',
        'price_desc' => 'a.prix_nuit DESC',
        'stars'      => 'a.etoiles DESC',
        default      => 'a.note DESC'
    };

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql      = "SELECT a.*, d.nom as destination_nom, d.pays FROM hebergements a JOIN destinations d ON a.destination_id = d.id $whereSQL ORDER BY $sort";
    $stmt     = $db->prepare($sql);
    $stmt->execute($params);
    $hebergements = $stmt->fetchAll();

    foreach ($hebergements as &$h) {
        $h['equipements'] = json_decode($h['equipements'] ?? '[]');
        $h['images']      = json_decode($h['images'] ?? '[]');
    }

    echo json_encode($hebergements);

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'prestataire']);
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('INSERT INTO hebergements (destination_id, nom, type, description, adresse, prix_nuit, capacite_max, etoiles, equipements, images, prestataire_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        (int)$body['destination_id'],
        htmlspecialchars($body['nom'] ?? $body['name'] ?? ''),
        $body['type'] ?? 'hotel',
        htmlspecialchars($body['description'] ?? ''),
        htmlspecialchars($body['adresse'] ?? $body['address'] ?? ''),
        (float)($body['prix_nuit'] ?? $body['price_per_night'] ?? 0),
        (int)($body['capacite_max'] ?? $body['max_capacity'] ?? 2),
        (int)($body['etoiles'] ?? $body['stars'] ?? 0),
        json_encode($body['equipements'] ?? $body['amenities'] ?? []),
        json_encode($body['images'] ?? []),
        $user['id']
    ]);

    echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Hébergement créé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
