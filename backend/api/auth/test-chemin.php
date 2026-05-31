<?php
// Fichier de diagnostic — à supprimer après le test
header('Content-Type: application/json');
echo json_encode([
    'fichier_lu' => __FILE__,      // chemin absolu du fichier PHP que Apache lit
    'heure'      => date('H:i:s'), // pour confirmer que c'est en live
]);
