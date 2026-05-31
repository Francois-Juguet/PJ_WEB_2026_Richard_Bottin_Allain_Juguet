<?php
// Gestion des itinéraires de l'utilisateur connecté : liste, création avec transports, hébergements et activités

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT i.*, d.nom as destination_nom, d.image as destination_image, d.pays FROM itineraires i LEFT JOIN destinations d ON i.destination_id = d.id WHERE i.utilisateur_id = ? ORDER BY i.cree_le DESC');
    $stmt->execute([$user['id']]);
    $itineraires = $stmt->fetchAll();

    foreach ($itineraires as &$it) {
        $stmt = $db->prepare('SELECT it.*, t.type, t.compagnie, t.ville_depart, t.ville_arrivee, t.heure_depart, t.heure_arrivee, t.prix as transport_prix FROM itineraire_transports it JOIN transports t ON it.transport_id = t.id WHERE it.itineraire_id = ?');
        $stmt->execute([$it['id']]);
        $it['transports'] = $stmt->fetchAll();

        $stmt = $db->prepare('SELECT ia.*, a.nom, a.type, a.prix_nuit, a.etoiles, a.note FROM itineraire_hebergements ia JOIN hebergements a ON ia.hebergement_id = a.id WHERE ia.itineraire_id = ?');
        $stmt->execute([$it['id']]);
        $it['hebergements'] = $stmt->fetchAll();

        $stmt = $db->prepare('SELECT iact.*, act.nom, act.categorie, act.prix as activite_prix, act.duree_heures, act.image FROM itineraire_activites iact JOIN activites act ON iact.activite_id = act.id WHERE iact.itineraire_id = ?');
        $stmt->execute([$it['id']]);
        $it['activites'] = $stmt->fetchAll();
    }

    echo json_encode($itineraires);

} elseif ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('INSERT INTO itineraires (utilisateur_id, titre, destination_id, date_debut, date_fin, voyageurs, statut) VALUES (?, ?, ?, ?, ?, ?, "brouillon")');
    $stmt->execute([
        $user['id'],
        htmlspecialchars($body['titre'] ?? $body['title'] ?? 'Mon voyage'),
        !empty($body['destination_id']) ? (int)$body['destination_id'] : null,
        $body['date_debut'] ?? $body['start_date'] ?? null,
        $body['date_fin'] ?? $body['end_date'] ?? null,
        (int)($body['voyageurs'] ?? $body['travelers'] ?? 1)
    ]);
    $id = $db->lastInsertId();

    echo json_encode(['id' => (int)$id, 'message' => 'Itinéraire créé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
