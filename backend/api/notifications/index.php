<?php
// Gestion des notifications de l'utilisateur : lecture, marquage comme lues et suppression

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth();

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT * FROM notifications WHERE utilisateur_id = ? ORDER BY cree_le DESC LIMIT 50');
    $stmt->execute([$user['id']]);
    $notifs = $stmt->fetchAll();

    $unreadStmt = $db->prepare('SELECT COUNT(*) FROM notifications WHERE utilisateur_id = ? AND est_lu = 0');
    $unreadStmt->execute([$user['id']]);
    $nonLues = $unreadStmt->fetchColumn();

    echo json_encode(['notifications' => $notifs, 'nombre_non_lues' => (int)$nonLues]);

} elseif ($method === 'PUT') {
    $body   = json_decode(file_get_contents('php://input'), true);
    $action = $body['action'] ?? 'mark_read';

    if ($action === 'mark_all_read') {
        $db->prepare('UPDATE notifications SET est_lu = 1 WHERE utilisateur_id = ?')->execute([$user['id']]);
        echo json_encode(['message' => 'Toutes les notifications marquées comme lues']);
    } elseif ($action === 'mark_read' && !empty($body['id'])) {
        $db->prepare('UPDATE notifications SET est_lu = 1 WHERE id = ? AND utilisateur_id = ?')->execute([(int)$body['id'], $user['id']]);
        echo json_encode(['message' => 'Notification marquée comme lue']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Action invalide']);
    }

} elseif ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!empty($body['id'])) {
        $db->prepare('DELETE FROM notifications WHERE id = ? AND utilisateur_id = ?')->execute([(int)$body['id'], $user['id']]);
    } else {
        $db->prepare('DELETE FROM notifications WHERE utilisateur_id = ?')->execute([$user['id']]);
    }
    echo json_encode(['message' => 'Notification(s) supprimée(s)']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
