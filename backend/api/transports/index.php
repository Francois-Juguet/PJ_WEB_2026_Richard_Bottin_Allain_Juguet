<?php
// Gestion des transports : recherche par ville, date, type et classe, création par l'administrateur

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $where  = ['t.places_disponibles > 0'];
    $params = [];

    if (!empty($_GET['type'])) {
        $where[]  = 't.type = ?';
        $params[] = $_GET['type'];
    }
    if (!empty($_GET['from'])) {
        $where[]  = 't.ville_depart LIKE ?';
        $params[] = '%' . $_GET['from'] . '%';
    }
    if (!empty($_GET['to'])) {
        $where[]  = 't.ville_arrivee LIKE ?';
        $params[] = '%' . $_GET['to'] . '%';
    }
    if (!empty($_GET['date'])) {
        $where[]  = 'DATE(t.heure_depart) = ?';
        $params[] = $_GET['date'];
    }
    if (!empty($_GET['class'])) {
        $where[]  = 't.classe = ?';
        $params[] = $_GET['class'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 't.prix <= ?';
        $params[] = (float)$_GET['max_price'];
    }
    if (!empty($_GET['direct'])) {
        $where[]  = 't.est_direct = 1';
    }

    $sort = match ($_GET['sort'] ?? 'price') {
        'duration'   => 'TIMESTAMPDIFF(MINUTE, t.heure_depart, t.heure_arrivee) ASC',
        'departure'  => 't.heure_depart ASC',
        'price_desc' => 't.prix DESC',
        default      => 't.prix ASC'
    };

    $whereSQL = 'WHERE ' . implode(' AND ', $where);
    $sql      = "SELECT t.*, TIMESTAMPDIFF(MINUTE, t.heure_depart, t.heure_arrivee) as duree_minutes FROM transports t $whereSQL ORDER BY $sort";
    $stmt     = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'prestataire']);
    $body = json_decode(file_get_contents('php://input'), true);

    // Correspondance anglais → français pour compatibilité avec le formulaire frontend
    $type            = $body['type']            ?? '';
    $compagnie       = $body['compagnie']       ?? $body['company']         ?? '';
    $ville_depart    = $body['ville_depart']    ?? $body['departure_city']  ?? '';
    $ville_arrivee   = $body['ville_arrivee']   ?? $body['arrival_city']    ?? '';
    $code_depart     = $body['code_depart']     ?? $body['departure_code']  ?? null;
    $code_arrivee    = $body['code_arrivee']    ?? $body['arrival_code']    ?? null;
    $heure_depart    = $body['heure_depart']    ?? $body['departure_time']  ?? '';
    $heure_arrivee   = $body['heure_arrivee']   ?? $body['arrival_time']    ?? '';
    $prix            = (float)($body['prix']    ?? $body['price']           ?? 0);
    $places_dispo    = (int)($body['places_disponibles'] ?? $body['available_seats'] ?? 0);
    $places_total    = (int)($body['places_total']       ?? $body['total_seats']     ?? $places_dispo);
    $classe          = $body['classe']          ?? $body['class_type']      ?? 'economique';
    $est_direct      = (bool)($body['est_direct'] ?? $body['is_direct']    ?? true);
    $escales         = (int)($body['escales']   ?? $body['stops']          ?? 0);

    if (!$type || !$compagnie || !$ville_depart || !$ville_arrivee || !$heure_depart || !$heure_arrivee || !$prix || !$places_dispo) {
        http_response_code(400);
        echo json_encode(['error' => 'Champs obligatoires manquants (type, compagnie, villes, horaires, prix, places)']);
        exit();
    }

    $stmt = $db->prepare('INSERT INTO transports (type, compagnie, ville_depart, ville_arrivee, code_depart, code_arrivee, heure_depart, heure_arrivee, prix, places_disponibles, places_total, classe, est_direct, escales) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $type, $compagnie, $ville_depart, $ville_arrivee,
        $code_depart, $code_arrivee,
        $heure_depart, $heure_arrivee,
        $prix, $places_dispo, $places_total,
        $classe, $est_direct, $escales
    ]);

    echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Transport créé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
