// ============================================================
// Accommodations.jsx — liste des hébergements disponibles
// Filtres par destination, type, nombre d'étoiles et budget.
// Modale de réservation avec sélection des dates et du nombre
// de chambres — calcul automatique du prix total.
// ============================================================

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
      itinerariesAPI.getAll().then(r => setItineraries((r.data ?? []).filter(i => i.statut === 'brouillon'))).catch(() => {});
      usersAPI.getFavorites().then(r => {
        const arr = Array.isArray(r.data) ? r.data : [];
        setFavSet(new Set(arr.filter(f => f.type_element === 'hebergement').map(f => String(f.element_id))));
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
      const { data } = await usersAPI.toggleFavorite({ type_element: 'hebergement', element_id: acc.id });
      setFavSet(p => {
        const next = new Set(p);
        if (data.en_favori) next.add(String(acc.id)); else next.delete(String(acc.id));
        return next;
      });
      toast(data.favorited ? 'Ajouté aux favoris' : 'Retiré des favoris', data.favorited ? 'success' : 'info');
    } catch { toast('Erreur', 'error'); }
  };

  const upd = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  // Calcul du nombre de nuits entre les deux dates choisies
  const nights = bookData.check_in && bookData.check_out
    ? Math.max(0, (new Date(bookData.check_out) - new Date(bookData.check_in)) / 86400000)
    : 0;

  return (
    <div className="page" style={{ paddingTop: 70 }}>

      {/* Itinerary context banner */}
      {itineraryId && (
        <div style={{ background: 'rgba(201,168,76,0.07)', borderBottom: '1px solid rgba(201,168,76,0.2)', padding: '10px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: '0.875rem', color: '#C9A84C', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hotel size={14} />
              Hébergements {destName ? `à ${destName}` : ''} — filtrés pour votre itinéraire
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
              {destinations.map(d => <option key={d.id} value={d.id}>{d.nom}, {d.pays}</option>)}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 14 }} />)}</div>
        ) : !Array.isArray(accommodations) || accommodations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Hotel size={48} style={{ color: 'var(--text-dim)', display: 'block', margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Aucun hébergement trouvé</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {accommodations.map((acc, i) => {
              const imgs      = Array.isArray(acc.images) ? acc.images : (typeof acc.images === 'string' ? JSON.parse(acc.images || '[]') : []);
              const amenities = Array.isArray(acc.equipements) ? acc.equipements : (typeof acc.equipements === 'string' ? JSON.parse(acc.equipements || '[]') : []);
              const isFav     = favSet.has(String(acc.id));
              return (
                <motion.div key={acc.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', background: 'var(--dark-3)', border: '1px solid var(--border-light)', transition: 'all 0.22s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'none'; }}>

                  {/* Image à gauche */}
                  <div style={{ width: 200, minWidth: 200, height: 150, background: 'var(--dark-4)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    {imgs[0]
                      ? <img src={imgs[0]} alt={acc.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                          onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                          onError={e => e.target.style.display = 'none'} />
                      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Hotel size={36} style={{ color: 'var(--text-dim)', opacity: 0.3 }} /></div>
                    }
                    <span className="badge badge-gold" style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.65rem' }}>{acc.type}</span>
                  </div>

                  {/* Infos au centre */}
                  <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <h3 style={{ fontSize: '1.05rem', fontFamily: 'Playfair Display', fontWeight: 700, marginBottom: 5 }}>{acc.nom}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                        <MapPin size={11} style={{ color: '#C9A84C' }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{acc.destination_name}, {acc.country}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <StarRating rating={acc.note} count={acc.nombre_avis} size={12} />
                        {acc.etoiles > 0 && <span style={{ color: '#C9A84C', fontSize: '0.78rem' }}>{'★'.repeat(acc.etoiles)}</span>}
                      </div>
                      {amenities.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {amenities.slice(0, 4).map(a => (
                            <span key={a} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{a}</span>
                          ))}
                          {amenities.length > 4 && <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>+{amenities.length - 4}</span>}
                        </div>
                      )}
                    </div>

                    {/* Prix + actions à droite */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ color: '#C9A84C', fontSize: '1.3rem', fontWeight: 700, fontFamily: 'Playfair Display' }}>{Number(acc.prix_nuit).toLocaleString('fr-FR')} €</span>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 10 }}>/nuit</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button onClick={() => openBook(acc)} className="btn btn-gold" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>Réserver</button>
                        <button onClick={e => toggleFav(e, acc)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <Heart size={12} style={{ fill: isFav ? '#ef4444' : 'transparent', stroke: isFav ? '#ef4444' : 'currentColor' }} />
                          {isFav ? 'Favori' : 'Ajouter'}
                        </button>
                      </div>
                    </div>
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
            <p style={{ color: 'var(--gold)', fontFamily: 'Playfair Display', fontSize: '1.1rem', marginBottom: 20 }}>{selectedAcc.nom}</p>

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
                  {itineraries.map(it => <option key={it.id} value={it.id}>{it.titre}</option>)}
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
                      {(nights * selectedAcc.prix_nuit * bookData.rooms).toLocaleString('fr-FR')} €
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
