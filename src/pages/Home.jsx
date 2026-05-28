import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Search, Plane, Hotel, Compass, Star, ArrowRight, MapPin, ChevronRight, Shield, Award, Globe, Zap } from 'lucide-react';
import { destinationsAPI } from '../lib/api';
import StarRating from '../components/StarRating';

const categories = [
  { id: 'beach', label: 'Plages', emoji: '🏖️' },
  { id: 'mountain', label: 'Montagnes', emoji: '⛰️' },
  { id: 'city', label: 'Villes', emoji: '🏙️' },
  { id: 'island', label: 'Îles', emoji: '🌴' },
  { id: 'adventure', label: 'Aventure', emoji: '🧗' },
  { id: 'culture', label: 'Culture', emoji: '🏛️' },
];

function DestinationCard({ dest, delay = 0 }) {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }}
      onClick={() => navigate(`/destinations/${dest.id}`)}
      style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', position: 'relative', aspectRatio: '3/4', background: '#1A1A28' }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}>
      <img src={dest.image} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
        onError={e => { e.target.style.display = 'none'; }}
        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{dest.category}</span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <MapPin size={12} style={{ color: '#C9A84C' }} />
          <span style={{ fontSize: '0.75rem', color: '#C9A84C' }}>{dest.country}</span>
        </div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, fontFamily: 'Playfair Display' }}>{dest.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StarRating rating={dest.rating} count={dest.reviews_count} size={12} />
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.9rem' }}>À partir de {dest.price_from?.toLocaleString('fr-FR')} €</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState('flight');
  const navigate = useNavigate();

  useEffect(() => {
    destinationsAPI.getAll({ featured: true, limit: 6 })
      .then(r => setFeatured(r.data?.data ?? []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) navigate(`/destinations?search=${encodeURIComponent(search)}`);
  };

  const stats = [
    { value: '150+', label: 'Destinations' },
    { value: '50K+', label: 'Voyageurs satisfaits' },
    { value: '4.9★', label: 'Note moyenne' },
    { value: '24/7', label: 'Conciergerie' },
  ];

  const features = [
    { icon: Shield, title: 'Sécurité garantie', desc: 'Paiements sécurisés et assurance voyage incluse pour votre tranquillité d\'esprit.' },
    { icon: Award, title: 'Sélection premium', desc: 'Chaque destination et hébergement est rigoureusement sélectionné par nos experts.' },
    { icon: Globe, title: 'Mondial & local', desc: 'Accès à des expériences uniques et authentiques dans le monde entier.' },
    { icon: Zap, title: 'Planification rapide', desc: 'Composez et validez votre séjour de luxe en quelques minutes.' },
  ];

  return (
    <div className="page">
      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1920) center/cover no-repeat', filter: 'brightness(0.3)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.1) 0%, transparent 70%)' }} />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div key={i}
            style={{ position: 'absolute', width: i % 2 === 0 ? 300 : 200, height: i % 2 === 0 ? 300 : 200, borderRadius: '50%', background: `radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)`, left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 20}%` }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }} />
        ))}

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 80 }}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', animation: 'pulse-gold 2s infinite' }} />
              <span style={{ fontSize: '0.8rem', color: '#C9A84C', fontWeight: 500, letterSpacing: '0.05em' }}>Plateforme de voyages premium</span>
            </div>

            <h1 style={{ marginBottom: 24, lineHeight: 1.1, maxWidth: 700 }}>
              Planifiez votre{' '}
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #E8C97A, #C9A84C, #9A7A2E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                voyage de rêve
              </span>
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#8888A8', maxWidth: 520, marginBottom: 40, lineHeight: 1.7 }}>
              Destinations d'exception, hébergements de luxe et expériences inoubliables.
              Composez votre séjour parfait en quelques instants.
            </p>

            {/* Search widget */}
            <div style={{ background: 'rgba(26,26,40,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 20, padding: 20, maxWidth: 700, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[
                  { id: 'flight', label: 'Vols', icon: Plane },
                  { id: 'hotel', label: 'Hôtels', icon: Hotel },
                  { id: 'activity', label: 'Activités', icon: Compass },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s', background: activeTab === tab.id ? 'rgba(201,168,76,0.15)' : 'transparent', color: activeTab === tab.id ? '#C9A84C' : '#8888A8', fontFamily: 'Inter' }}>
                    <tab.icon size={15} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8888A8' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Où souhaitez-vous aller ?" className="input-field"
                    style={{ width: '100%', paddingLeft: 40 }} />
                </div>
                <button type="submit" className="btn btn-gold" style={{ padding: '12px 28px' }}>
                  <Search size={16} />
                  Rechercher
                </button>
              </form>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                <span style={{ fontSize: '0.78rem', color: '#5A5A78' }}>Populaire :</span>
                {['Maldives', 'Santorini', 'Bali', 'Dubaï'].map(d => (
                  <button key={d} onClick={() => navigate(`/destinations?search=${d}`)} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8888A8', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.target.style.color = '#C9A84C'; e.target.style.borderColor = 'rgba(201,168,76,0.3)'; }}
                    onMouseLeave={e => { e.target.style.color = '#8888A8'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 48, marginTop: 48, flexWrap: 'wrap' }}>
              {stats.map(s => (
                <motion.div key={s.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display' }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8888A8', marginTop: 2 }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="section" style={{ background: 'var(--dark-2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p className="section-eyebrow">Explorer par type</p>
            <h2 className="section-title">Quelle est votre escapade idéale ?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/destinations?category=${cat.id}`)}
                style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 16, padding: '24px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
                whileHover={{ y: -4, borderColor: 'rgba(201,168,76,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{cat.emoji}</div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#E8E8F0' }}>{cat.label}</span>
              </motion.div>
            ))}
          </div>
          <style>{`@media (max-width: 768px) { .cat-grid { grid-template-columns: repeat(3, 1fr) !important; } }`}</style>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
            <div>
              <p className="section-eyebrow">Sélection exclusive</p>
              <h2 className="section-title" style={{ margin: '8px 0 0' }}>Destinations vedettes</h2>
            </div>
            <Link to="/destinations" className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
              Toutes <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 20 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {featured.map((dest, i) => <DestinationCard key={dest.id} dest={dest} delay={i * 0.1} />)}
            </div>
          )}
        </div>
      </section>

      {/* Why VoyageVista */}
      <section className="section" style={{ background: 'var(--dark-2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="section-eyebrow">Notre promesse</p>
            <h2 className="section-title">Pourquoi choisir VoyageVista ?</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>L'excellence au service de vos voyages. Nous sélectionnons les meilleures expériences pour vous.</p>
          </div>
          <div className="grid-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, padding: 28, transition: 'all 0.3s' }}
                whileHover={{ borderColor: 'rgba(201,168,76,0.3)', y: -4 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <f.icon size={22} style={{ color: '#C9A84C' }} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 10, fontFamily: 'Playfair Display' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#8888A8', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 50%, rgba(99,102,241,0.05) 100%)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Plane size={36} style={{ color: '#C9A84C', transform: 'rotate(-30deg)' }} />
            </div>
            <h2 style={{ marginBottom: 16 }}>Prêt à voyager ?</h2>
            <p style={{ color: '#8888A8', marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
              Rejoignez plus de 50 000 voyageurs qui nous font confiance pour leurs séjours d'exception.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-gold" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                Créer mon compte gratuit
                <ArrowRight size={18} />
              </Link>
              <Link to="/destinations" className="btn btn-outline" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                Explorer les destinations
              </Link>
            </div>
          </motion.div>
        </div>
      </section>}
    </div>
  );
}
