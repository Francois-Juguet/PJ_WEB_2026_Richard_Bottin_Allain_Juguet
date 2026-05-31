<?php
// Vérification et mise à jour des disponibilités d'un hébergement pour une période donnée

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$accId  = (int)($_GET['id'] ?? 0);

if ($method === 'GET') {
    $arrivee = $_GET['check_in']  ?? '';
    $depart  = $_GET['check_out'] ?? '';

    if (!$accId) { http_response_code(400); echo json_encode(['error' => 'ID requis']); exit(); }

    $stmt = $db->prepare('SELECT * FROM hebergements WHERE id = ?');
    $stmt->execute([$accId]);
    $acc = $stmt->fetch();
    if (!$acc) { http_response_code(404); echo json_encode(['error' => 'Hébergement non trouvé']); exit(); }

    if ($arrivee && $depart) {
        $stmt = $db->prepare('SELECT * FROM disponibilites WHERE hebergement_id = ? AND date BETWEEN ? AND ? ORDER BY date');
        $stmt->execute([$accId, $arrivee, $depart]);
        $disponibilites = $stmt->fetchAll();

        // Vérifier si disponible sur toute la période
        $dates   = [];
        $current = new DateTime($arrivee);
        $end     = new DateTime($depart);
        while ($current < $end) {
            $dates[] = $current->format('Y-m-d');
            $current->modify('+1 day');
        }

        $datesReservees = array_column($disponibilites, 'date');
        $estDisponible  = true;
        foreach ($dates as $d) {
            if (in_array($d, $datesReservees)) {
                $dispo = $disponibilites[array_search($d, $datesReservees)];
                if ($dispo['statut'] === 'complet') { $estDisponible = false; break; }
            }
        }

        echo json_encode([
            'hebergement'    => $acc,
            'est_disponible' => $estDisponible,
            'disponibilites' => $disponibilites,
            'nuits'          => count($dates),
            'prix_total'     => count($dates) * $acc['prix_nuit']
        ]);
    } else {
        $stmt = $db->prepare('SELECT * FROM disponibilites WHERE hebergement_id = ? ORDER BY date');
        $stmt->execute([$accId]);
        echo json_encode($stmt->fetchAll());
    }

} elseif ($method === 'POST') {
    $user = requireRole(['admin', 'prestataire']);
    $body = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare('INSERT INTO disponibilites (hebergement_id, date, chambres_disponibles, statut) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE chambres_disponibles = ?, statut = ?');
    $stmt->execute([
        $accId,
        $body['date'],
        (int)$body['chambres_disponibles'],
        $body['statut'] ?? 'disponible',
        (int)$body['chambres_disponibles'],
        $body['statut'] ?? 'disponible'
    ]);

    echo json_encode(['message' => 'Disponibilité mise à jour']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
