<?php
// Détail d'une destination : hébergements, activités et avis associés, mise à jour et suppression

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$id     = (int)($_GET['id'] ?? 0);

if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID requis']); exit(); }

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT d.*, u.prenom as prestataire_nom FROM destinations d LEFT JOIN utilisateurs u ON d.prestataire_id = u.id WHERE d.id = ?');
    $stmt->execute([$id]);
    $dest = $stmt->fetch();
    if (!$dest) { http_response_code(404); echo json_encode(['error' => 'Destination non trouvée']); exit(); }

    // Hébergements
    $stmt = $db->prepare('SELECT * FROM hebergements WHERE destination_id = ? ORDER BY note DESC');
    $stmt->execute([$id]);
    $dest['hebergements'] = $stmt->fetchAll();

    // Activités
    $stmt = $db->prepare('SELECT * FROM activites WHERE destination_id = ? ORDER BY note DESC');
    $stmt->execute([$id]);
    $dest['activites'] = $stmt->fetchAll();

    // Avis
    $stmt = $db->prepare('SELECT r.*, u.prenom, u.nom FROM avis r JOIN utilisateurs u ON r.utilisateur_id = u.id WHERE r.type_element = "destination" AND r.element_id = ? ORDER BY r.cree_le DESC LIMIT 10');
    $stmt->execute([$id]);
    $dest['avis'] = $stmt->fetchAll();

    echo json_encode($dest);

} elseif ($method === 'PUT') {
    $user = requireRole(['admin', 'prestataire']);
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('SELECT * FROM destinations WHERE id = ?');
    $stmt->execute([$id]);
    $dest = $stmt->fetch();
    if (!$dest) { http_response_code(404); echo json_encode(['error' => 'Non trouvée']); exit(); }
    if ($user['role'] !== 'admin' && $dest['prestataire_id'] != $user['id']) {
        http_response_code(403); echo json_encode(['error' => 'Accès interdit']); exit();
    }

    $fields  = ['nom', 'pays', 'region', 'description', 'image', 'categorie', 'prix_depuis', 'est_vedette'];
    $updates = [];
    $params  = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $updates[] = "$f = ?";
            $params[]  = $f === 'est_vedette' ? (bool)$body[$f] : $body[$f];
        }
    }
    if ($updates) {
        $params[] = $id;
        $db->prepare('UPDATE destinations SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
    }

    $stmt = $db->prepare('SELECT * FROM destinations WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode($stmt->fetch());

} elseif ($method === 'DELETE') {
    requireRole('admin');
    $db->prepare('DELETE FROM destinations WHERE id = ?')->execute([$id]);
    echo json_encode(['message' => 'Destination supprimée']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
