# VoyageVista — Plateforme de voyages Luxe & Premium

## Prérequis
- XAMPP/WAMP (PHP 8.1+ + MySQL)
- Node.js 18+

## Installation rapide

### 1. Base de données
1. Démarrer XAMPP (Apache + MySQL)
2. Ouvrir http://localhost/phpmyadmin
3. Importer `database/voyagevista.sql`

### 2. Backend (PHP)
Copier le dossier `backend/` dans `C:/xampp/htdocs/VoyageVista/`
→ Le backend sera accessible sur http://localhost/VoyageVista/backend/

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
→ Ouvrir http://localhost:5173

## Comptes de démonstration (mot de passe: `password`)
| Email                          | Rôle        |
|-------------------------------|-------------|
| admin@voyagevista.com         | Admin       |
| provider@voyagevista.com      | Prestataire |
| traveler@voyagevista.com      | Voyageur    |

## Structure
```
VoyageVista/
├── frontend/          # React + Vite
├── backend/           # PHP REST API
│   ├── api/           # Endpoints
│   ├── config/        # DB + CORS
│   └── middleware/    # JWT auth
└── database/          # Schema SQL
```

## Technologies
- **Frontend**: React 18, Vite, React Router, Framer Motion, Lucide Icons
- **Backend**: PHP 8, PDO, JWT maison
- **Base de données**: MySQL
- **Design**: CSS custom, dark theme luxe avec accents dorés
