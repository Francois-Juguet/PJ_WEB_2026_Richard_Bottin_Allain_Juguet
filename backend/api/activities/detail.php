<?php
// Mise à jour et suppression d'une activité (admin ou prestataire propriétaire)

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

$stmt = $db->prepare('SELECT * FROM activites WHERE id = ?');
$stmt->execute([$id]);
$activite = $stmt->fetch();

if (!$activite) {
    http_response_code(404);
    echo json_encode(['error' => 'Activité non trouvée']);
    exit();
}

if ($user['role'] !== 'admin' && (int)$activite['prestataire_id'] !== (int)$user['id']) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès interdit']);
    exit();
}

if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $stmt = $db->prepare('UPDATE activites SET destination_id=?, nom=?, categorie=?, description=?, prix=?, duree_heures=?, participants_max=?, inclus=?, image=? WHERE id=?');
    $stmt->execute([
        (int)($body['destination_id']  ?? $activite['destination_id']),
        htmlspecialchars($body['nom']  ?? $body['name']           ?? $activite['nom']),
        $body['categorie']             ?? $body['category']        ?? $activite['categorie'],
        htmlspecialchars($body['description'] ?? $activite['description']),
        (float)($body['prix']          ?? $body['price']           ?? $activite['prix']),
        (float)($body['duree_heures']  ?? $body['duration_hours']  ?? $activite['duree_heures']),
        (int)($body['participants_max'] ?? $body['max_participants'] ?? $activite['participants_max']),
        json_encode($body['inclus']    ?? $body['included'] ?? json_decode($activite['inclus'] ?? '[]')),
        filter_var($body['image'] ?? $activite['image'], FILTER_SANITIZE_URL),
        $id
    ]);

    $stmt = $db->prepare('SELECT a.*, d.nom as destination_name FROM activites a LEFT JOIN destinations d ON a.destination_id = d.id WHERE a.id = ?');
    $stmt->execute([$id]);
    $updated = $stmt->fetch();
    $updated['inclus'] = json_decode($updated['inclus'] ?? '[]');
    echo json_encode($updated);

} elseif ($method === 'DELETE') {
    $db->prepare('DELETE FROM activites WHERE id = ?')->execute([$id]);
    echo json_encode(['message' => 'Activité supprimée']);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
