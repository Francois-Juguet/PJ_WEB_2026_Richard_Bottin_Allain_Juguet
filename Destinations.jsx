// ============================================================
// Destinations.jsx — liste de toutes les destinations
// Permet de filtrer par catégorie, rechercher par nom,
// trier par note ou prix, et paginer les résultats.
// L'utilisateur connecté peut ajouter des destinations en favoris.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Heart, ArrowRight, Star } from 'lucide-react';
import { destinationsAPI, usersAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StarRating from '../components/StarRating';

/* Catégories sans emojis */
const CATEGORIES = [
  { id: '', label: 'Toutes' },
  { id: 'beach',    label: 'Plages' },
  { id: 'mountain', label: 'Montagnes' },
  { id: 'city',     label: 'Villes' },
  { id: 'island',   label: 'Îles' },
  { id: 'adventure',label: 'Aventure' },
  { id: 'culture',  label: 'Culture' },
  { id: 'nature',   label: 'Nature' },
];

export default function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(0);
  const [favorites, setFavorites]       = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters]           = useState({
    search:   searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort:     'featured',
    max_price: '',
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate  = useNavigate();

  useEffect(() => { fetchDestinations(); }, [filters, page]);

  useEffect(() => {
    if (user) {
      usersAPI.getFavorites().then(r => {
        const favSet = new Set(r.data.filter(f => f.type_element === 'destination').map(f => f.element_id));
        setFavorites(favSet);
      }).catch(() => {});
    }
  }, [user]);

  // Récupère les destinations depuis l'API selon les filtres actifs
  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const params = { page, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await destinationsAPI.getAll(params);
      setDestinations(data?.data ?? []);
      setTotal(data?.total ?? 0);
    } catch { toast('Erreur lors du chargement', 'error'); }
    finally { setLoading(false); }
  };

  // Ajoute ou retire une destination des favoris de l'utilisateur
  const toggleFavorite = async (e, destId) => {
    e.stopPropagation();
    if (!user) { toast('Connectez-vous pour ajouter des favoris', 'info'); return; }
    try {
      const { data } = await usersAPI.toggleFavorite({ entity_type: 'destination', entity_id: destId });
      setFavorites(prev => {
        const next = new Set(prev);
        data.favorited ? next.add(destId) : next.delete(destId);
        return next;
      });
      toast(data.message, 'success');
    } catch { toast('Erreur', 'error'); }
  };

  const updateFilter = (key, val) => { setFilters(p => ({ ...p, [key]: val })); setPage(0); };

  return (
    <div className="page" style={{ paddingTop: 70 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, var(--dark-2) 0%, var(--dark) 100%)', padding: '48px 0 32px', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <p className="section-eyebrow">Explorer</p>
          <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(1.8rem,4vw,3rem)' }}>Destinations</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>{total} destinations disponibles</p>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 700 }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input value={filters.search} onChange={e => updateFilter('search', e.target.value)}
                placeholder="Rechercher une destination..." className="input-field"
                style={{ width: '100%', paddingLeft: 42 }} />
            </div>
            <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className="input-field" style={{ minWidth: 160 }}>
              <option value="featured">Sélection</option>
              <option value="rating">Mieux notés</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => updateFilter('category', cat.id)} style={{
                padding: '6px 16px', borderRadius: 100, fontSize: '0.85rem', cursor: 'pointer', border: 'none', fontFamily: 'Inter', transition: 'all 0.2s',
                background: filters.category === cat.id ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                color: filters.category === cat.id ? '#C9A84C' : 'var(--text-muted)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: filters.category === cat.id ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)',
              }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container section">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 155, borderRadius: 14 }} />)}
          </div>
        ) : destinations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Search size={48} style={{ display: 'block', margin: '0 auto 16px', color: 'var(--text-dim)', opacity: 0.4 }} />
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Aucune destination trouvée</h3>
            <button onClick={() => setFilters({ search: '', category: '', sort: 'featured', max_price: '' })} className="btn btn-outline" style={{ marginTop: 20 }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {destinations.map((dest, i) => (
              <motion.div key={dest.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: 'var(--dark-3)', border: '1px solid var(--border-light)', transition: 'all 0.22s' }}
                onClick={() => navigate(`/destinations/${dest.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'none'; }}>

                {/* Image à gauche */}
                <div style={{ width: 220, minWidth: 220, height: 155, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={dest.image} alt={dest.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.07)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    onError={e => e.target.style.display = 'none'} />
                  {dest.est_vedette && <span className="badge badge-gold" style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 3 }}><Star size={9} style={{ fill: '#C9A84C', stroke: 'none' }} /> Sélection</span>}
                </div>

                {/* Infos au centre */}
                <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <MapPin size={11} style={{ color: '#C9A84C' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dest.pays}</span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.65rem', padding: '2px 7px' }}>{dest.categorie}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontFamily: 'Playfair Display', fontWeight: 700, marginBottom: 6, lineHeight: 1.2 }}>{dest.nom}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>{dest.description}</p>
                    <StarRating rating={dest.note} count={dest.nombre_avis} size={12} />
                  </div>

                  {/* Prix + favoris à droite */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 2 }}>À partir de</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display' }}>{Number(dest.prix_depuis).toLocaleString('fr-FR')} €</div>
                    <button onClick={e => toggleFavorite(e, dest.id)} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', transition: 'all 0.2s' }}>
                      <Heart size={13} style={{ fill: favorites.has(dest.id) ? '#ef4444' : 'transparent', stroke: favorites.has(dest.id) ? '#ef4444' : 'currentColor' }} />
                      {favorites.has(dest.id) ? 'Favori' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn btn-ghost" style={{ opacity: page === 0 ? 0.4 : 1 }}>Précédent</button>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0 16px' }}>
              Page {page + 1} / {Math.ceil(total / 12)}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 12 >= total} className="btn btn-ghost" style={{ opacity: (page + 1) * 12 >= total ? 0.4 : 1 }}>Suivant</button>
          </div>
        )}
      </div>
    </div>
  );
}
