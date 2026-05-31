// ============================================================
// App.jsx — routeur principal de l'application
// Définit toutes les routes et enveloppe l'application dans
// les providers de contexte (Auth, Panier, Toasts).
// ============================================================

import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Import de toutes les pages de l'application
import Home              from './pages/Home';
import Login             from './pages/Login';
import Register          from './pages/Register';
import Destinations      from './pages/Destinations';
import DestinationDetail from './pages/DestinationDetail';
import Transports        from './pages/Transports';
import Accommodations    from './pages/Accommodations';
import Activities        from './pages/Activities';
import ItineraryBuilder  from './pages/ItineraryBuilder';
import Bookings          from './pages/Bookings';
import Notifications     from './pages/Notifications';
import Profile           from './pages/Profile';
import AdminDashboard    from './pages/AdminDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import Favorites         from './pages/Favorites';

// Mise en page commune : barre de navigation + contenu + pied de page
// noFooter permet de masquer le footer sur les pages d'auth (login/register)
function Layout({ children, noFooter }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh' }}>{children}</main>
      {!noFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    // HashRouter utilise le # dans l'URL (compatible avec hébergements sans serveur Node)
    <BrowserRouter>
      {/* AuthProvider — donne accès à l'utilisateur connecté partout */}
      <AuthProvider>
        {/* CartProvider — gère l'itinéraire en cours (rôle de panier) */}
        <CartProvider>
          {/* ToastProvider — affiche les notifications temporaires */}
          <ToastProvider>
            <Routes>
              {/* Pages publiques avec barre de nav et footer */}
              <Route path="/"               element={<Layout><Home /></Layout>} />
              <Route path="/destinations"   element={<Layout><Destinations /></Layout>} />
              <Route path="/destinations/:id" element={<Layout><DestinationDetail /></Layout>} />
              <Route path="/transports"     element={<Layout><Transports /></Layout>} />
              <Route path="/accommodations" element={<Layout><Accommodations /></Layout>} />
              <Route path="/activities"     element={<Layout><Activities /></Layout>} />
              <Route path="/itinerary"      element={<Layout><ItineraryBuilder /></Layout>} />
              <Route path="/itinerary/:id"  element={<Layout><ItineraryBuilder /></Layout>} />
              <Route path="/bookings"       element={<Layout><Bookings /></Layout>} />
              <Route path="/notifications"  element={<Layout><Notifications /></Layout>} />
              <Route path="/profile"        element={<Layout><Profile /></Layout>} />
              <Route path="/admin"          element={<Layout><AdminDashboard /></Layout>} />
              <Route path="/provider"       element={<Layout><ProviderDashboard /></Layout>} />
              <Route path="/favorites"      element={<Layout><Favorites /></Layout>} />

              {/* Pages d'authentification — sans footer */}
              <Route path="/login"    element={<Layout noFooter><Login /></Layout>} />
              <Route path="/register" element={<Layout noFooter><Register /></Layout>} />

              {/* Page 404 — toute URL inconnue */}
              <Route path="*" element={
                <Layout>
                  <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: 8 }}>Page introuvable</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Cette destination n'existe pas encore.</p>
                    <a href="/" className="btn btn-gold">Retour à l'accueil</a>
                  </div>
                </Layout>
              } />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
