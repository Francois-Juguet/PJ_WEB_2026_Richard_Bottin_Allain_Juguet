import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Menu, X, Bell, User, ShoppingBag, LogOut, Settings, ChevronDown, Globe, Compass, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { notificationsAPI } from '../lib/api';

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [userMenu, setUserMenu]     = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const { user, logout }            = useAuth();
  const { itemCount }               = useCart();
  const location                    = useLocation();
  const navigate                    = useNavigate();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      notificationsAPI.getAll().then(r => setNotifCount(r.data.unread_count)).catch(() => {});
    }
  }, [user, location]);

  const handleLogout = () => { logout(); setUserMenu(false); navigate('/'); };

  const navLinks = [
    { to: '/destinations', label: 'Destinations', icon: Globe },
    { to: '/transports', label: 'Transports', icon: Plane },
    { to: '/accommodations', label: 'Hébergements', icon: null },
    { to: '/activities', label: 'Activités', icon: Compass },
  ];

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
    transition: 'all 0.4s ease',
    padding: scrolled ? '0' : '0',
    background: scrolled || !isHome
      ? 'rgba(10,10,15,0.95)'
      : 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
    backdropFilter: (scrolled || !isHome) ? 'blur(20px)' : 'none',
    borderBottom: (scrolled || !isHome) ? '1px solid rgba(201,168,76,0.1)' : 'none',
  };

  return (
    <nav style={navStyle}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={18} style={{ color: '#0A0A0F', transform: 'rotate(-30deg)' }} />
          </div>
          <span style={{ fontFamily: 'Playfair Display', fontSize: '1.3rem', fontWeight: 700 }}>
            Voyage<span style={{ color: '#C9A84C' }}>Vista</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500,
              color: location.pathname.startsWith(link.to) ? '#C9A84C' : '#E8E8F0',
              background: location.pathname.startsWith(link.to) ? 'rgba(201,168,76,0.1)' : 'transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!location.pathname.startsWith(link.to)) e.target.style.color = '#C9A84C'; }}
            onMouseLeave={e => { if (!location.pathname.startsWith(link.to)) e.target.style.color = '#E8E8F0'; }}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              {/* Cart */}
              {user && (
                <Link to="/itinerary" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s' }}>
                  <ShoppingBag size={18} />
                  {itemCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, background: '#C9A84C', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700, color: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{itemCount}</span>}
                </Link>
              )}

              {/* Notifications */}
              <Link to="/notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Bell size={18} />
                {notifCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, background: '#ef4444', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifCount > 9 ? '9+' : notifCount}</span>}
              </Link>

              {/* User menu */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setUserMenu(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', cursor: 'pointer', color: '#E8E8F0' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#0A0A0F' }}>
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user.first_name}</span>
                  <ChevronDown size={14} style={{ color: '#C9A84C', transition: 'transform 0.2s', transform: userMenu ? 'rotate(180deg)' : 'none' }} />
                </button>

                <AnimatePresence>
                  {userMenu && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                      style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200, background: '#1A1A28', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                      onClick={() => setUserMenu(false)}>
                      <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.first_name} {user.last_name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#8888A8' }}>{user.email}</p>
                        <span className="badge badge-gold" style={{ marginTop: 6, fontSize: '0.7rem' }}>{user.role}</span>
                      </div>
                      {[
                        { to: '/profile', label: 'Mon profil', icon: User },
                        { to: '/favorites', label: 'Mes favoris', icon: Heart },
                        { to: '/bookings', label: 'Mes réservations', icon: ShoppingBag },
                        ...(user.role === 'provider' || user.role === 'admin' ? [{ to: '/provider', label: 'Espace prestataire', icon: Settings }] : []),
                        ...(user.role === 'admin' ? [{ to: '/admin', label: 'Administration', icon: Settings }] : []),
                      ].map(item => (
                        <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: '0.875rem', color: '#E8E8F0', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <item.icon size={15} style={{ color: '#C9A84C' }} />
                          {item.label}
                        </Link>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 8 }}>
                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: '0.875rem', color: '#f87171', background: 'none', border: 'none', width: '100%', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <LogOut size={15} />
                          Déconnexion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Connexion</Link>
              <Link to="/register" className="btn btn-gold" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Commencer</Link>
            </>
          )}

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(p => !p)} style={{ display: 'none', background: 'none', border: 'none', color: '#E8E8F0', padding: 8 }} className="mobile-menu-btn">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ background: 'rgba(10,10,15,0.98)', borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}
            onClick={() => setMenuOpen(false)}>
            <div className="container" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} style={{ padding: '12px 16px', borderRadius: 8, fontSize: '0.95rem', color: location.pathname.startsWith(link.to) ? '#C9A84C' : '#E8E8F0' }}>
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Link to="/login" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Connexion</Link>
                  <Link to="/register" className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }}>Commencer</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
