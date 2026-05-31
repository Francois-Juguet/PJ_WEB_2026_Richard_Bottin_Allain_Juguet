<?php
// Gestion des favoris de l'utilisateur : liste par type (destinations, hébergements, activités), ajout et suppression

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    $resultats = [];

    // Destinations favorites
    $stmt = $db->prepare('
        SELECT f.id as favori_id, f.type_element, f.element_id, f.cree_le,
               d.nom as nom_element, d.image, d.pays as localisation,
               d.prix_depuis as prix, d.note
        FROM favoris f
        JOIN destinations d ON f.element_id = d.id
        WHERE f.utilisateur_id = ? AND f.type_element = "destination"
        ORDER BY f.cree_le DESC');
    $stmt->execute([$user['id']]);
    $resultats = array_merge($resultats, $stmt->fetchAll());

    // Hébergements favoris
    $stmt = $db->prepare('
        SELECT f.id as favori_id, f.type_element, f.element_id, f.cree_le,
               a.nom as nom_element, a.image,
               CONCAT(COALESCE(d.nom, ""), IF(d.pays IS NOT NULL, CONCAT(", ", d.pays), "")) as localisation,
               a.prix_nuit as prix, a.note
        FROM favoris f
        JOIN hebergements a ON f.element_id = a.id
        LEFT JOIN destinations d ON a.destination_id = d.id
        WHERE f.utilisateur_id = ? AND f.type_element = "hebergement"
        ORDER BY f.cree_le DESC');
    $stmt->execute([$user['id']]);
    $resultats = array_merge($resultats, $stmt->fetchAll());

    // Activités favorites
    $stmt = $db->prepare('
        SELECT f.id as favori_id, f.type_element, f.element_id, f.cree_le,
               act.nom as nom_element, act.image,
               COALESCE(d.nom, "") as localisation,
               act.prix, act.note
        FROM favoris f
        JOIN activites act ON f.element_id = act.id
        LEFT JOIN destinations d ON act.destination_id = d.id
        WHERE f.utilisateur_id = ? AND f.type_element = "activite"
        ORDER BY f.cree_le DESC');
    $stmt->execute([$user['id']]);
    $resultats = array_merge($resultats, $stmt->fetchAll());

    usort($resultats, function($a, $b) {
        return strtotime($b['cree_le']) - strtotime($a['cree_le']);
    });
    echo json_encode($resultats);

} elseif ($method === 'POST') {
    $body       = json_decode(file_get_contents('php://input'), true);
    $typeElement = in_array($body['type_element'] ?? $body['entity_type'] ?? '', ['destination', 'hebergement', 'activite'])
        ? ($body['type_element'] ?? $body['entity_type'])
        : null;
    $elementId  = (int)($body['element_id'] ?? $body['entity_id'] ?? 0);

    if (!$typeElement || !$elementId) { http_response_code(400); echo json_encode(['error' => 'Données invalides']); exit(); }

    $stmt = $db->prepare('SELECT id FROM favoris WHERE utilisateur_id = ? AND type_element = ? AND element_id = ?');
    $stmt->execute([$user['id'], $typeElement, $elementId]);
    $existant = $stmt->fetch();

    if ($existant) {
        $db->prepare('DELETE FROM favoris WHERE id = ?')->execute([$existant['id']]);
        echo json_encode(['en_favori' => false, 'message' => 'Retiré des favoris']);
    } else {
        $db->prepare('INSERT INTO favoris (utilisateur_id, type_element, element_id) VALUES (?, ?, ?)')->execute([$user['id'], $typeElement, $elementId]);
        echo json_encode(['en_favori' => true, 'message' => 'Ajouté aux favoris']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
