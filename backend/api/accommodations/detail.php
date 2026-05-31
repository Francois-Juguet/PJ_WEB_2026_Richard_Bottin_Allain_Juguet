<?php
// Mise à jour et suppression d'un hébergement (admin ou prestataire propriétaire)

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireRole(['admin', 'prestataire']);
$id     = (int)($_GET['id'] ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID manquant']);
    exit();
}

$stmt = $db->prepare('SELECT * FROM hebergements WHERE id = ?');
$stmt->execute([$id]);
$hebergement = $stmt->fetch();

if (!$hebergement) {
    http_response_code(404);
    echo json_encode(['error' => 'Hébergement non trouvé']);
    exit();
}

if ($user['role'] !== 'admin' && (int)$hebergement['prestataire_id'] !== (int)$user['id']) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès interdit']);
    exit();
}

if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $stmt = $db->prepare('UPDATE hebergements SET destination_id=?, nom=?, type=?, description=?, adresse=?, prix_nuit=?, capacite_max=?, etoiles=?, equipements=?, images=? WHERE id=?');
    $stmt->execute([
        (int)($body['destination_id']  ?? $hebergement['destination_id']),
        htmlspecialchars($body['nom']  ?? $body['name']           ?? $hebergement['nom']),
        $body['type']                  ?? $hebergement['type'],
        htmlspecialchars($body['description'] ?? $hebergement['description']),
        htmlspecialchars($body['adresse'] ?? $body['address']     ?? $hebergement['adresse']),
        (float)($body['prix_nuit']     ?? $body['price_per_night'] ?? $hebergement['prix_nuit']),
        (int)($body['capacite_max']    ?? $body['max_capacity']    ?? $hebergement['capacite_max']),
        (int)($body['etoiles']         ?? $body['stars']           ?? $hebergement['etoiles']),
        json_encode($body['equipements'] ?? $body['amenities'] ?? json_decode($hebergement['equipements'] ?? '[]')),
        json_encode($body['images']    ?? json_decode($hebergement['images'] ?? '[]')),
        $id
    ]);

    $stmt = $db->prepare('SELECT h.*, d.nom as destination_name FROM hebergements h LEFT JOIN destinations d ON h.destination_id = d.id WHERE h.id = ?');
    $stmt->execute([$id]);
    $updated = $stmt->fetch();
    $updated['equipements'] = json_decode($updated['equipements'] ?? '[]');
    $updated['images']      = json_decode($updated['images'] ?? '[]');
    echo json_encode($updated);

} elseif ($method === 'DELETE') {
    $db->prepare('DELETE FROM hebergements WHERE id = ?')->execute([$id]);
    echo json_encode(['message' => 'Hébergement supprimé']);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
