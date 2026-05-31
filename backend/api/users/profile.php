<?php
// Profil utilisateur : consultation et mise à jour des informations personnelles et du mot de passe

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT id, email, prenom, nom, role, avatar, telephone, cree_le FROM utilisateurs WHERE id = ?');
    $stmt->execute([$user['id']]);
    $profil = $stmt->fetch();

    // Statistiques
    $stmt = $db->prepare('SELECT COUNT(*) FROM reservations WHERE utilisateur_id = ? AND statut = "confirme"');
    $stmt->execute([$user['id']]);
    $profil['nombre_reservations'] = (int)$stmt->fetchColumn();

    $stmt = $db->prepare('SELECT COUNT(*) FROM itineraires WHERE utilisateur_id = ?');
    $stmt->execute([$user['id']]);
    $profil['nombre_itineraires'] = (int)$stmt->fetchColumn();

    $stmt = $db->prepare('SELECT COUNT(*) FROM favoris WHERE utilisateur_id = ?');
    $stmt->execute([$user['id']]);
    $profil['nombre_favoris'] = (int)$stmt->fetchColumn();

    echo json_encode($profil);

} elseif ($method === 'PUT') {
    $body    = json_decode(file_get_contents('php://input'), true);
    $allowed = ['prenom', 'nom', 'telephone'];
    $updates = [];
    $params  = [];

    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $updates[] = "$f = ?";
            $params[]  = htmlspecialchars(trim($body[$f]));
        }
    }

    if (!empty($body['mot_de_passe'] ?? $body['password'] ?? '')) {
        $mdp = $body['mot_de_passe'] ?? $body['password'];
        if (strlen($mdp) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Mot de passe trop court']);
            exit();
        }
        $updates[] = 'mot_de_passe = ?';
        $params[]  = password_hash($mdp, PASSWORD_BCRYPT);
    }

    if ($updates) {
        $params[] = $user['id'];
        $db->prepare('UPDATE utilisateurs SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
    }

    $stmt = $db->prepare('SELECT id, email, prenom, nom, role, avatar, telephone, cree_le FROM utilisateurs WHERE id = ?');
    $stmt->execute([$user['id']]);
    echo json_encode($stmt->fetch());
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
