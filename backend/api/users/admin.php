<?php
// Gestion des utilisateurs par l'admin : liste complète et suppression

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
requireRole('admin');

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT id, email, prenom, nom, role, telephone, cree_le FROM utilisateurs ORDER BY cree_le DESC');
    $stmt->execute();
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID manquant']); exit(); }

    $stmt = $db->prepare('SELECT id, role FROM utilisateurs WHERE id = ?');
    $stmt->execute([$id]);
    $u = $stmt->fetch();
    if (!$u) { http_response_code(404); echo json_encode(['error' => 'Utilisateur non trouvé']); exit(); }
    if ($u['role'] === 'admin') { http_response_code(403); echo json_encode(['error' => 'Impossible de supprimer un administrateur']); exit(); }

    $db->prepare('DELETE FROM utilisateurs WHERE id = ?')->execute([$id]);
    echo json_encode(['message' => 'Utilisateur supprimé']);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
