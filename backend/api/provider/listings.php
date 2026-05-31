<?php
// Espace prestataire : retourne les hébergements, activités et transports du prestataire connecté

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

$db   = (new Database())->connect();
$user = requireRole(['admin', 'prestataire']);
$id   = $user['id'];

// Hébergements du prestataire
$stmt = $db->prepare('SELECT h.*, d.nom as destination_name FROM hebergements h LEFT JOIN destinations d ON h.destination_id = d.id WHERE h.prestataire_id = ? ORDER BY h.cree_le DESC');
$stmt->execute([$id]);
$hebergements = $stmt->fetchAll();
foreach ($hebergements as &$h) {
    $h['equipements'] = json_decode($h['equipements'] ?? '[]');
    $h['images']      = json_decode($h['images'] ?? '[]');
}
unset($h);

// Activités du prestataire
$stmt = $db->prepare('SELECT a.*, d.nom as destination_name FROM activites a LEFT JOIN destinations d ON a.destination_id = d.id WHERE a.prestataire_id = ? ORDER BY a.cree_le DESC');
$stmt->execute([$id]);
$activites = $stmt->fetchAll();
foreach ($activites as &$a) {
    $a['inclus'] = json_decode($a['inclus'] ?? '[]');
}
unset($a);

// Transports (tous visibles, créés par admin/prestataire)
$stmt = $db->prepare('SELECT * FROM transports ORDER BY cree_le DESC LIMIT 50');
$stmt->execute();
$transports = $stmt->fetchAll();

// Stats
$stmt = $db->prepare('SELECT COUNT(*) FROM hebergements WHERE prestataire_id = ?');
$stmt->execute([$id]);
$nbHeberg = (int)$stmt->fetchColumn();

$stmt = $db->prepare('SELECT COUNT(*) FROM activites WHERE prestataire_id = ?');
$stmt->execute([$id]);
$nbActiv = (int)$stmt->fetchColumn();

$stmt = $db->prepare('SELECT COUNT(*) FROM reservations WHERE statut = "confirme"');
$stmt->execute();
$nbResa = (int)$stmt->fetchColumn();

echo json_encode([
    'accommodations' => $hebergements,
    'activities'     => $activites,
    'transports'     => $transports,
    'stats'          => [
        'accommodations' => $nbHeberg,
        'activities'     => $nbActiv,
        'bookings'       => $nbResa,
    ]
]);
