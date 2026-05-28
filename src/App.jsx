import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

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
import Favorites        from './pages/Favorites';

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
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* Full layout pages */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/destinations" element={<Layout><Destinations /></Layout>} />
              <Route path="/destinations/:id" element={<Layout><DestinationDetail /></Layout>} />
              <Route path="/transports" element={<Layout><Transports /></Layout>} />
              <Route path="/accommodations" element={<Layout><Accommodations /></Layout>} />
              <Route path="/activities" element={<Layout><Activities /></Layout>} />
              <Route path="/itinerary" element={<Layout><ItineraryBuilder /></Layout>} />
              <Route path="/itinerary/:id" element={<Layout><ItineraryBuilder /></Layout>} />
              <Route path="/bookings" element={<Layout><Bookings /></Layout>} />
              <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
              <Route path="/provider" element={<Layout><ProviderDashboard /></Layout>} />
              <Route path="/favorites" element={<Layout><Favorites /></Layout>} />

              {/* Auth pages (no footer) */}
              <Route path="/login" element={<Layout noFooter><Login /></Layout>} />
              <Route path="/register" element={<Layout noFooter><Register /></Layout>} />

              {/* 404 */}
              <Route path="*" element={
                <Layout>
                  <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '6rem', marginBottom: 16 }}>✈️</div>
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
