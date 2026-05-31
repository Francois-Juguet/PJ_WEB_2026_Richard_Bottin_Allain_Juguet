// ============================================================
// Favorites.jsx — collection de favoris de l'utilisateur
// Regroupe les destinations, hébergements et activités aimés.
// Filtres par onglet, suppression possible pour chaque favori.
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Hotel, Compass, Globe, ArrowRight, Trash2 } from 'lucide-react';
import { usersAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';

/* Clés = valeurs stockées en BDD (type_element) */
const TYPE_CONFIG = {
  destination:  { label: 'Destination', color: '#C9A84C', icon: Globe,   bg: 'rgba(201,168,76,0.12)',  link: id => `/destinations/${id}` },
  hebergement:  { label: 'Hébergement', color: '#a78bfa', icon: Hotel,   bg: 'rgba(167,139,250,0.12)', link: () => `/accommodations` },
  activite:     { label: 'Activité',    color: '#4ade80', icon: Compass, bg: 'rgba(74,222,128,0.12)',  link: () => `/activities` },
};

const TABS = [
  { key: 'all',         label: 'Tous' },
  { key: 'destination', label: 'Destinations' },
  { key: 'hebergement', label: 'Hébergements' },
  { key: 'activite',    label: 'Activités' },
];

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const { user }   = useAuth();
  const { toast }  = useToast();
  const navigate   = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getFavorites();
      setFavorites(Array.isArray(data) ? data : []);
    } catch { toast('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  const remove = async (fav) => {
    try {
      await usersAPI.toggleFavorite({ type_element: fav.type_element, element_id: fav.element_id });
      setFavorites(p => p.filter(f => f.favori_id !== fav.favori_id));
      toast('Retiré des favoris', 'success');
    } catch { toast('Erreur', 'error'); }
  };

  // Favoris filtrés selon l'onglet actif (tous / destinations / hébergements / activités)
  const filtered = filter === 'all' ? favorites : favorites.filter(f => f.type_element === filter);
  const countOf  = key => key === 'all' ? favorites.length : favorites.filter(f => f.type_element === key).length;

  return (
    <div className="page" style={{ paddingTop: 70 }}>

      {/* Header */}
      <div style={{ background: 'var(--dark-2)', padding: '48px 0 32px', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <p className="section-eyebrow">Ma collection</p>
          <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(1.8rem,4vw,3rem)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Heart size={30} style={{ color: '#ef4444', fill: '#ef4444', flexShrink: 0 }} />
            Mes favoris
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Vos destinations, hébergements et activités coup de cœur</p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                style={{ padding: '6px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.85rem', transition: 'all 0.2s',
                  background: filter === tab.key ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filter === tab.key ? '#C9A84C' : 'var(--text-muted)',
                  borderWidth: 1, borderStyle: 'solid',
                  borderColor: filter === tab.key ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)' }}>
                {tab.label}
                <span style={{ marginLeft: 7, opacity: 0.65, fontSize: '0.8rem' }}>({countOf(tab.key)})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container section">
        {loading ? (
          <div className="grid-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 270, borderRadius: 20 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Heart size={52} style={{ display: 'block', margin: '0 auto 20px', color: '#ef4444', opacity: 0.25 }} />
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400, marginBottom: 12 }}>
              {filter === 'all' ? 'Aucun favori pour l\'instant' : 'Aucun favori dans cette catégorie'}
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: 28 }}>
              Cliquez sur l'icône coeur sur les hébergements ou activités pour les sauvegarder ici.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/destinations')} className="btn btn-gold">Explorer les destinations</button>
              <button onClick={() => navigate('/accommodations')} className="btn btn-ghost">Voir les hébergements</button>
              <button onClick={() => navigate('/activities')} className="btn btn-ghost">Voir les activités</button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              {filtered.length} favori{filtered.length > 1 ? 's' : ''}
            </p>
            <div className="grid-3">
              {filtered.map((fav, i) => {
                const cfg  = TYPE_CONFIG[fav.type_element] || TYPE_CONFIG.destination;
                const Icon = cfg.icon;
                return (
                  <motion.div key={fav.favori_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="card" style={{ overflow: 'hidden' }}>

                    {/* Image */}
                    <div style={{ height: 165, background: 'var(--dark-4)', position: 'relative', overflow: 'hidden' }}>
                      {fav.image
                        ? <img src={fav.image} alt={fav.nom_element} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                            onError={e => e.target.style.display = 'none'} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Icon size={38} style={{ color: cfg.color, opacity: 0.35 }} />
                          </div>
                      }
                      {/* Type badge */}
                      <span style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 100,
                        fontSize: '0.68rem', fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                        {cfg.label}
                      </span>
                      {/* Remove heart */}
                      <button onClick={() => remove(fav)}
                        style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%',
                          background: 'rgba(239,68,68,0.85)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                          backdropFilter: 'blur(4px)' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <Heart size={15} style={{ color: '#fff', fill: '#fff' }} />
                      </button>
                    </div>

                    <div style={{ padding: '16px 20px 20px' }}>
                      <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                        {fav.nom_element}
                      </h3>

                      {fav.localisation && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                          <MapPin size={11} style={{ color: '#C9A84C', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fav.localisation}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        {fav.note ? <StarRating rating={fav.note} size={11} /> : <span />}
                        {fav.prix && (
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#C9A84C' }}>
                            {Number(fav.prix).toLocaleString('fr-FR')} €
                          </span>
                        )}
                      </div>

                      <button onClick={() => navigate(cfg.link(fav.element_id))} className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '9px' }}>
                        Voir <ArrowRight size={13} style={{ marginLeft: 5 }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
