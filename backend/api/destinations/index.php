<?php
// Liste et création des destinations : filtrage par catégorie, pays, prix, vedette et recherche textuelle

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $where  = [];
    $params = [];

    if (!empty($_GET['search'])) {
        $where[]  = '(d.nom LIKE ? OR d.pays LIKE ? OR d.description LIKE ?)';
        $s        = '%' . $_GET['search'] . '%';
        $params   = array_merge($params, [$s, $s, $s]);
    }
    if (!empty($_GET['category'])) {
        $where[]  = 'd.categorie = ?';
        $params[] = $_GET['category'];
    }
    if (!empty($_GET['min_price'])) {
        $where[]  = 'd.prix_depuis >= ?';
        $params[] = (float)$_GET['min_price'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 'd.prix_depuis <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    if (!empty($_GET['featured'])) {
        $where[]  = 'd.est_vedette = 1';
    }
    if (!empty($_GET['country'])) {
        $where[]  = 'd.pays = ?';
        $params[] = $_GET['country'];
    }

    $sort = match ($_GET['sort'] ?? 'featured') {
        'price_asc'  => 'd.prix_depuis ASC',
        'price_desc' => 'd.prix_depuis DESC',
        'rating'     => 'd.note DESC',
        'reviews'    => 'd.nombre_avis DESC',
        default      => 'd.est_vedette DESC, d.note DESC'
    };

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $limit    = min((int)($_GET['limit'] ?? 12), 50);
    $offset   = (int)($_GET['page'] ?? 0) * $limit;

    $sql  = "SELECT d.*, u.prenom as prestataire_nom FROM destinations d LEFT JOIN utilisateurs u ON d.prestataire_id = u.id $whereSQL ORDER BY $sort LIMIT $limit OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $destinations = $stmt->fetchAll();

    $countStmt = $db->prepare("SELECT COUNT(*) FROM destinations d $whereSQL");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    echo json_encode(['data' => $destinations, 'total' => (int)$total, 'limit' => $limit]);

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'prestataire']);
    $body = json_decode(file_get_contents('php://input'), true);

    $nom         = htmlspecialchars(trim($body['nom'] ?? $body['name'] ?? ''));
    $pays        = htmlspecialchars(trim($body['pays'] ?? $body['country'] ?? ''));
    $categorie   = $body['categorie'] ?? $body['category'] ?? '';
    $description = htmlspecialchars($body['description'] ?? '');
    $image       = filter_var($body['image'] ?? '', FILTER_SANITIZE_URL);
    $prix_depuis = (float)($body['prix_depuis'] ?? $body['price_from'] ?? 0);
    $region      = htmlspecialchars(trim($body['region'] ?? ''));

    if (!$nom || !$pays || !$categorie) {
        http_response_code(400);
        echo json_encode(['error' => 'Champs obligatoires manquants']);
        exit();
    }

    $stmt = $db->prepare('INSERT INTO destinations (nom, pays, region, description, image, categorie, prix_depuis, prestataire_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$nom, $pays, $region, $description, $image, $categorie, $prix_depuis, $user['id']]);
    $id   = $db->lastInsertId();

    $stmt = $db->prepare('SELECT * FROM destinations WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode($stmt->fetch());
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
