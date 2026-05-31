// ============================================================
// Transports.jsx — recherche de transports (vols, trains, bus…)
// L'utilisateur saisit un départ, une arrivée et une date.
// Les résultats s'affichent sous forme de liste horizontale.
// Il peut ensuite ajouter un transport à son itinéraire.
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Train, Bus, Car, Ship, Search, ArrowRight, Clock, Users, ChevronRight, Filter, Calendar } from 'lucide-react';
import { transportsAPI, itinerariesAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const TYPE_ICONS = { flight: Plane, train: Train, bus: Bus, car: Car, ferry: Ship };
const TYPE_LABELS = { flight: 'Vol', train: 'Train', bus: 'Bus', car: 'Voiture', ferry: 'Ferry' };

// Convertit une durée en minutes en format lisible (ex: 125 → "2h05")
function formatDuration(mins) {
  if (!mins) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

// Formate une date ISO en heure locale française (ex: "14:35")
function formatTime(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function TransportCard({ t, onBook }) {
  const Icon = TYPE_ICONS[t.type] || Plane;
  const occ  = Math.round(((t.places_total - t.places_disponibles) / t.places_total) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 18, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', transition: 'all 0.2s' }}
      whileHover={{ borderColor: 'rgba(201,168,76,0.25)', y: -2, boxShadow: 'var(--shadow)' }}>

      {/* Company & type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 140 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} style={{ color: '#C9A84C', transform: t.type === 'flight' ? 'rotate(-30deg)' : 'none' }} />
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.compagnie}</p>
          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{TYPE_LABELS[t.type]}</span>
        </div>
      </div>

      {/* Route */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, minWidth: 280 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Playfair Display', lineHeight: 1 }}>{formatTime(t.heure_depart)}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{t.ville_depart}</p>
          {t.code_depart && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t.code_depart}</p>}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDuration(t.duration_minutes)}</span>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 4 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            <Icon size={14} style={{ color: '#C9A84C', transform: t.type === 'flight' ? 'rotate(-30deg)' : 'none' }} />
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: t.est_direct ? '#4ade80' : 'var(--text-dim)' }}>
            {t.est_direct ? 'Direct' : `${t.escales} escale${t.escales > 1 ? 's' : ''}`}
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Playfair Display', lineHeight: 1 }}>{formatTime(t.heure_arrivee)}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{t.ville_arrivee}</p>
          {t.code_arrivee && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t.code_arrivee}</p>}
        </div>
      </div>

      {/* Class */}
      <div style={{ textAlign: 'center', minWidth: 80 }}>
        <span className="badge" style={{ background: t.classe === 'premiere' ? 'rgba(201,168,76,0.2)' : t.classe === 'affaires' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: t.classe === 'premiere' ? '#C9A84C' : t.classe === 'affaires' ? '#818cf8' : 'var(--text-muted)', fontSize: '0.7rem' }}>
          {t.classe === 'premiere' ? 'Première' : t.classe === 'affaires' ? 'Business' : 'Économique'}
        </span>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
          <Users size={11} style={{ display: 'inline', marginRight: 3 }} />
          {t.places_disponibles} places
        </p>
      </div>

      {/* Price & action */}
      <div style={{ textAlign: 'right', minWidth: 120 }}>
        <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display', lineHeight: 1 }}>{Number(t.prix).toLocaleString('fr-FR')} €</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 10 }}>par personne</p>
        <button onClick={() => onBook(t)} className="btn btn-gold" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
          Ajouter
        </button>
      </div>
    </motion.div>
  );
}

