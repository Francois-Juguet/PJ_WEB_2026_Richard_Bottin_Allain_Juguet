<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

$body = json_decode(file_get_contents('php://input'), true);
$email      = filter_var(trim($body['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$password   = $body['password'] ?? '';
$first_name = htmlspecialchars(trim($body['first_name'] ?? ''));
$last_name  = htmlspecialchars(trim($body['last_name'] ?? ''));
$role       = in_array($body['role'] ?? '', ['traveler', 'provider']) ? $body['role'] : 'traveler';

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit();
}
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Le mot de passe doit faire au moins 6 caractères']);
    exit();
}
if (!$first_name || !$last_name) {
    http_response_code(400);
    echo json_encode(['error' => 'Prénom et nom obligatoires']);
    exit();
}

$db  = (new Database())->connect();
$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Cet email est déjà utilisé']);
    exit();
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $db->prepare('INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$email, $hash, $first_name, $last_name, $role]);
$userId = $db->lastInsertId();

// Notification de bienvenue
$db->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)')
   ->execute([$userId, 'Bienvenue sur VoyageVista !', "Bonjour $first_name, bienvenue sur la plateforme de voyage premium. Explorez nos destinations exclusives.", 'system']);

$token = generateToken([
    'id'    => (int)$userId,
    'email' => $email,
    'role'  => $role,
    'exp'   => time() + 86400 * 7
]);

echo json_encode([
    'token' => $token,
    'user'  => [
        'id'         => (int)$userId,
        'email'      => $email,
        'first_name' => $first_name,
        'last_name'  => $last_name,
        'role'       => $role
    ]
]);
