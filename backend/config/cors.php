<?php
// Supprime l'affichage des erreurs PHP dans la réponse JSON
// (les erreurs/warnings corrompent le JSON et cassent les requêtes Axios)
error_reporting(0);
ini_set('display_errors', '0');

// Configuration des en-têtes CORS pour autoriser les requêtes cross-origin du frontend React

$allowed = [
    'http://localhost:5173',
    'http://localhost',
    'http://127.0.0.1:5173',
];

// Ajouter le domaine de prod depuis .env.local
$envFile = __DIR__ . '/../../.env.local';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$key, $val] = explode('=', $line, 2);
        if (trim($key) === 'FRONTEND_URL') $allowed[] = trim($val);
    }
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed) || preg_match('/^https?:\/\/[a-z0-9\-]+\.ngrok(-free)?\.app$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, ngrok-skip-browser-warning');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
