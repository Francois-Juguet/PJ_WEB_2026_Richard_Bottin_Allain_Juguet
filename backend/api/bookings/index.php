<?php
// Gestion des réservations : liste pour l'utilisateur ou l'admin, création avec confirmation de l'itinéraire

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    if ($user['role'] === 'admin') {
        $stmt = $db->prepare('SELECT b.*, u.prenom, u.nom, u.email, i.titre as titre_voyage, d.nom as destination FROM reservations b JOIN utilisateurs u ON b.utilisateur_id = u.id JOIN itineraires i ON b.itineraire_id = i.id LEFT JOIN destinations d ON i.destination_id = d.id ORDER BY b.cree_le DESC');
        $stmt->execute();
    } else {
        $stmt = $db->prepare('SELECT b.*, i.titre as titre_voyage, d.nom as destination, d.image as destination_image FROM reservations b JOIN itineraires i ON b.itineraire_id = i.id LEFT JOIN destinations d ON i.destination_id = d.id WHERE b.utilisateur_id = ? ORDER BY b.cree_le DESC');
        $stmt->execute([$user['id']]);
    }
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    $body        = json_decode(file_get_contents('php://input'), true);
    $itineraireId = (int)($body['itinerary_id'] ?? $body['itineraire_id'] ?? 0);

    $stmt = $db->prepare('SELECT * FROM itineraires WHERE id = ? AND utilisateur_id = ?');
    $stmt->execute([$itineraireId, $user['id']]);
    $it = $stmt->fetch();
    if (!$it) { http_response_code(404); echo json_encode(['error' => 'Itinéraire non trouvé']); exit(); }
    if ($it['statut'] === 'annule') { http_response_code(400); echo json_encode(['error' => 'Itinéraire annulé']); exit(); }

    // Vérifier qu'il n'y a pas déjà une réservation
    $stmt = $db->prepare('SELECT id FROM reservations WHERE itineraire_id = ? AND statut != "annule"');
    $stmt->execute([$itineraireId]);
    if ($stmt->fetch()) { http_response_code(409); echo json_encode(['error' => 'Réservation déjà existante pour cet itinéraire']); exit(); }

    $reference       = 'VV-' . date('Y') . '-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);
    $prixTotal       = (float)$it['prix_total'];
    $methodePaiement = htmlspecialchars($body['payment_method'] ?? $body['methode_paiement'] ?? 'carte');

    $stmt = $db->prepare('INSERT INTO reservations (utilisateur_id, itineraire_id, reference, prix_total, statut, statut_paiement, methode_paiement) VALUES (?, ?, ?, ?, "confirme", "paye", ?)');
    $stmt->execute([$user['id'], $itineraireId, $reference, $prixTotal, $methodePaiement]);
    $reservationId = $db->lastInsertId();

    // Confirmer l'itinéraire
    $db->prepare('UPDATE itineraires SET statut = "confirme" WHERE id = ?')->execute([$itineraireId]);

    // Notification
    $db->prepare('INSERT INTO notifications (utilisateur_id, titre, message, type, element_id, element_type) VALUES (?, ?, ?, "reservation", ?, "reservation")')->execute([
        $user['id'],
        'Réservation confirmée !',
        "Votre réservation $reference a été confirmée. Total: " . number_format($prixTotal, 2) . "€",
        $reservationId
    ]);

    $stmt = $db->prepare('SELECT * FROM reservations WHERE id = ?');
    $stmt->execute([$reservationId]);
    echo json_encode($stmt->fetch());
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