export default function Transports() {
  const [transports, setTransports] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState('');
  const [showItinModal, setShowItinModal] = useState(false);
  const [pendingTransport, setPendingTransport] = useState(null);
  const [searchParams] = useSearchParams();
  const itineraryId = searchParams.get('itinerary_id') || '';
  const destCity    = searchParams.get('dest_city') || '';
  const startDate   = searchParams.get('start_date') || '';
  const endDate     = searchParams.get('end_date') || '';
  const travelers   = parseInt(searchParams.get('travelers') || '1');
  const [filters, setFilters] = useState({
    type: '', from: '', to: destCity, date: startDate, class: '', sort: 'price', direct: false
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user) {
      itinerariesAPI.getAll().then(r => {
        setItineraries((r.data ?? []).filter(i => i.statut === 'brouillon'));
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (itineraryId) setSelectedItinerary(itineraryId);
  }, [itineraryId]);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = { ...filters };
      if (params.direct) params.direct = 1; else delete params.direct;
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await transportsAPI.search(params);
      setTransports(Array.isArray(data) ? data : (data?.data ?? []));
    } catch { toast('Erreur de recherche', 'error'); }
    finally { setLoading(false); }
  };

  const handleBook = (transport) => {
    if (!user) { toast('Connectez-vous pour ajouter un transport', 'info'); navigate('/login'); return; }
    setPendingTransport(transport);
    setShowItinModal(true);
  };

  const confirmBook = async () => {
    if (!selectedItinerary) { toast('Sélectionnez un itinéraire', 'error'); return; }
    try {
      await itinerariesAPI.update(selectedItinerary, { action: 'add_transport', transport_id: pendingTransport.id });
      toast('Transport ajouté à votre itinéraire !', 'success');
      setShowItinModal(false);
      navigate(`/itinerary/${selectedItinerary}`);
    } catch { toast('Erreur', 'error'); }
  };

  const upd = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div className="page" style={{ paddingTop: 70 }}>
      {itineraryId && (
        <div style={{ background: 'rgba(201,168,76,0.07)', borderBottom: '1px solid rgba(201,168,76,0.2)', padding: '10px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: '0.875rem', color: '#C9A84C', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plane size={14} />
              Transports {destCity ? `vers ${destCity}` : ''} — filtrés pour votre itinéraire
            </span>
            <button onClick={() => navigate(`/itinerary/${itineraryId}`)} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              ← Retour à l'itinéraire
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{ background: 'var(--dark-2)', padding: '48px 0 32px', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <p className="section-eyebrow">Planification</p>
          <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(1.8rem,4vw,3rem)' }}>Transports</h1>
          <p style={{ color: 'var(--text-muted)' }}>Vols, trains, bus — trouvez la meilleure option pour votre voyage</p>
        </div>
      </div>

      {/* Search panel */}
      <div style={{ background: 'var(--dark-3)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container" style={{ padding: '24px' }}>
          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { id: '', label: 'Tous', icon: null },
              ...Object.entries(TYPE_LABELS).map(([id, label]) => ({ id, label, icon: TYPE_ICONS[id] }))
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => upd('type', id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s', background: filters.type === id ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', color: filters.type === id ? '#C9A84C' : 'var(--text-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: filters.type === id ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)' }}>
                {Icon && <Icon size={13} style={{ transform: id === 'flight' ? 'rotate(-30deg)' : 'none' }} />}
                {label}
              </button>
            ))}
          </div>

          {/* Search form */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[
              { key: 'from', placeholder: 'Départ (ville)', type: 'text' },
              { key: 'to', placeholder: 'Arrivée (ville)', type: 'text' },
              { key: 'date', placeholder: 'Date', type: 'date' },
            ].map(({ key, placeholder, type }) => (
              <div key={key} style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{placeholder}</label>
                <input type={type} placeholder={placeholder} value={filters[key]} onChange={e => upd(key, e.target.value)} className="input-field" style={{ width: '100%' }} />
              </div>
            ))}
            <div style={{ minWidth: 140 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Classe</label>
              <select value={filters.class} onChange={e => upd('class', e.target.value)} className="input-field" style={{ width: '100%' }}>
                <option value="">Toutes classes</option>
                <option value="economique">Économique</option>
                <option value="affaires">Business</option>
                <option value="premiere">Première</option>
              </select>
            </div>
            <div style={{ minWidth: 140 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Trier par</label>
              <select value={filters.sort} onChange={e => upd('sort', e.target.value)} className="input-field" style={{ width: '100%' }}>
                <option value="price">Prix</option>
                <option value="duration">Durée</option>
                <option value="departure">Départ</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', paddingBottom: 1 }}>
              <input type="checkbox" checked={filters.direct} onChange={e => upd('direct', e.target.checked)} style={{ accentColor: '#C9A84C', width: 16, height: 16 }} />
              Vol direct
            </label>
            <button onClick={search} className="btn btn-gold" style={{ padding: '12px 28px', whiteSpace: 'nowrap' }}>
              <Search size={16} />
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ padding: '32px 24px' }}>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loader" /></div>}

        {!loading && searched && transports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Plane size={48} style={{ color: 'var(--text-dim)', margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Aucun transport trouvé</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: 8 }}>Essayez d'élargir vos critères de recherche</p>
          </div>
        )}

        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Plane size={52} style={{ display: 'block', margin: '0 auto 16px', color: '#C9A84C', opacity: 0.5, transform: 'rotate(-30deg)' }} />
            <h3 style={{ fontFamily: 'Playfair Display', marginBottom: 8 }}>Trouvez votre transport idéal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Renseignez votre destination et vos dates pour commencer</p>
          </div>
        )}

        {transports.length > 0 && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>{transports.length} option{transports.length > 1 ? 's' : ''} disponible{transports.length > 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transports.map(t => <TransportCard key={t.id} t={t} onBook={handleBook} />)}
            </div>
          </div>
        )}
      </div>

      {/* Modal sélection itinéraire */}
      {showItinModal && (
        <div className="modal-overlay" onClick={() => setShowItinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Ajouter à un itinéraire</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              {pendingTransport && `${pendingTransport.compagnie} — ${pendingTransport.ville_depart} → ${pendingTransport.ville_arrivee}`}
            </p>

            {/* Itinerary date hint */}
            {itineraryId && startDate && endDate && (
              <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={13} style={{ color: '#C9A84C', flexShrink: 0 }} />
                Itinéraire : {new Date(startDate).toLocaleDateString('fr-FR')} → {new Date(endDate).toLocaleDateString('fr-FR')}
                {travelers > 1 && <span style={{ marginLeft: 6 }}>· {travelers} voyageurs</span>}
              </div>
            )}

            {itineraries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Aucun itinéraire en cours.</p>
                <button onClick={() => { setShowItinModal(false); navigate('/itinerary'); }} className="btn btn-gold">
                  Créer un itinéraire
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {itineraries.map(it => (
                    <label key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: `1px solid ${selectedItinerary == it.id ? 'rgba(201,168,76,0.4)' : 'var(--border-light)'}`, background: selectedItinerary == it.id ? 'rgba(201,168,76,0.05)' : 'var(--dark-4)', cursor: 'pointer' }}>
                      <input type="radio" name="itinerary" value={it.id} checked={selectedItinerary == it.id} onChange={e => setSelectedItinerary(e.target.value)} style={{ accentColor: '#C9A84C' }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{it.titre}</p>
                        {it.destination_name && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} style={{ color: '#C9A84C' }} /> {it.destination_name}</p>}
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowItinModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Annuler</button>
                  <button onClick={confirmBook} className="btn btn-gold" style={{ flex: 1 }}>Ajouter</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
