<?php
// Vide le cache OPcache pour forcer PHP à relire ce fichier
if (function_exists('opcache_invalidate')) {
    opcache_invalidate(__FILE__, true);
}
// Point d'entrée pour l'inscription d'un nouvel utilisateur sur la plateforme VoyageVista

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

// Lecture et décodage du corps JSON — on force un tableau vide si le corps est absent ou invalide
$corps  = file_get_contents('php://input');
$body   = json_decode($corps, true) ?? [];

// Lecture des champs — compatibilité anglais/français pour la migration
$email    = filter_var(trim($body['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$password = $body['password'] ?? $body['mot_de_passe'] ?? '';
$prenom   = htmlspecialchars(trim($body['prenom'] ?? $body['first_name'] ?? ''));
$nom      = htmlspecialchars(trim($body['nom']    ?? $body['last_name']  ?? ''));
$role     = in_array($body['role'] ?? '', ['voyageur', 'prestataire', 'admin'])
            ? $body['role']
            : 'voyageur'; // valeur par défaut si rôle inconnu

// Vérification que le corps JSON a bien été reçu
if (empty($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Corps de requête vide ou JSON invalide', 'recu' => $corps]);
    exit();
}

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
if (!$prenom || !$nom) {
    http_response_code(400);
    echo json_encode([
        'error'  => 'Prénom et nom obligatoires',
        'recu'   => ['prenom' => $prenom, 'nom' => $nom], // debug : montre ce que PHP a reçu
    ]);
    exit();
}

$db   = (new Database())->connect();
$stmt = $db->prepare('SELECT id FROM utilisateurs WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Cet email est déjà utilisé']);
    exit();
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $db->prepare('INSERT INTO utilisateurs (email, mot_de_passe, prenom, nom, role) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$email, $hash, $prenom, $nom, $role]);
$userId = $db->lastInsertId();

// Notification de bienvenue
$db->prepare('INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, ?, ?, ?)')
   ->execute([$userId, 'Bienvenue sur VoyageVista !', "Bonjour $prenom, bienvenue sur la plateforme de voyage premium. Explorez nos destinations exclusives.", 'systeme']);

$token = generateToken([
    'id'    => (int)$userId,
    'email' => $email,
    'role'  => $role,
    'exp'   => time() + 86400 * 7
]);

echo json_encode([
    'token' => $token,
    'user'  => [
        'id'     => (int)$userId,
        'email'  => $email,
        'prenom' => $prenom,
        'nom'    => $nom,
        'role'   => $role
    ]
]);
