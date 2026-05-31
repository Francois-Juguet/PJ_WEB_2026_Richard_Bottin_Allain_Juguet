<?php
// Middleware d'authentification : génération et vérification des tokens JWT, protection des routes

function generateToken($payload) {
    $header  = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode($payload));
    $secret  = 'VoyageVista_Secret_2026_!@#$';
    $sig     = base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
    return "$header.$payload.$sig";
}

function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$header, $payload, $sig] = $parts;
    $secret   = 'VoyageVista_Secret_2026_!@#$';
    $expected = base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
    if (!hash_equals($expected, $sig)) return false;
    $data = json_decode(base64_decode($payload), true);
    if (isset($data['exp']) && $data['exp'] < time()) return false;
    return $data;
}

function requireAuth() {
    $headers = getallheaders();
    $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Token manquant']);
        exit();
    }
    $token = substr($auth, 7);
    $data  = verifyToken($token);
    if (!$data) {
        http_response_code(401);
        echo json_encode(['error' => 'Token invalide ou expiré']);
        exit();
    }
    return $data;
}

function requireRole($roles) {
    $user = requireAuth();
    if (!in_array($user['role'], (array)$roles)) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès interdit']);
        exit();
    }
    return $user;
}
