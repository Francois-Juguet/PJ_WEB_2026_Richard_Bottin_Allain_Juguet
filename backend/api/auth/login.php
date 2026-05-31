<?php
// Point d'entrée pour l'authentification des utilisateurs : connexion et génération du token JWT

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

$body     = json_decode(file_get_contents('php://input'), true);
$email    = filter_var(trim($body['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$password = $body['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Email et mot de passe requis']);
    exit();
}

$db   = (new Database())->connect();
$stmt = $db->prepare('SELECT * FROM utilisateurs WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['mot_de_passe'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Identifiants incorrects']);
    exit();
}

$token = generateToken([
    'id'    => (int)$user['id'],
    'email' => $user['email'],
    'role'  => $user['role'],
    'exp'   => time() + 86400 * 7
]);

unset($user['mot_de_passe']);
echo json_encode(['token' => $token, 'user' => $user]);
