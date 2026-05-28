-- ============================================
-- VoyageVista - Base de données complète
-- Plateforme Luxe & Premium de voyages
-- ============================================

CREATE DATABASE IF NOT EXISTS voyagevista CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voyagevista;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- TABLES
-- ============================================

DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS itinerary_activities;
DROP TABLE IF EXISTS itinerary_accommodations;
DROP TABLE IF EXISTS itinerary_transports;
DROP TABLE IF EXISTS itineraries;
DROP TABLE IF EXISTS accommodation_availability;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS accommodations;
DROP TABLE IF EXISTS transports;
DROP TABLE IF EXISTS destinations;
DROP TABLE IF EXISTS users;

-- Utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'provider', 'traveler') DEFAULT 'traveler',
    avatar VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Destinations
CREATE TABLE destinations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    description TEXT,
    image VARCHAR(500),
    category ENUM('beach', 'mountain', 'city', 'nature', 'culture', 'adventure', 'island', 'road_trip') NOT NULL,
    price_from DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    provider_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Transports
CREATE TABLE transports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('flight', 'train', 'bus', 'car', 'ferry') NOT NULL,
    company VARCHAR(100) NOT NULL,
    departure_city VARCHAR(100) NOT NULL,
    arrival_city VARCHAR(100) NOT NULL,
    departure_code VARCHAR(10),
    arrival_code VARCHAR(10),
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INT NOT NULL,
    total_seats INT NOT NULL,
    class_type ENUM('economy', 'business', 'first') DEFAULT 'economy',
    is_direct BOOLEAN DEFAULT TRUE,
    stops INT DEFAULT 0,
    logo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hébergements
CREATE TABLE accommodations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destination_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('hotel', 'villa', 'apartment', 'hostel', 'resort') NOT NULL,
    description TEXT,
    address VARCHAR(255),
    price_per_night DECIMAL(10,2) NOT NULL,
    max_capacity INT NOT NULL,
    stars INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INT DEFAULT 0,
    amenities JSON,
    images JSON,
    provider_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Disponibilités hébergements
CREATE TABLE accommodation_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    accommodation_id INT NOT NULL,
    date DATE NOT NULL,
    available_rooms INT NOT NULL,
    status ENUM('available', 'partial', 'full') DEFAULT 'available',
    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_availability (accommodation_id, date)
);

-- Activités
CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destination_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category ENUM('adventure', 'culture', 'nature', 'wellness', 'gastronomy', 'family', 'tour') NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_hours DECIMAL(4,1),
    max_participants INT,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INT DEFAULT 0,
    included JSON,
    image VARCHAR(500),
    provider_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Itinéraires
CREATE TABLE itineraries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) DEFAULT 'Mon voyage',
    destination_id INT,
    start_date DATE,
    end_date DATE,
    travelers INT DEFAULT 1,
    total_price DECIMAL(10,2) DEFAULT 0,
    status ENUM('draft', 'confirmed', 'cancelled') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
);

-- Transports d'itinéraire
CREATE TABLE itinerary_transports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    itinerary_id INT NOT NULL,
    transport_id INT NOT NULL,
    direction ENUM('outbound', 'return') DEFAULT 'outbound',
    passengers INT DEFAULT 1,
    price DECIMAL(10,2),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (transport_id) REFERENCES transports(id) ON DELETE CASCADE
);

-- Hébergements d'itinéraire
CREATE TABLE itinerary_accommodations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    itinerary_id INT NOT NULL,
    accommodation_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    rooms INT DEFAULT 1,
    price DECIMAL(10,2),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE
);

-- Activités d'itinéraire
CREATE TABLE itinerary_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    itinerary_id INT NOT NULL,
    activity_id INT NOT NULL,
    scheduled_date DATE,
    scheduled_time TIME DEFAULT '09:00:00',
    participants INT DEFAULT 1,
    price DECIMAL(10,2),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- Réservations
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    itinerary_id INT NOT NULL,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking', 'transport', 'accommodation', 'activity', 'promotion', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    related_id INT,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Avis
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entity_type ENUM('destination', 'accommodation', 'activity', 'transport') NOT NULL,
    entity_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
);

