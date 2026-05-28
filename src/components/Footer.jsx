import { Link } from 'react-router-dom';
import { Plane, Globe, X, Share2, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#080810', borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 64 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, paddingBottom: 48 }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plane size={18} style={{ color: '#0A0A0F', transform: 'rotate(-30deg)' }} />
              </div>
              <span style={{ fontFamily: 'Playfair Display', fontSize: '1.3rem', fontWeight: 700 }}>
                Voyage<span style={{ color: '#C9A84C' }}>Vista</span>
              </span>
            </Link>
            <p style={{ color: '#8888A8', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 280, marginBottom: 24 }}>
              La plateforme de voyage luxe par excellence. Des expériences uniques, des destinations d'exception, un service d'élite.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {[X, Globe, Share2].map((Icon, i) => (
                <button key={i} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8888A8', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.color = '#C9A84C'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#8888A8'; }}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: 'Explorer',
              links: [
                { to: '/destinations', label: 'Destinations' },
                { to: '/transports', label: 'Transports' },
                { to: '/accommodations', label: 'Hébergements' },
                { to: '/activities', label: 'Activités' },
              ]
            },
            {
              title: 'Mon compte',
              links: [
                { to: '/login', label: 'Connexion' },
                { to: '/register', label: 'Inscription' },
                { to: '/profile', label: 'Mon profil' },
                { to: '/bookings', label: 'Mes réservations' },
              ]
            },
            {
              title: 'Contact',
              links: []
            }
          ].map(section => (
            <div key={section.title}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 20 }}>
                {section.title}
              </h4>
              {section.links.map(link => (
                <Link key={link.to} to={link.to} style={{ display: 'block', color: '#8888A8', fontSize: '0.9rem', marginBottom: 12, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#E8E8F0'}
                  onMouseLeave={e => e.target.style.color = '#8888A8'}>
                  {link.label}
                </Link>
              ))}
              {section.title === 'Contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: Mail, text: 'contact@voyagevista.com' },
                    { icon: Phone, text: '+33 1 23 45 67 89' },
                    { icon: MapPin, text: 'Paris, France' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8888A8', fontSize: '0.875rem' }}>
                      <Icon size={14} style={{ color: '#C9A84C', flexShrink: 0 }} />
                      {text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ color: '#5A5A78', fontSize: '0.8rem' }}>
            © 2026 VoyageVista. Tous droits réservés. Projet Web Dynamique — ECE Paris.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Conditions', 'Confidentialité', 'Cookies'].map(t => (
              <span key={t} style={{ color: '#5A5A78', fontSize: '0.8rem', cursor: 'pointer' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { footer .container > div:first-child > div { grid-template-columns: 1fr !important; } }`}</style>
    </footer>
  );
}
