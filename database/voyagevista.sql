-- ============================================================
-- VoyageVista — Base de données complète en français
-- Plateforme de voyage premium
-- ============================================================
-- Correspondance anglais → français des noms de tables :
--   users                     → utilisateurs
--   accommodations            → hebergements
--   accommodation_availability→ disponibilites
--   activities                → activites
--   itineraries               → itineraires
--   itinerary_transports      → itineraire_transports
--   itinerary_accommodations  → itineraire_hebergements
--   itinerary_activities      → itineraire_activites
--   bookings                  → reservations
--   reviews                   → avis
--   favorites                 → favoris
-- ============================================================

CREATE DATABASE IF NOT EXISTS voyagevista CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voyagevista;

SET FOREIGN_KEY_CHECKS = 0;

-- ── Suppression dans l'ordre inverse des dépendances ──
DROP TABLE IF EXISTS favoris;
DROP TABLE IF EXISTS avis;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS itineraire_activites;
DROP TABLE IF EXISTS itineraire_hebergements;
DROP TABLE IF EXISTS itineraire_transports;
DROP TABLE IF EXISTS itineraires;
DROP TABLE IF EXISTS disponibilites;
DROP TABLE IF EXISTS activites;
DROP TABLE IF EXISTS hebergements;
DROP TABLE IF EXISTS transports;
DROP TABLE IF EXISTS destinations;
DROP TABLE IF EXISTS utilisateurs;