-- Favoris
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entity_type ENUM('destination', 'accommodation', 'activity') NOT NULL,
    entity_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, entity_type, entity_id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- DONNÉES DE DÉMONSTRATION
-- ============================================

-- Utilisateurs (mdp: Admin1234! hashé en bcrypt)
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin@voyagevista.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alexandre', 'Beaumont', 'admin'),
('provider@voyagevista.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sophie', 'Laurent', 'provider'),
('traveler@voyagevista.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marc', 'Dubois', 'traveler');

-- Note: le mot de passe hashé ci-dessus correspond à "password"
-- En production, utiliser: password_hash('Admin1234!', PASSWORD_BCRYPT)

-- Destinations
INSERT INTO destinations (name, country, region, description, image, category, price_from, rating, reviews_count, is_featured) VALUES
('Maldives', 'Maldives', 'Océan Indien', 'Paradis tropical avec eaux cristallines et bungalows sur pilotis. Une destination d\'exception pour les voyageurs en quête de luxe absolu et de tranquillité.', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800', 'beach', 2499.00, 4.9, 342, TRUE),
('Santorini', 'Grèce', 'Cyclades', 'L\'île emblématique avec ses maisons blanches et ses couchers de soleil légendaires sur la caldeira. Romantisme et authenticité méditerranéenne.', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', 'island', 1249.00, 4.8, 289, TRUE),
('Bali', 'Indonésie', 'Asie du Sud-Est', 'L\'île des dieux offre une fusion parfaite entre temples anciens, rizières en terrasses et plages de sable fin. Culture vivante et spiritualité.', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'culture', 899.00, 4.7, 456, TRUE),
('Dubaï', 'Émirats Arabes Unis', 'Moyen-Orient', 'La ville du futur allie modernité époustouflante et traditions arabes. Shopping de luxe, architecture avant-gardiste et expériences uniques.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'city', 1599.00, 4.8, 278, TRUE),
('Kyoto', 'Japon', 'Kansai', 'Ancienne capitale impériale, Kyoto préserve l\'âme du Japon traditionnel. Temples zen, jardins de cerisiers et geishas dans le quartier de Gion.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', 'culture', 1899.00, 4.9, 312, TRUE),
('Amalfi', 'Italie', 'Campanie', 'La côte amalfitaine, joyau méditerranéen classé UNESCO, offre des panoramas à couper le souffle entre falaises, villages colorés et mer turquoise.', 'https://images.unsplash.com/photo-1533606688076-b6fba6ba6d93?w=800', 'beach', 1349.00, 4.7, 198, TRUE),
('Safari Kenya', 'Kenya', 'Afrique de l\'Est', 'Vivez l\'Afrique authentique avec les Grands Migrations du Masai Mara. Lions, éléphants, girafes dans leur habitat naturel — une expérience inoubliable.', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', 'adventure', 3299.00, 4.9, 167, FALSE),
('New York', 'États-Unis', 'Nord-Est', 'La ville qui ne dort jamais. Times Square, Central Park, musées de classe mondiale et gastronomie internationale dans la métropole par excellence.', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 'city', 1099.00, 4.6, 523, FALSE),
('Patagonie', 'Argentine', 'Amérique du Sud', 'Au bout du monde, la Patagonie déroule ses paysages sauvages: glaciers bleus, montagnes déchirées et prairies immenses habitées par la faune sauvage.', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800', 'nature', 2799.00, 4.8, 134, FALSE),
('Marrakech', 'Maroc', 'Afrique du Nord', 'La ville ocre envoûte ses visiteurs avec ses souks labyrinthiques, ses riads somptueux, ses jardins secrets et ses saveurs épicées de la cuisine marocaine.', 'https://images.unsplash.com/photo-1539020140153-e479b8c22e7f?w=800', 'culture', 649.00, 4.6, 387, FALSE);

-- Transports
INSERT INTO transports (type, company, departure_city, arrival_city, departure_code, arrival_code, departure_time, arrival_time, price, available_seats, total_seats, class_type, is_direct, stops) VALUES
('flight', 'Air France', 'Paris', 'Maldives', 'CDG', 'MLE', '2026-07-15 22:30:00', '2026-07-16 18:45:00', 789.00, 42, 180, 'economy', FALSE, 1),
('flight', 'Air France Business', 'Paris', 'Maldives', 'CDG', 'MLE', '2026-07-15 22:30:00', '2026-07-16 18:45:00', 2890.00, 8, 30, 'business', FALSE, 1),
('flight', 'Qatar Airways', 'Paris', 'Santorini', 'CDG', 'JTR', '2026-06-15 14:20:00', '2026-06-15 19:50:00', 342.00, 87, 200, 'economy', TRUE, 0),
('flight', 'Emirates', 'Paris', 'Dubaï', 'CDG', 'DXB', '2026-08-10 08:15:00', '2026-08-10 18:30:00', 599.00, 56, 300, 'economy', TRUE, 0),
('flight', 'Emirates First', 'Paris', 'Dubaï', 'CDG', 'DXB', '2026-08-10 08:15:00', '2026-08-10 18:30:00', 4500.00, 4, 16, 'first', TRUE, 0),
('flight', 'Japan Airlines', 'Paris', 'Kyoto', 'CDG', 'KIX', '2026-09-05 11:00:00', '2026-09-06 08:30:00', 1250.00, 33, 220, 'economy', FALSE, 1),
('flight', 'Air Austral', 'Paris', 'Bali', 'CDG', 'DPS', '2026-07-20 21:00:00', '2026-07-21 17:15:00', 920.00, 61, 180, 'economy', FALSE, 1),
('train', 'Eurostar', 'Paris', 'Londres', 'PDL', 'STK', '2026-06-20 09:01:00', '2026-06-20 10:17:00', 89.00, 120, 300, 'economy', TRUE, 0),
('flight', 'Alitalia', 'Paris', 'Naples', 'CDG', 'NAP', '2026-07-01 07:30:00', '2026-07-01 09:15:00', 199.00, 95, 180, 'economy', TRUE, 0),
('flight', 'Kenya Airways', 'Paris', 'Nairobi', 'CDG', 'NBO', '2026-08-01 23:55:00', '2026-08-02 10:30:00', 780.00, 45, 220, 'economy', FALSE, 1),
('flight', 'Royal Air Maroc', 'Paris', 'Marrakech', 'CDG', 'RAK', '2026-06-01 10:00:00', '2026-06-01 12:30:00', 159.00, 110, 180, 'economy', TRUE, 0),
('flight', 'Air France', 'Paris', 'New York', 'CDG', 'JFK', '2026-07-04 11:00:00', '2026-07-04 13:30:00', 550.00, 75, 280, 'economy', TRUE, 0);

-- Hébergements pour Maldives
INSERT INTO accommodations (destination_id, name, type, description, address, price_per_night, max_capacity, stars, rating, reviews_count, amenities, images) VALUES
(1, 'Soneva Fushi Resort', 'resort', 'Resort éco-luxe sur une île privée avec bungalows de plage époustouflants. Service d\'excellence, spa primé et restaurants gastronomiques en plein air.', 'Kunfunadhoo Island, Baa Atoll', 1250.00, 2, 5, 4.9, 127, '["Piscine privée","Spa","Plage privée","Restaurant étoilé","Snorkeling","Plongée","Butler 24h","WiFi"]', '["https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600","https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600"]'),
(1, 'Gili Lankanfushi', 'resort', 'Le plus grand overwater bungalow du monde. Luxe naturel, zéro CO2, service cinq étoiles dans une nature préservée d\'exception.', 'North Malé Atoll', 850.00, 4, 5, 4.8, 89, '["Overwater villa","Piscine","Spa","Butler","Kayak","Plongée","Restaurant","WiFi"]', '["https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600"]');

-- Hébergements pour Santorini
INSERT INTO accommodations (destination_id, name, type, description, address, price_per_night, max_capacity, stars, rating, reviews_count, amenities, images) VALUES
(2, 'Canaves Oia Boutique Hotel', 'hotel', 'Cave house luxueuse taillée dans la caldeira d''Oia avec vue panoramique sur le coucher de soleil. Piscine à débordement et service personnalisé.', 'Oia, Santorini', 680.00, 2, 5, 4.9, 234, '["Piscine à débordement","Vue caldeira","Petit-déjeuner","Spa","Terrasse","WiFi","Transfert"]', '["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600"]'),
(2, 'Mystique Hotel Santorini', 'hotel', 'Un joyau architectural suspendu au-dessus de la caldeira. Suites troglodytes avec jacuzzi privé et vue imprenable sur la mer Égée.', 'Oia, Santorini', 520.00, 2, 5, 4.8, 156, '["Jacuzzi privé","Vue mer","Restaurant","Bar","Spa","WiFi","Conciergerie"]', '["https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600"]');

-- Hébergements pour Bali
INSERT INTO accommodations (destination_id, name, type, description, address, price_per_night, max_capacity, stars, rating, reviews_count, amenities, images) VALUES
(3, 'COMO Uma Ubud', 'resort', 'Resort contemporain niché au cœur des forêts tropicales d''Ubud avec vue sur les rizières. Architecture balinaise moderne et spa COMO réputé.', 'Jl. Raya Sanggingan, Ubud', 420.00, 2, 5, 4.8, 198, '["Piscine","Spa COMO","Restaurant","Yoga","Randonnée","WiFi","Navette"]', '["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600"]'),
(3, 'The Mulia Bali', 'resort', 'Resort cinq étoiles de classe mondiale face à la baie de Jimbaran. Plage privée, cinq restaurants et spa primé dans un parc de 20 hectares.', 'Jalan Raya Nusa Dua Selatan, Nusa Dua', 580.00, 4, 5, 4.9, 312, '["Plage privée","5 restaurants","Spa","Piscine","Butler","Fitness","WiFi"]', '["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600"]');

-- Activités pour Maldives
INSERT INTO activities (destination_id, name, category, description, price, duration_hours, max_participants, rating, reviews_count, included, image) VALUES
(1, 'Plongée sous-marine aux Maldives', 'adventure', 'Explorez les récifs coralliens préservés avec nos guides certifiés PADI. Rencontrez raies manta, requins baleines et tortues dans des eaux à 30°C.', 95.00, 3.0, 8, 4.9, 234, '["Équipement complet","Guide PADI","Photos sous-marines","Eau minérale","Assurance"]', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600'),
(1, 'Excursion en catamaran coucher de soleil', 'tour', 'Naviguez sur les eaux turquoise de l''atoll au coucher de soleil. Cocktails, champagne et canapés servis à bord d''un catamaran de luxe.', 145.00, 2.5, 12, 4.8, 178, '["Catamaran de luxe","Champagne","Canapés","Guide","Coucher de soleil"]', 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600'),
(1, 'Dîner sous-marin au Ithaa', 'gastronomy', 'Vivez une expérience gastronomique unique dans le premier restaurant sous-marin du monde. Menu dégustation gastronomique entouré de la vie marine.', 320.00, 2.0, 14, 5.0, 89, '["Menu dégustation 5 plats","Vins assortis","Transport aller-retour","Photographe"]', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600');

-- Activités pour Santorini
INSERT INTO activities (destination_id, name, category, description, price, duration_hours, max_participants, rating, reviews_count, included, image) VALUES
(2, 'Croisière en voilier caldeira', 'tour', 'Tour privé de la caldeira en voilier avec escales aux îles volcaniques. Baignade dans les sources chaudes de Palea Kameni et dégustation de vins locaux.', 110.00, 8.0, 10, 4.9, 312, '["Voilier privé","Déjeuner","Vins de Santorini","Snorkeling","Guide"]', 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600'),
(2, 'Dégustation de vins premium', 'gastronomy', 'Parcourez les vignobles volcaniques et découvrez l''Assyrtiko, cépage unique de Santorini. Dégustation dans une cave ancestrale avec vue sur la caldeira.', 75.00, 3.0, 8, 4.7, 198, '["5 vins dégustés","Plateau fromages","Guide œnologue","Transport","Vue caldeira"]', 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600');

-- Activités pour Bali
INSERT INTO activities (destination_id, name, category, description, price, duration_hours, max_participants, rating, reviews_count, included, image) VALUES
(3, 'Randonnée rizières de Tegallalang', 'nature', 'Marchez au cœur des magnifiques rizières en terrasses de Tegallalang classées UNESCO. Rencontrez les agriculteurs locaux et découvrez le système d''irrigation subak.', 45.00, 4.0, 6, 4.8, 456, '["Guide local","Eau minérale","Transfert","Entrée rizières","Photo souvenir"]', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600'),
(3, 'Cours de cuisine balinaise', 'gastronomy', 'Apprenez les secrets de la cuisine balinaise avec un chef local. Visite du marché d''épices, préparation de 5 plats traditionnels et dégustation dans un cadre authentique.', 60.00, 4.0, 8, 4.9, 287, '["Chef privé","Visite marché","Ingrédients","Livre de recettes","Repas inclus"]', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600'),
(3, 'Retraite yoga au lever du soleil', 'wellness', 'Séance de yoga au lever du soleil dans un cadre naturel exceptionnel avec vue sur le Gunung Agung. Méditation, pranayama et petit-déjeuner healthy inclus.', 35.00, 2.5, 10, 4.9, 189, '["Instructor certifié","Tapis de yoga","Petit-déjeuner","Tisanes","Vue volcan"]', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600');

-- Itinéraire exemple
INSERT INTO itineraries (user_id, title, destination_id, start_date, end_date, travelers, total_price, status) VALUES
(3, 'Voyage de rêve aux Maldives', 1, '2026-07-15', '2026-07-22', 2, 4678.00, 'confirmed');

-- Réservation exemple
INSERT INTO bookings (user_id, itinerary_id, booking_reference, total_price, status, payment_status) VALUES
(3, 1, 'VV-2026-00001', 4678.00, 'confirmed', 'paid');

-- Notifications exemple
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(3, 'Réservation confirmée', 'Votre séjour aux Maldives du 15 au 22 juillet 2026 a été confirmé. Référence: VV-2026-00001', 'booking', FALSE),
(3, 'Bienvenue sur VoyageVista', 'Découvrez nos offres exclusives et planifiez votre prochain voyage de luxe.', 'system', TRUE),
(3, 'Offre spéciale Santorini', 'Profitez de -15% sur les hébergements à Santorini pour tout séjour réservé avant le 31 mai.', 'promotion', FALSE);

-- Avis exemple
INSERT INTO reviews (user_id, entity_type, entity_id, rating, comment) VALUES
(3, 'destination', 1, 5, 'Une expérience absolument magique. Les Maldives dépassent tous les rêves. Eaux cristallines, service impeccable.'),
(3, 'accommodation', 1, 5, 'Le Soneva Fushi est un paradis absolu. Bungalow avec piscine privée, vue imprenable, nourriture extraordinaire.');

SELECT 'Base de données VoyageVista créée avec succès!' AS message;
