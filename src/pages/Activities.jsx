import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Clock, Users, MapPin, Search, Heart, Calendar } from 'lucide-react';
import { activitiesAPI, itinerariesAPI, destinationsAPI, usersAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StarRating from '../components/StarRating';

const CATEGORIES = ['adventure', 'culture', 'nature', 'wellness', 'gastronomy', 'family', 'tour'];
const CAT_LABELS = { adventure: '🧗 Aventure', culture: '🏛️ Culture', nature: '🌿 Nature', wellness: '🧘 Bien-être', gastronomy: '🍽️ Gastronomie', family: '👨‍👩‍👧 Famille', tour: '🗺️ Tour' };
const CAT_COLORS = { adventure: '#f97316', culture: '#a78bfa', nature: '#4ade80', wellness: '#38bdf8', gastronomy: '#fb923c', family: '#f472b6', tour: '#60a5fa' };

export default function Activities() {
  const [activities, setActivities]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [itineraries, setItineraries]   = useState([]);
  const [selected, setSelected]         = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [favSet, setFavSet]             = useState(new Set());
  const [searchParams]                  = useSearchParams();

  const itineraryId = searchParams.get('itinerary_id') || '';
  const destName    = searchParams.get('dest_name') || '';
  const startDate   = searchParams.get('start_date') || '';
  const endDate     = searchParams.get('end_date') || '';
  const travelers   = parseInt(searchParams.get('travelers') || '1');

  const [bookData, setBookData] = useState({
    itinerary_id:   itineraryId,
    scheduled_date: startDate,
    scheduled_time: '09:00',
    participants:   travelers || 1,
  });
  const [filters, setFilters] = useState({
    destination_id: searchParams.get('destination_id') || '',
    category: '', search: '', max_price: '', sort: 'rating'
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate  = useNavigate();

  useEffect(() => {
    destinationsAPI.getAll({ limit: 50 }).then(r => setDestinations(r.data?.data ?? [])).catch(() => {});
    if (user) {
      itinerariesAPI.getAll().then(r => setItineraries((r.data ?? []).filter(i => i.status === 'draft'))).catch(() => {});
      usersAPI.getFavorites().then(r => {
        const arr = Array.isArray(r.data) ? r.data : [];
        setFavSet(new Set(arr.filter(f => f.entity_type === 'activity').map(f => String(f.entity_id))));
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => { fetchActivities(); }, [filters]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await activitiesAPI.getAll(params);
      setActivities(Array.isArray(data) ? data : (data?.data ?? []));
    } catch { toast('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  const openBook = (act) => {
    if (!user) { toast('Connectez-vous pour ajouter une activité', 'info'); navigate('/login'); return; }
    setSelected(act);
    setShowModal(true);
  };

  const confirmBook = async () => {
    if (!bookData.itinerary_id || !bookData.scheduled_date) { toast('Remplissez tous les champs', 'error'); return; }
    try {
      await itinerariesAPI.update(bookData.itinerary_id, { action: 'add_activity', activity_id: selected.id, ...bookData });
      toast('Activité ajoutée à votre itinéraire !', 'success');
      setShowModal(false);
      navigate(`/itinerary/${bookData.itinerary_id}`);
    } catch { toast('Erreur', 'error'); }
  };

  const toggleFav = async (e, act) => {
    e.stopPropagation();
    if (!user) { toast('Connectez-vous pour ajouter aux favoris', 'info'); navigate('/login'); return; }
    try {
      const { data } = await usersAPI.toggleFavorite({ entity_type: 'activity', entity_id: act.id });
      setFavSet(p => {
        const next = new Set(p);
        if (data.favorited) next.add(String(act.id)); else next.delete(String(act.id));
        return next;
      });
      toast(data.favorited ? '❤️ Ajouté aux favoris' : 'Retiré des favoris', data.favorited ? 'success' : 'info');
    } catch { toast('Erreur', 'error'); }
  };

  const upd = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div className="page" style={{ paddingTop: 70 }}>

      {/* Itinerary context banner */}
      {itineraryId && (
        <div style={{ background: 'rgba(201,168,76,0.07)', borderBottom: '1px solid rgba(201,168,76,0.2)', padding: '10px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: '0.875rem', color: '#C9A84C' }}>
              🗺️ Activités {destName ? `à ${destName}` : ''} — filtrées pour votre itinéraire
              {startDate && endDate && (
                <span style={{ marginLeft: 10, opacity: 0.8 }}>
                  · {new Date(startDate).toLocaleDateString('fr-FR')} → {new Date(endDate).toLocaleDateString('fr-FR')}
                </span>
              )}
            </span>
            <button onClick={() => navigate(`/itinerary/${itineraryId}`)} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              ← Retour à l'itinéraire
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--dark-2)', padding: '48px 0 32px', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <p className="section-eyebrow">Expériences</p>
          <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(1.8rem,4vw,3rem)' }}>Activités{destName ? ` — ${destName}` : ''}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Plongée, gastronomie, culture — vivez des expériences uniques</p>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
            <button onClick={() => upd('category', '')} style={{ padding: '6px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.85rem', transition: 'all 0.2s', background: !filters.category ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', color: !filters.category ? '#C9A84C' : 'var(--text-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: !filters.category ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)' }}>
              Toutes
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => upd('category', cat)} style={{ padding: '6px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.85rem', transition: 'all 0.2s', background: filters.category === cat ? `rgba(${cat === 'adventure' ? '249,115,22' : '201,168,76'},0.15)` : 'rgba(255,255,255,0.05)', color: filters.category === cat ? CAT_COLORS[cat] : 'var(--text-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: filters.category === cat ? CAT_COLORS[cat] + '66' : 'rgba(255,255,255,0.08)' }}>
                {CAT_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search row */}
      <div style={{ background: 'var(--dark-3)', borderBottom: '1px solid var(--border-light)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input placeholder="Rechercher une activité..." value={filters.search} onChange={e => upd('search', e.target.value)} className="input-field" style={{ width: '100%', paddingLeft: 36 }} />
          </div>
          <select value={filters.destination_id} onChange={e => upd('destination_id', e.target.value)} className="input-field" style={{ minWidth: 180 }}>
            <option value="">Toutes destinations</option>
            {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input type="number" placeholder="Budget max (€)" value={filters.max_price} onChange={e => upd('max_price', e.target.value)} className="input-field" style={{ width: 140 }} />
          <select value={filters.sort} onChange={e => upd('sort', e.target.value)} className="input-field" style={{ minWidth: 140 }}>
            <option value="rating">Mieux notés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="duration">Durée</option>
          </select>
        </div>
      </div>

      <div className="container section">
        {loading ? (
          <div className="grid-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 20 }} />)}</div>
        ) : !Array.isArray(activities) || activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Compass size={48} style={{ display: 'block', margin: '0 auto 16px', color: 'var(--text-dim)', opacity: 0.4 }} />
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Aucune activité trouvée</h3>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>{activities.length} activité{activities.length > 1 ? 's' : ''}</p>
            <div className="grid-3">
              {activities.map((act, i) => {
                const included = Array.isArray(act.included) ? act.included : (typeof act.included === 'string' ? JSON.parse(act.included || '[]') : []);
                const isFav    = favSet.has(String(act.id));
                return (
                  <motion.div key={act.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ height: 180, background: 'var(--dark-4)', position: 'relative', overflow: 'hidden' }}>
                      {act.image
                        ? <img src={act.image} alt={act.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                            onError={e => e.target.style.display = 'none'} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Compass size={40} style={{ color: 'var(--text-dim)', opacity: 0.3 }} /></div>
                      }
                      <span style={{ position: 'absolute', top: 14, left: 14, padding: '4px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600, background: CAT_COLORS[act.category] + '33', color: CAT_COLORS[act.category], border: `1px solid ${CAT_COLORS[act.category]}55` }}>
                        {CAT_LABELS[act.category]}
                      </span>
                      {/* Heart / favorite button */}
                      <button onClick={e => toggleFav(e, act)}
                        style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%',
                          background: isFav ? 'rgba(239,68,68,0.85)' : 'rgba(0,0,0,0.45)',
                          border: isFav ? 'none' : '1px solid rgba(255,255,255,0.15)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <Heart size={15} style={{ color: '#fff', fill: isFav ? '#fff' : 'transparent' }} />
                      </button>
                    </div>

                    <div style={{ padding: 20 }}>
                      <h3 style={{ fontSize: '1rem', fontFamily: 'Playfair Display', fontWeight: 700, marginBottom: 6 }}>{act.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <MapPin size={11} style={{ color: '#C9A84C' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.destination_name}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <Clock size={12} /> {act.duration_hours}h
                        </div>
                        {act.max_participants && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <Users size={12} /> max {act.max_participants}
                          </div>
                        )}
                      </div>

                      <StarRating rating={act.rating} count={act.reviews_count} size={12} />

                      {included.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {included.slice(0, 3).map(item => (
                            <span key={item} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 100, background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>✓ {item}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                        <div>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#C9A84C' }}>{Number(act.price).toLocaleString('fr-FR')} €</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}> /pers.</span>
                        </div>
                        <button onClick={() => openBook(act)} className="btn btn-gold" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && selected && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4 }}>Ajouter l'activité</h3>
            <p style={{ color: 'var(--gold)', fontFamily: 'Playfair Display', fontSize: '1.05rem', marginBottom: 20 }}>{selected.name}</p>

            {/* Itinerary date hint */}
            {itineraryId && startDate && endDate && (
              <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={13} style={{ color: '#C9A84C', flexShrink: 0 }} />
                Itinéraire : {new Date(startDate).toLocaleDateString('fr-FR')} → {new Date(endDate).toLocaleDateString('fr-FR')}
                {travelers > 1 && <span style={{ marginLeft: 6 }}>· {travelers} voyageurs</span>}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Itinéraire</label>
                <select value={bookData.itinerary_id} onChange={e => setBookData(p => ({ ...p, itinerary_id: e.target.value }))} className="input-field">
                  <option value="">Sélectionner</option>
                  {itineraries.map(it => <option key={it.id} value={it.id}>{it.title}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input type="date" value={bookData.scheduled_date}
                    min={startDate || undefined} max={endDate || undefined}
                    onChange={e => setBookData(p => ({ ...p, scheduled_date: e.target.value }))} className="input-field" />
                </div>
                <div className="input-group">
                  <label className="input-label">Heure</label>
                  <input type="time" value={bookData.scheduled_time} onChange={e => setBookData(p => ({ ...p, scheduled_time: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Participants</label>
                <select value={bookData.participants} onChange={e => setBookData(p => ({ ...p, participants: e.target.value }))} className="input-field">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total</span>
                <span style={{ color: '#C9A84C', fontWeight: 700 }}>{(selected.price * bookData.participants).toLocaleString('fr-FR')} €</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Annuler</button>
              <button onClick={confirmBook} className="btn btn-gold" style={{ flex: 1 }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
