import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, X, SlidersHorizontal, Heart, ArrowRight } from 'lucide-react';
import { destinationsAPI, usersAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StarRating from '../components/StarRating';

const CATEGORIES = [
  { id: '', label: 'Toutes' },
  { id: 'beach', label: '🏖️ Plages' },
  { id: 'mountain', label: '⛰️ Montagnes' },
  { id: 'city', label: '🏙️ Villes' },
  { id: 'island', label: '🌴 Îles' },
  { id: 'adventure', label: '🧗 Aventure' },
  { id: 'culture', label: '🏛️ Culture' },
  { id: 'nature', label: '🌿 Nature' },
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
        const favSet = new Set(r.data.filter(f => f.entity_type === 'destination').map(f => f.entity_id));
        setFavorites(favSet);
      }).catch(() => {});
    }
  }, [user]);

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
          <div className="grid-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 320, borderRadius: 20 }} />)}
          </div>
        ) : destinations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Aucune destination trouvée</h3>
            <button onClick={() => setFilters({ search: '', category: '', sort: 'featured', max_price: '' })} className="btn btn-outline" style={{ marginTop: 20 }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {destinations.map((dest, i) => (
              <motion.div key={dest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => navigate(`/destinations/${dest.id}`)}>
                {/* Image */}
                <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                  <img src={dest.image} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    onError={e => { e.target.style.background = '#1A1A28'; e.target.style.display = 'none'; }} />
                  <button onClick={e => toggleFavorite(e, dest.id)} style={{
                    position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <Heart size={16} style={{ fill: favorites.has(dest.id) ? '#ef4444' : 'transparent', stroke: favorites.has(dest.id) ? '#ef4444' : '#fff' }} />
                  </button>
                  {dest.is_featured && <span className="badge badge-gold" style={{ position: 'absolute', top: 14, left: 14, fontSize: '0.7rem' }}>⭐ Featured</span>}
                </div>

                {/* Info */}
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MapPin size={12} style={{ color: '#C9A84C' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dest.country}</span>
                    <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '2px 8px' }}>{dest.category}</span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: 10, fontFamily: 'Playfair Display', fontWeight: 700 }}>{dest.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {dest.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <StarRating rating={dest.rating} count={dest.reviews_count} size={13} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>À partir de</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#C9A84C' }}>{Number(dest.price_from).toLocaleString('fr-FR')} €</div>
                    </div>
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