-- ============================================================
-- TABLE : utilisateurs
-- Stocke tous les comptes (voyageurs, prestataires, admins)
-- ============================================================
CREATE TABLE utilisateurs (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    email        VARCHAR(255) UNIQUE NOT NULL,         -- adresse email unique (identifiant de connexion)
    mot_de_passe VARCHAR(255) NOT NULL,                -- hashé en bcrypt
    prenom       VARCHAR(100) NOT NULL,
    nom          VARCHAR(100) NOT NULL,
    role         ENUM('admin', 'prestataire', 'voyageur') DEFAULT 'voyageur',
    avatar       VARCHAR(255),
    telephone    VARCHAR(20),
    cree_le      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE : destinations
-- Lieux de voyage disponibles sur la plateforme
-- ============================================================
CREATE TABLE destinations (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    nom          VARCHAR(255) NOT NULL,
    pays         VARCHAR(100) NOT NULL,
    region       VARCHAR(100),
    description  TEXT,
    image        VARCHAR(500),
    categorie    ENUM('beach', 'mountain', 'city', 'nature', 'culture', 'adventure', 'island', 'road_trip') NOT NULL,
    prix_depuis  DECIMAL(10,2),                        -- prix minimum d'accès à la destination
    note         DECIMAL(3,2) DEFAULT 0,               -- note moyenne sur 5
    nombre_avis  INT DEFAULT 0,
    est_vedette  BOOLEAN DEFAULT FALSE,                -- mis en avant sur la page d'accueil
    prestataire_id INT,
    cree_le      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prestataire_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE : transports
-- Vols, trains, bus, ferries disponibles
-- ============================================================
CREATE TABLE transports (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    type             ENUM('vol', 'train', 'bus', 'voiture', 'ferry') NOT NULL,
    compagnie        VARCHAR(100) NOT NULL,
    ville_depart     VARCHAR(100) NOT NULL,
    ville_arrivee    VARCHAR(100) NOT NULL,
    code_depart      VARCHAR(10),                      -- code aéroport (ex: CDG)
    code_arrivee     VARCHAR(10),                      -- code aéroport (ex: MLE)
    heure_depart     DATETIME NOT NULL,
    heure_arrivee    DATETIME NOT NULL,
    prix             DECIMAL(10,2) NOT NULL,
    places_disponibles INT NOT NULL,
    places_total     INT NOT NULL,
    classe           ENUM('economique', 'affaires', 'premiere') DEFAULT 'economique',
    est_direct       BOOLEAN DEFAULT TRUE,
    escales          INT DEFAULT 0,
    logo             VARCHAR(255),
    cree_le          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE : hebergements
-- Hôtels, villas, appartements liés à une destination
-- ============================================================
CREATE TABLE hebergements (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    destination_id INT NOT NULL,
    nom            VARCHAR(255) NOT NULL,
    type           ENUM('hotel', 'villa', 'appartement', 'auberge', 'resort') NOT NULL,
    description    TEXT,
    adresse        VARCHAR(255),
    prix_nuit      DECIMAL(10,2) NOT NULL,             -- prix par nuit et par chambre
    capacite_max   INT NOT NULL,                       -- nombre maximum de personnes
    etoiles        INT DEFAULT 0,
    note           DECIMAL(3,2) DEFAULT 0,
    nombre_avis    INT DEFAULT 0,
    equipements    JSON,                               -- liste des équipements (piscine, spa…)
    images         JSON,                               -- tableau d'URLs d'images
    prestataire_id INT,
    cree_le        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    FOREIGN KEY (prestataire_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE : disponibilites
-- Disponibilité des chambres par date pour chaque hébergement
-- ============================================================
CREATE TABLE disponibilites (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    hebergement_id  INT NOT NULL,
    date            DATE NOT NULL,
    chambres_dispo  INT NOT NULL,                      -- nombre de chambres disponibles ce jour
    statut          ENUM('disponible', 'partiel', 'complet') DEFAULT 'disponible',
    FOREIGN KEY (hebergement_id) REFERENCES hebergements(id) ON DELETE CASCADE,
    UNIQUE KEY unicite_dispo (hebergement_id, date)
);

-- ============================================================
-- TABLE : activites
-- Excursions, ateliers, visites liés à une destination
-- ============================================================
CREATE TABLE activites (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    destination_id  INT NOT NULL,
    nom             VARCHAR(255) NOT NULL,
    categorie       ENUM('aventure', 'culture', 'nature', 'bien_etre', 'gastronomie', 'famille', 'circuit') NOT NULL,
    description     TEXT,
    prix            DECIMAL(10,2) NOT NULL,            -- prix par personne
    duree_heures    DECIMAL(4,1),
    participants_max INT,
    note            DECIMAL(3,2) DEFAULT 0,
    nombre_avis     INT DEFAULT 0,
    inclus          JSON,                              -- liste de ce qui est inclus dans le prix
    image           VARCHAR(500),
    prestataire_id  INT,
    cree_le         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    FOREIGN KEY (prestataire_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE : itineraires
-- Voyage planifié par un utilisateur (contient des transports,
-- hébergements et activités via les tables de liaison)
-- ============================================================
CREATE TABLE itineraires (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    titre          VARCHAR(255) DEFAULT 'Mon voyage',
    destination_id INT,
    date_debut     DATE,
    date_fin       DATE,
    voyageurs      INT DEFAULT 1,
    prix_total     DECIMAL(10,2) DEFAULT 0,
    statut         ENUM('brouillon', 'confirme', 'annule') DEFAULT 'brouillon',
    cree_le        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE : itineraire_transports
-- Transports ajoutés à un itinéraire
-- ============================================================
CREATE TABLE itineraire_transports (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    itineraire_id  INT NOT NULL,
    transport_id   INT NOT NULL,
    sens           ENUM('aller', 'retour') DEFAULT 'aller',
    passagers      INT DEFAULT 1,
    prix           DECIMAL(10,2),
    FOREIGN KEY (itineraire_id) REFERENCES itineraires(id) ON DELETE CASCADE,
    FOREIGN KEY (transport_id)  REFERENCES transports(id)  ON DELETE CASCADE
);

-- ============================================================
-- TABLE : itineraire_hebergements
-- Hébergements réservés dans un itinéraire
-- ============================================================
CREATE TABLE itineraire_hebergements (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    itineraire_id  INT NOT NULL,
    hebergement_id INT NOT NULL,
    arrivee        DATE NOT NULL,                      -- date d'arrivée (check-in)
    depart         DATE NOT NULL,                      -- date de départ (check-out)
    chambres       INT DEFAULT 1,
    prix           DECIMAL(10,2),
    FOREIGN KEY (itineraire_id)  REFERENCES itineraires(id)  ON DELETE CASCADE,
    FOREIGN KEY (hebergement_id) REFERENCES hebergements(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE : itineraire_activites
-- Activités planifiées dans un itinéraire
-- ============================================================
CREATE TABLE itineraire_activites (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    itineraire_id  INT NOT NULL,
    activite_id    INT NOT NULL,
    date_planifiee DATE,
    heure_planifiee TIME DEFAULT '09:00:00',
    participants   INT DEFAULT 1,
    prix           DECIMAL(10,2),
    FOREIGN KEY (itineraire_id) REFERENCES itineraires(id) ON DELETE CASCADE,
    FOREIGN KEY (activite_id)   REFERENCES activites(id)   ON DELETE CASCADE
);

-- ============================================================
-- TABLE : reservations
-- Réservations finalisées (itinéraire confirmé + paiement)
-- ============================================================
CREATE TABLE reservations (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id   INT NOT NULL,
    itineraire_id    INT NOT NULL,
    reference        VARCHAR(20) UNIQUE NOT NULL,      -- ex: VV-2026-00001
    prix_total       DECIMAL(10,2) NOT NULL,
    statut           ENUM('en_attente', 'confirme', 'annule', 'termine') DEFAULT 'en_attente',
    statut_paiement  ENUM('en_attente', 'paye', 'rembourse') DEFAULT 'en_attente',
    methode_paiement VARCHAR(50),
    notes            TEXT,
    cree_le          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (itineraire_id)  REFERENCES itineraires(id)  ON DELETE CASCADE
);

-- ============================================================
-- TABLE : notifications
-- Messages système envoyés aux utilisateurs
-- ============================================================
CREATE TABLE notifications (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    titre          VARCHAR(255) NOT NULL,
    message        TEXT NOT NULL,
    type           ENUM('reservation', 'transport', 'hebergement', 'activite', 'promotion', 'systeme') DEFAULT 'systeme',
    est_lu         BOOLEAN DEFAULT FALSE,
    element_id     INT,                                -- id de l'élément lié (réservation, etc.)
    element_type   VARCHAR(50),
    cree_le        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE : avis
-- Notes et commentaires laissés par les utilisateurs
-- ============================================================
CREATE TABLE avis (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    type_element ENUM('destination', 'hebergement', 'activite', 'transport') NOT NULL,
    element_id   INT NOT NULL,
    note         INT NOT NULL,                         -- note de 1 à 5
    commentaire  TEXT,
    cree_le      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT verif_note CHECK (note BETWEEN 1 AND 5)
);

-- ============================================================
-- TABLE : favoris
-- Destinations, hébergements et activités mis en favori
-- ============================================================
CREATE TABLE favoris (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    type_element   ENUM('destination', 'hebergement', 'activite') NOT NULL,
    element_id     INT NOT NULL,
    cree_le        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    UNIQUE KEY unicite_favori (utilisateur_id, type_element, element_id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DONNÉES DE DÉMONSTRATION
-- ============================================================

-- Utilisateurs (mot de passe: "password" hashé en bcrypt)
INSERT INTO utilisateurs (email, mot_de_passe, prenom, nom, role) VALUES
('admin@voyagevista.com',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alexandre', 'Beaumont',  'admin'),
('provider@voyagevista.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sophie',    'Laurent',   'prestataire'),
('traveler@voyagevista.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marc',      'Dubois',    'voyageur');

-- Destinations
INSERT INTO destinations (nom, pays, region, description, image, categorie, prix_depuis, note, nombre_avis, est_vedette) VALUES
('Maldives',    'Maldives',            'Océan Indien',      'Paradis tropical avec eaux cristallines et bungalows sur pilotis.',                                                          'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800', 'beach',     2499.00, 4.9, 342, TRUE),
('Santorini',   'Grèce',               'Cyclades',          'L\'île emblématique avec ses maisons blanches et ses couchers de soleil légendaires.',                                       'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', 'island',    1249.00, 4.8, 289, TRUE),
('Bali',        'Indonésie',           'Asie du Sud-Est',   'L\'île des dieux : temples anciens, rizières en terrasses et plages de sable fin.',                                         'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'culture',   899.00,  4.7, 456, TRUE),
('Dubaï',       'Émirats Arabes Unis', 'Moyen-Orient',      'La ville du futur allie modernité époustouflante et traditions arabes.',                                                     'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'city',      1599.00, 4.8, 278, TRUE),
('Kyoto',       'Japon',               'Kansai',            'Ancienne capitale impériale, Kyoto préserve l\'âme du Japon traditionnel.',                                                  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', 'culture',   1899.00, 4.9, 312, TRUE),
('Amalfi',      'Italie',              'Campanie',          'La côte amalfitaine, joyau méditerranéen classé UNESCO.',                                                                    'https://images.unsplash.com/photo-1533606688076-b6fba6ba6d93?w=800', 'beach',     1349.00, 4.7, 198, TRUE),
('Safari Kenya','Kenya',               'Afrique de l\'Est', 'Vivez l\'Afrique authentique avec la Grande Migration du Masai Mara.',                                                       'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', 'adventure', 3299.00, 4.9, 167, FALSE),
('New York',    'États-Unis',          'Nord-Est',          'La ville qui ne dort jamais : Times Square, Central Park, musées de classe mondiale.',                                       'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 'city',      1099.00, 4.6, 523, FALSE),
('Patagonie',   'Argentine',           'Amérique du Sud',   'Au bout du monde : glaciers bleus, montagnes déchirées et prairies sauvages.',                                              'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800', 'nature',    2799.00, 4.8, 134, FALSE),
('Marrakech',   'Maroc',               'Afrique du Nord',   'La ville ocre envoûte avec ses souks labyrinthiques, ses riads somptueux et ses saveurs épicées.',                          'https://images.unsplash.com/photo-1539020140153-e479b8c22e7f?w=800', 'culture',   649.00,  4.6, 387, FALSE);

-- Transports
INSERT INTO transports (type, compagnie, ville_depart, ville_arrivee, code_depart, code_arrivee, heure_depart, heure_arrivee, prix, places_disponibles, places_total, classe, est_direct, escales) VALUES
('vol',   'Air France',          'Paris', 'Maldives',  'CDG', 'MLE', '2026-07-15 22:30:00', '2026-07-16 18:45:00', 789.00,  42,  180, 'economique', FALSE, 1),
('vol',   'Air France Business', 'Paris', 'Maldives',  'CDG', 'MLE', '2026-07-15 22:30:00', '2026-07-16 18:45:00', 2890.00, 8,   30,  'affaires',   FALSE, 1),
('vol',   'Qatar Airways',       'Paris', 'Santorini', 'CDG', 'JTR', '2026-06-15 14:20:00', '2026-06-15 19:50:00', 342.00,  87,  200, 'economique', TRUE,  0),
('vol',   'Emirates',            'Paris', 'Dubaï',     'CDG', 'DXB', '2026-08-10 08:15:00', '2026-08-10 18:30:00', 599.00,  56,  300, 'economique', TRUE,  0),
('vol',   'Emirates First',      'Paris', 'Dubaï',     'CDG', 'DXB', '2026-08-10 08:15:00', '2026-08-10 18:30:00', 4500.00, 4,   16,  'premiere',   TRUE,  0),
('vol',   'Japan Airlines',      'Paris', 'Kyoto',     'CDG', 'KIX', '2026-09-05 11:00:00', '2026-09-06 08:30:00', 1250.00, 33,  220, 'economique', FALSE, 1),
('vol',   'Air Austral',         'Paris', 'Bali',      'CDG', 'DPS', '2026-07-20 21:00:00', '2026-07-21 17:15:00', 920.00,  61,  180, 'economique', FALSE, 1),
('train', 'Eurostar',            'Paris', 'Londres',   'PDL', 'STK', '2026-06-20 09:01:00', '2026-06-20 10:17:00', 89.00,   120, 300, 'economique', TRUE,  0),
('vol',   'Alitalia',            'Paris', 'Naples',    'CDG', 'NAP', '2026-07-01 07:30:00', '2026-07-01 09:15:00', 199.00,  95,  180, 'economique', TRUE,  0),
('vol',   'Kenya Airways',       'Paris', 'Nairobi',   'CDG', 'NBO', '2026-08-01 23:55:00', '2026-08-02 10:30:00', 780.00,  45,  220, 'economique', FALSE, 1),
('vol',   'Royal Air Maroc',     'Paris', 'Marrakech', 'CDG', 'RAK', '2026-06-01 10:00:00', '2026-06-01 12:30:00', 159.00,  110, 180, 'economique', TRUE,  0),
('vol',   'Air France',          'Paris', 'New York',  'CDG', 'JFK', '2026-07-04 11:00:00', '2026-07-04 13:30:00', 550.00,  75,  280, 'economique', TRUE,  0);

-- Hébergements pour Maldives
INSERT INTO hebergements (destination_id, nom, type, description, adresse, prix_nuit, capacite_max, etoiles, note, nombre_avis, equipements, images) VALUES
(1, 'Soneva Fushi Resort',  'resort', 'Resort éco-luxe sur une île privée avec bungalows de plage époustouflants.',            'Kunfunadhoo Island, Baa Atoll', 1250.00, 2, 5, 4.9, 127, '["Piscine privée","Spa","Plage privée","Restaurant étoilé","Snorkeling","Plongée","Butler 24h","WiFi"]', '["https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600"]'),
(1, 'Gili Lankanfushi',     'resort', 'Le plus grand overwater bungalow du monde. Luxe naturel, zéro CO2.',                   'North Malé Atoll',              850.00,  4, 5, 4.8, 89,  '["Overwater villa","Piscine","Spa","Butler","Kayak","Plongée","Restaurant","WiFi"]',                    '["https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600"]');

-- Hébergements pour Santorini
INSERT INTO hebergements (destination_id, nom, type, description, adresse, prix_nuit, capacite_max, etoiles, note, nombre_avis, equipements, images) VALUES
(2, 'Canaves Oia',          'hotel',  'Cave house luxueuse taillée dans la caldeira avec vue panoramique sur le coucher de soleil.', 'Oia, Santorini', 680.00, 2, 5, 4.9, 234, '["Piscine à débordement","Vue caldeira","Petit-déjeuner","Spa","WiFi"]', '["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600"]'),
(2, 'Mystique Santorini',   'hotel',  'Suites troglodytes avec jacuzzi privé et vue imprenable sur la mer Égée.',              'Oia, Santorini',  520.00, 2, 5, 4.8, 156, '["Jacuzzi privé","Vue mer","Restaurant","Bar","Spa","WiFi"]',            '["https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600"]');

-- Hébergements pour Bali
INSERT INTO hebergements (destination_id, nom, type, description, adresse, prix_nuit, capacite_max, etoiles, note, nombre_avis, equipements, images) VALUES
(3, 'COMO Uma Ubud',        'resort', 'Resort contemporain niché au cœur des forêts tropicales d\'Ubud.',                     'Jl. Raya Sanggingan, Ubud',        420.00, 2, 5, 4.8, 198, '["Piscine","Spa","Restaurant","Yoga","Randonnée","WiFi"]', '["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600"]'),
(3, 'The Mulia Bali',       'resort', 'Resort cinq étoiles face à la baie de Jimbaran, plage privée et cinq restaurants.',  'Nusa Dua, Bali',                   580.00, 4, 5, 4.9, 312, '["Plage privée","5 restaurants","Spa","Butler","WiFi"]',   '["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600"]');

-- Activités pour Maldives
INSERT INTO activites (destination_id, nom, categorie, description, prix, duree_heures, participants_max, note, nombre_avis, inclus, image) VALUES
(1, 'Plongée sous-marine',          'aventure',    'Explorez les récifs coralliens préservés avec nos guides certifiés PADI.',       95.00,  3.0, 8,  4.9, 234, '["Équipement complet","Guide PADI","Photos","Eau minérale","Assurance"]',          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600'),
(1, 'Catamaran coucher de soleil',  'circuit',     'Naviguez sur les eaux turquoise au coucher de soleil, champagne à bord.',        145.00, 2.5, 12, 4.8, 178, '["Catamaran de luxe","Champagne","Canapés","Guide"]',                             'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600'),
(1, 'Dîner au restaurant sous-marin','gastronomie','Menu dégustation gastronomique dans le premier restaurant sous-marin du monde.', 320.00, 2.0, 14, 5.0, 89,  '["Menu 5 plats","Vins","Transport","Photographe"]',                              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600');

-- Activités pour Santorini
INSERT INTO activites (destination_id, nom, categorie, description, prix, duree_heures, participants_max, note, nombre_avis, inclus, image) VALUES
(2, 'Croisière en voilier',         'circuit',     'Tour privé de la caldeira avec escales aux îles volcaniques.',                   110.00, 8.0, 10, 4.9, 312, '["Voilier privé","Déjeuner","Vins","Snorkeling","Guide"]',                        'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600'),
(2, 'Dégustation de vins',          'gastronomie', 'Découvrez l\'Assyrtiko dans une cave ancestrale avec vue sur la caldeira.',      75.00,  3.0, 8,  4.7, 198, '["5 vins","Plateau fromages","Guide œnologue","Transport"]',                      'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600');

-- Activités pour Bali
INSERT INTO activites (destination_id, nom, categorie, description, prix, duree_heures, participants_max, note, nombre_avis, inclus, image) VALUES
(3, 'Randonnée rizières Tegallalang','nature',      'Marchez au cœur des rizières en terrasses classées UNESCO.',                    45.00,  4.0, 6,  4.8, 456, '["Guide local","Eau minérale","Transfert","Entrée","Photo"]',                     'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600'),
(3, 'Cours de cuisine balinaise',   'gastronomie', 'Apprenez les secrets de la cuisine balinaise avec un chef local.',               60.00,  4.0, 8,  4.9, 287, '["Chef privé","Visite marché","Ingrédients","Livre de recettes","Repas"]',        'https://images.unsplash.com/photo-1547592180-85f173990554?w=600'),
(3, 'Yoga au lever du soleil',      'bien_etre',   'Séance de yoga face au Gunung Agung avec méditation et petit-déjeuner healthy.', 35.00,  2.5, 10, 4.9, 189, '["Instructor certifié","Tapis","Petit-déjeuner","Tisanes","Vue volcan"]',         'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600');

-- Itinéraire exemple
INSERT INTO itineraires (utilisateur_id, titre, destination_id, date_debut, date_fin, voyageurs, prix_total, statut) VALUES
(3, 'Voyage de rêve aux Maldives', 1, '2026-07-15', '2026-07-22', 2, 4678.00, 'confirme');

-- Réservation exemple
INSERT INTO reservations (utilisateur_id, itineraire_id, reference, prix_total, statut, statut_paiement) VALUES
(3, 1, 'VV-2026-00001', 4678.00, 'confirme', 'paye');

-- Notifications exemple
INSERT INTO notifications (utilisateur_id, titre, message, type, est_lu) VALUES
(3, 'Réservation confirmée',  'Votre séjour aux Maldives du 15 au 22 juillet 2026 a été confirmé. Référence: VV-2026-00001', 'reservation', FALSE),
(3, 'Bienvenue sur VoyageVista', 'Découvrez nos offres exclusives et planifiez votre prochain voyage de luxe.', 'systeme', TRUE),
(3, 'Offre spéciale Santorini',  'Profitez de -15% sur les hébergements à Santorini pour tout séjour réservé avant le 31 mai.', 'promotion', FALSE);

-- Avis exemple
INSERT INTO avis (utilisateur_id, type_element, element_id, note, commentaire) VALUES
(3, 'destination',  1, 5, 'Une expérience absolument magique. Les Maldives dépassent tous les rêves.'),
(3, 'hebergement',  1, 5, 'Le Soneva Fushi est un paradis absolu. Bungalow avec piscine privée, vue imprenable.');

SELECT 'Base de données VoyageVista (version française) créée avec succès !' AS message;
