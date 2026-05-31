<?php
// Suppression d'un transport (admin uniquement)

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db     = (new Database())->connect();
$method = $_SERVER['REQUEST_METHOD'];
$user   = requireRole('admin');
$id     = (int)($_GET['id'] ?? 0);

if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID manquant']); exit(); }

$stmt = $db->prepare('SELECT id FROM transports WHERE id = ?');
$stmt->execute([$id]);
if (!$stmt->fetch()) { http_response_code(404); echo json_encode(['error' => 'Transport non trouvé']); exit(); }

if ($method === 'DELETE') {
    $db->prepare('DELETE FROM transports WHERE id = ?')->execute([$id]);
    echo json_encode(['message' => 'Transport supprimé']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
