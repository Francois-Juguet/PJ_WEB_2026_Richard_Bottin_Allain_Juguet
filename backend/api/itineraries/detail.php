<?php
// Détail d'un itinéraire : ajout/suppression de transports, hébergements et activités, recalcul du prix total

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();
$id     = (int)($_GET['id'] ?? 0);

function getItineraire($db, $id) {
    $stmt = $db->prepare('SELECT i.*, d.nom as destination_nom, d.image as destination_image, d.pays FROM itineraires i LEFT JOIN destinations d ON i.destination_id = d.id WHERE i.id = ?');
    $stmt->execute([$id]);
    $it = $stmt->fetch();
    if (!$it) return null;

    $stmt = $db->prepare('SELECT it.*, t.type, t.compagnie, t.ville_depart, t.ville_arrivee, t.code_depart, t.code_arrivee, t.heure_depart, t.heure_arrivee, t.classe FROM itineraire_transports it JOIN transports t ON it.transport_id = t.id WHERE it.itineraire_id = ?');
    $stmt->execute([$id]);
    $it['transports'] = $stmt->fetchAll();

    $stmt = $db->prepare('SELECT ia.*, a.nom, a.type, a.prix_nuit, a.etoiles, a.note, a.adresse FROM itineraire_hebergements ia JOIN hebergements a ON ia.hebergement_id = a.id WHERE ia.itineraire_id = ?');
    $stmt->execute([$id]);
    $it['hebergements'] = $stmt->fetchAll();

    $stmt = $db->prepare('SELECT iact.*, act.nom, act.categorie, act.prix as activite_prix, act.duree_heures, act.image, act.description FROM itineraire_activites iact JOIN activites act ON iact.activite_id = act.id WHERE iact.itineraire_id = ?');
    $stmt->execute([$id]);
    $it['activites'] = $stmt->fetchAll();

    return $it;
}

function recalcTotal($db, $id) {
    $it    = getItineraire($db, $id);
    $total = 0;
    foreach ($it['transports']   as $t)   $total += $t['prix'] ?? 0;
    foreach ($it['hebergements'] as $a)   $total += $a['prix'] ?? 0;
    foreach ($it['activites']    as $act) $total += $act['prix'] ?? 0;
    $db->prepare('UPDATE itineraires SET prix_total = ? WHERE id = ?')->execute([$total, $id]);
    return $total;
}

if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID requis']); exit(); }

