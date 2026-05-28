import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hotel, Search, Wifi, Coffee, Dumbbell, Waves, Users, MapPin, Calendar, Heart } from 'lucide-react';
import { accommodationsAPI, itinerariesAPI, destinationsAPI, usersAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StarRating from '../components/StarRating';

const AMENITY_ICONS = { WiFi: Wifi, Spa: Coffee, Piscine: Waves, Fitness: Dumbbell };

export default function Accommodations() {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [destinations, setDestinations]     = useState([]);
  const [itineraries, setItineraries]       = useState([]);
  const [selectedAcc, setSelectedAcc]       = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [favSet, setFavSet]                 = useState(new Set());
  const [searchParams]                      = useSearchParams();

  const itineraryId = searchParams.get('itinerary_id') || '';
  const destName    = searchParams.get('dest_name') || '';
  const startDate   = searchParams.get('start_date') || '';
  const endDate     = searchParams.get('end_date') || '';
  const travelers   = parseInt(searchParams.get('travelers') || '1');

  const [bookData, setBookData] = useState({
    itinerary_id: itineraryId,
    check_in:  startDate,
    check_out: endDate,
    rooms: 1,
  });
  const [filters, setFilters] = useState({
    destination_id: searchParams.get('destination_id') || '',
    type: '', min_price: '', max_price: '', stars: '', sort: 'rating'
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
        setFavSet(new Set(arr.filter(f => f.entity_type === 'accommodation').map(f => String(f.entity_id))));
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => { fetchAccommodations(); }, [filters]);

  const fetchAccommodations = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await accommodationsAPI.getAll(params);
      setAccommodations(Array.isArray(data) ? data : (data?.data ?? []));
    } catch { toast('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  const openBook = (acc) => {
    if (!user) { toast('Connectez-vous pour réserver', 'info'); navigate('/login'); return; }
    setSelectedAcc(acc);
    setShowModal(true);
  };

  const confirmBook = async () => {
    if (!bookData.itinerary_id || !bookData.check_in || !bookData.check_out) {
      toast('Remplissez tous les champs', 'error'); return;
    }
    try {
      await itinerariesAPI.update(bookData.itinerary_id, {
        action: 'add_accommodation',
        accommodation_id: selectedAcc.id,
        check_in: bookData.check_in,
        check_out: bookData.check_out,
        rooms: bookData.rooms
      });
      toast('Hébergement ajouté !', 'success');
      setShowModal(false);
      navigate(`/itinerary/${bookData.itinerary_id}`);
    } catch { toast('Erreur', 'error'); }
  };

  const toggleFav = async (e, acc) => {
    e.stopPropagation();
    if (!user) { toast('Connectez-vous pour ajouter aux favoris', 'info'); navigate('/login'); return; }
    try {
      const { data } = await usersAPI.toggleFavorite({ entity_type: 'accommodation', entity_id: acc.id });
      setFavSet(p => {
        const next = new Set(p);
        if (data.favorited) next.add(String(acc.id)); else next.delete(String(acc.id));
        return next;
      });
      toast(data.favorited ? '❤️ Ajouté aux favoris' : 'Retiré des favoris', data.favorited ? 'success' : 'info');
    } catch { toast('Erreur', 'error'); }
  };

  const upd = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const nights = bookData.check_in && bookData.check_out
    ? Math.max(0, (new Date(bookData.check_out) - new Date(bookData.check_in)) / 86400000)
    : 0;

  return (
    <div className="page" style={{ paddingTop: 70 }}>

      {/* Itinerary context banner */}
      {itineraryId && (
        <div style={{ background: 'rgba(201,168,76,0.07)', borderBottom: '1px solid rgba(201,168,76,0.2)', padding: '10px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: '0.875rem', color: '#C9A84C' }}>
              🗺️ Hébergements {destName ? `à ${destName}` : ''} — filtrés pour votre itinéraire
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
          <p className="section-eyebrow">Séjours</p>
          <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(1.8rem,4vw,3rem)' }}>Hébergements{destName ? ` — ${destName}` : ''}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Hôtels luxueux, villas privées, resorts d'exception</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--dark-3)', borderBottom: '1px solid var(--border-light)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 180 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Destination</label>
            <select value={filters.destination_id} onChange={e => upd('destination_id', e.target.value)} className="input-field" style={{ width: '100%' }}>
              <option value="">Toutes destinations</option>
              {destinations.map(d => <option key={d.id} value={d.id}>{d.name}, {d.country}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 130 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Type</label>
            <select value={filters.type} onChange={e => upd('type', e.target.value)} className="input-field" style={{ width: '100%' }}>
              <option value="">Tous types</option>
              {['hotel', 'villa', 'apartment', 'hostel', 'resort'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 110 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Étoiles min.</label>
            <select value={filters.stars} onChange={e => upd('stars', e.target.value)} className="input-field" style={{ width: '100%' }}>
              <option value="">Toutes</option>
              {[3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Budget max/nuit</label>
            <input type="number" placeholder="€ max" value={filters.max_price} onChange={e => upd('max_price', e.target.value)} className="input-field" style={{ width: '100%' }} />
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Trier par</label>
            <select value={filters.sort} onChange={e => upd('sort', e.target.value)} className="input-field" style={{ width: '100%' }}>
              <option value="rating">Note</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="stars">Étoiles</option>
            </select>
          </div>
        </div>
      </div>

      <div className="container section">
        {loading ? (
          <div className="grid-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 340, borderRadius: 20 }} />)}</div>
        ) : !Array.isArray(accommodations) || accommodations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Hotel size={48} style={{ color: 'var(--text-dim)', display: 'block', margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Aucun hébergement trouvé</h3>
          </div>
        ) : (
          <div className="grid-3">
            {accommodations.map((acc, i) => {
              const imgs      = Array.isArray(acc.images) ? acc.images : (typeof acc.images === 'string' ? JSON.parse(acc.images || '[]') : []);
              const amenities = Array.isArray(acc.amenities) ? acc.amenities : (typeof acc.amenities === 'string' ? JSON.parse(acc.amenities || '[]') : []);
              const isFav     = favSet.has(String(acc.id));
              return (
                <motion.div key={acc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ height: 200, background: 'var(--dark-4)', position: 'relative', overflow: 'hidden' }}>
                    {imgs[0]
                      ? <img src={imgs[0]} alt={acc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                          onError={e => e.target.style.display = 'none'} />
                      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Hotel size={40} style={{ color: 'var(--text-dim)', opacity: 0.3 }} /></div>
                    }
                    <span className="badge badge-gold" style={{ position: 'absolute', top: 14, left: 14, fontSize: '0.7rem' }}>{acc.type}</span>
                    {/* Heart / favorite button */}
                    <button onClick={e => toggleFav(e, acc)}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontFamily: 'Playfair Display', fontWeight: 700, marginBottom: 4 }}>{acc.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={11} style={{ color: '#C9A84C' }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.destination_name}, {acc.country}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#C9A84C', fontSize: '1.1rem', fontWeight: 700 }}>{Number(acc.price_per_night).toLocaleString('fr-FR')} €</span>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/nuit</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
                      <StarRating rating={acc.rating} count={acc.reviews_count} size={12} />
                      {acc.stars > 0 && <span style={{ color: '#C9A84C', fontSize: '0.8rem', marginLeft: 4 }}>{'★'.repeat(acc.stars)}</span>}
                    </div>

                    {amenities.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                        {amenities.slice(0, 4).map(a => (
                          <span key={a} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{a}</span>
                        ))}
                        {amenities.length > 4 && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>+{amenities.length - 4}</span>}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={12} style={{ color: 'var(--text-dim)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jusqu'à {acc.max_capacity} personnes</span>
                    </div>

                    <button onClick={() => openBook(acc)} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '10px' }}>
                      Réserver
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && selectedAcc && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4 }}>Réserver</h3>
            <p style={{ color: 'var(--gold)', fontFamily: 'Playfair Display', fontSize: '1.1rem', marginBottom: 20 }}>{selectedAcc.name}</p>

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
                  <option value="">Sélectionner un itinéraire</option>
                  {itineraries.map(it => <option key={it.id} value={it.id}>{it.title}</option>)}
                </select>
                {itineraries.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Aucun itinéraire en cours — <button onClick={() => navigate('/itinerary')} style={{ color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer' }}>en créer un</button></p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Arrivée</label>
                  <input type="date" value={bookData.check_in}
                    min={startDate || undefined} max={endDate || undefined}
                    onChange={e => setBookData(p => ({ ...p, check_in: e.target.value }))} className="input-field" />
                </div>
                <div className="input-group">
                  <label className="input-label">Départ</label>
                  <input type="date" value={bookData.check_out}
                    min={bookData.check_in || startDate || undefined} max={endDate || undefined}
                    onChange={e => setBookData(p => ({ ...p, check_out: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Chambres</label>
                <select value={bookData.rooms} onChange={e => setBookData(p => ({ ...p, rooms: e.target.value }))} className="input-field">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} chambre{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              {nights > 0 && (
                <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{nights} nuit{nights > 1 ? 's' : ''} × {bookData.rooms} chambre{bookData.rooms > 1 ? 's' : ''}</span>
                    <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1.2rem' }}>
                      {(nights * selectedAcc.price_per_night * bookData.rooms).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Annuler</button>
              <button onClick={confirmBook} className="btn btn-gold" style={{ flex: 1 }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