if ($method === 'GET') {
    $it = getItineraire($db, $id);
    if (!$it || $it['utilisateur_id'] != $user['id']) { http_response_code(404); echo json_encode(['error' => 'Non trouvé']); exit(); }
    echo json_encode($it);

} elseif ($method === 'PUT') {
    $it = getItineraire($db, $id);
    if (!$it || $it['utilisateur_id'] != $user['id']) { http_response_code(404); echo json_encode(['error' => 'Non trouvé']); exit(); }
    $body   = json_decode(file_get_contents('php://input'), true);
    $action = $body['action'] ?? '';

    if ($action === 'add_transport') {
        $transportId = (int)$body['transport_id'];
        $stmt = $db->prepare('SELECT prix FROM transports WHERE id = ?');
        $stmt->execute([$transportId]);
        $transport = $stmt->fetch();
        if (!$transport) { http_response_code(404); echo json_encode(['error' => 'Transport non trouvé']); exit(); }

        $passagers = (int)($body['passagers'] ?? $body['passengers'] ?? $it['voyageurs']);
        $prix      = $transport['prix'] * $passagers;
        $sens      = $body['sens'] ?? $body['direction'] ?? 'aller';
        $db->prepare('INSERT INTO itineraire_transports (itineraire_id, transport_id, sens, passagers, prix) VALUES (?, ?, ?, ?, ?)')->execute([
            $id, $transportId, $sens, $passagers, $prix
        ]);

        // Notification
        $db->prepare('INSERT INTO notifications (utilisateur_id, titre, message, type, element_id, element_type) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $user['id'], 'Transport ajouté', 'Un transport a été ajouté à votre itinéraire.', 'transport', $id, 'itineraire'
        ]);

    } elseif ($action === 'add_accommodation') {
        $hebergId = (int)$body['accommodation_id'];
        $arrivee  = $body['check_in'];
        $depart   = $body['check_out'];
        $chambres = (int)($body['rooms'] ?? 1);

        $stmt = $db->prepare('SELECT prix_nuit FROM hebergements WHERE id = ?');
        $stmt->execute([$hebergId]);
        $acc = $stmt->fetch();
        if (!$acc) { http_response_code(404); echo json_encode(['error' => 'Hébergement non trouvé']); exit(); }

        $nuits = (new DateTime($arrivee))->diff(new DateTime($depart))->days;
        $prix  = $acc['prix_nuit'] * $nuits * $chambres;

        $db->prepare('INSERT INTO itineraire_hebergements (itineraire_id, hebergement_id, arrivee, depart, chambres, prix) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $id, $hebergId, $arrivee, $depart, $chambres, $prix
        ]);

        // Marquer disponibilité
        $current = new DateTime($arrivee);
        $end     = new DateTime($depart);
        while ($current < $end) {
            $date = $current->format('Y-m-d');
            $db->prepare('INSERT INTO disponibilites (hebergement_id, date, chambres_disponibles, statut) VALUES (?, ?, ?, "partiel") ON DUPLICATE KEY UPDATE chambres_disponibles = GREATEST(chambres_disponibles - ?, 0), statut = IF(chambres_disponibles - ? <= 0, "complet", "partiel")')->execute([$hebergId, $date, $chambres, $chambres, $chambres]);
            $current->modify('+1 day');
        }

        $db->prepare('INSERT INTO notifications (utilisateur_id, titre, message, type, element_id, element_type) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $user['id'], 'Hébergement ajouté', 'Un hébergement a été ajouté à votre itinéraire.', 'hebergement', $id, 'itineraire'
        ]);

    } elseif ($action === 'add_activity') {
        $actId        = (int)$body['activity_id'];
        $participants = (int)($body['participants'] ?? $it['voyageurs']);

        $stmt = $db->prepare('SELECT prix FROM activites WHERE id = ?');
        $stmt->execute([$actId]);
        $act = $stmt->fetch();
        if (!$act) { http_response_code(404); echo json_encode(['error' => 'Activité non trouvée']); exit(); }

        $prix = $act['prix'] * $participants;
        $db->prepare('INSERT INTO itineraire_activites (itineraire_id, activite_id, date_planifiee, heure_planifiee, participants, prix) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $id, $actId, $body['scheduled_date'] ?? null, $body['scheduled_time'] ?? '09:00:00', $participants, $prix
        ]);

        $db->prepare('INSERT INTO notifications (utilisateur_id, titre, message, type, element_id, element_type) VALUES (?, ?, ?, ?, ?, ?)')->execute([
            $user['id'], 'Activité ajoutée', 'Une activité a été ajoutée à votre itinéraire.', 'activite', $id, 'itineraire'
        ]);

    } elseif ($action === 'update_info') {
        $allowed = ['titre', 'destination_id', 'date_debut', 'date_fin', 'voyageurs'];
        $updates = [];
        $params  = [];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $updates[] = "$f = ?";
                $params[]  = $body[$f];
            }
        }
        if ($updates) {
            $params[] = $id;
            $db->prepare('UPDATE itineraires SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
        }

    } elseif ($action === 'remove_transport') {
        $db->prepare('DELETE FROM itineraire_transports WHERE id = ? AND itineraire_id = ?')->execute([(int)$body['item_id'], $id]);

    } elseif ($action === 'remove_accommodation') {
        $db->prepare('DELETE FROM itineraire_hebergements WHERE id = ? AND itineraire_id = ?')->execute([(int)$body['item_id'], $id]);

    } elseif ($action === 'remove_activity') {
        $db->prepare('DELETE FROM itineraire_activites WHERE id = ? AND itineraire_id = ?')->execute([(int)$body['item_id'], $id]);
    }

    $total   = recalcTotal($db, $id);
    $updated = getItineraire($db, $id);
    echo json_encode($updated);

} elseif ($method === 'DELETE') {
    $stmt = $db->prepare('SELECT utilisateur_id FROM itineraires WHERE id = ?');
    $stmt->execute([$id]);
    $it = $stmt->fetch();
    if (!$it || $it['utilisateur_id'] != $user['id']) { http_response_code(404); echo json_encode(['error' => 'Non trouvé']); exit(); }
    $db->prepare('DELETE FROM itineraires WHERE id = ?')->execute([$id]);
    echo json_encode(['message' => 'Itinéraire supprimé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
