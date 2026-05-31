import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Hotel, Zap, Plane, X, Save, BarChart2, Package, Star, TrendingUp, MapPin } from 'lucide-react';
import { providerAPI, accommodationsAPI, activitiesAPI, transportsAPI, destinationsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';

const TABS = [
  { key: 'accommodations', label: 'Hébergements', icon: Hotel,   color: '#60a5fa' },
  { key: 'activities',     label: 'Activités',    icon: Zap,     color: '#4ade80' },
  { key: 'transports',     label: 'Transports',   icon: Plane,   color: '#f472b6' },
];

/* Objets vides pour les formulaires — noms de champs français (= colonnes BDD) */
const emptyAcc   = { nom: '', type: 'hotel', description: '', adresse: '', prix_nuit: '', capacite_max: 2, etoiles: 3, destination_id: '', equipements: [], images: [] };
const emptyAct   = { nom: '', categorie: 'circuit', description: '', prix: '', duree_heures: 2, participants_max: 10, destination_id: '', inclus: [], image: '' };
const emptyTrans = { type: 'vol', compagnie: '', ville_depart: '', ville_arrivee: '', code_depart: '', code_arrivee: '', heure_depart: '', heure_arrivee: '', prix: '', places_disponibles: 100, places_total: 180, classe: 'economique', est_direct: true, escales: 0 };

export default function ProviderDashboard() {
  const [tab, setTab]               = useState('accommodations');
  const [data, setData]             = useState({ accommodations: [], activities: [], transports: [], stats: {} });
  const [destinations, setDests]    = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // { type, item } or null
  const [form, setForm]             = useState({});
  const [saving, setSaving]         = useState(false);
  const [deleteConfirm, setDelConfirm] = useState(null);
  const { user }                    = useAuth();
  const { toast }                   = useToast();
  const navigate                    = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'prestataire' && user.role !== 'admin') { navigate('/'); return; }
    load();
    destinationsAPI.getAll({ limit: 100 }).then(r => setDests(r.data?.data ?? [])).catch(() => {});
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await providerAPI.getListings();
      setData(d);
    } catch { toast('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  const openAdd = (type) => {
    const empty = type === 'accommodations' ? emptyAcc : type === 'activities' ? emptyAct : emptyTrans;
    setForm({ ...empty });
    setModal({ type, item: null });
  };

  const openEdit = (type, item) => {
    setForm({ ...item });
    setModal({ type, item });
  };

  const closeModal = () => { setModal(null); setForm({}); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal.type === 'accommodations') {
        if (modal.item) {
          await accommodationsAPI.update(modal.item.id, form);
        } else {
          await accommodationsAPI.create(form);
        }
      } else if (modal.type === 'activities') {
        if (modal.item) {
          await activitiesAPI.update(modal.item.id, form);
        } else {
          await activitiesAPI.create(form);
        }
      } else if (modal.type === 'transports') {
        await transportsAPI.create(form);
      }
      toast(modal.item ? 'Modifié avec succès !' : 'Ajouté avec succès !', 'success');
      closeModal();
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Erreur', 'error');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.type === 'accommodations') await accommodationsAPI.delete(deleteConfirm.id);
      else if (deleteConfirm.type === 'activities') await activitiesAPI.delete(deleteConfirm.id);
      toast('Supprimé', 'success');
      setDelConfirm(null);
      load();
    } catch { toast('Erreur lors de la suppression', 'error'); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const statCards = [
    { icon: Hotel,      value: data.stats?.accommodations ?? 0, label: 'Hébergements',  color: '#60a5fa' },
    { icon: Zap,        value: data.stats?.activities ?? 0,     label: 'Activités',      color: '#4ade80' },
    { icon: Package,    value: data.stats?.bookings ?? 0,       label: 'Réservations',   color: '#C9A84C' },
    { icon: TrendingUp, value: (data.accommodations?.length ?? 0) + (data.activities?.length ?? 0), label: 'Offres totales', color: '#f472b6' },
  ];

  const currentItems = data[tab] ?? [];

  return (
    <div style={{ paddingTop: 70, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--dark-2), var(--dark))', padding: '40px 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ color: '#C9A84C', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Espace prestataire</p>
              <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Tableau de bord</h1>
              <p style={{ color: 'var(--text-muted)' }}>Gérez vos offres et suivez vos performances</p>
            </div>
            <button onClick={() => openAdd(tab)} className="btn btn-gold">
              <Plus size={16} /> Ajouter {tab === 'accommodations' ? 'un hébergement' : tab === 'activities' ? 'une activité' : 'un transport'}
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px 80px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 18, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Playfair Display', color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--dark-3)', borderRadius: 14, padding: 6, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                background: tab === t.key ? 'var(--dark-4)' : 'transparent',
                color: tab === t.key ? t.color : 'var(--text-muted)',
                boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}>
              <t.icon size={16} />
              {t.label}
              <span style={{ background: t.color + '22', color: t.color, borderRadius: 10, padding: '1px 8px', fontSize: '0.75rem' }}>
                {(data[t.key] ?? []).length}
              </span>
            </button>
          ))}
        </div>

        {/* Items list */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
          </div>
        ) : currentItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Hotel size={28} style={{ color: '#C9A84C', display: tab !== 'accommodations' ? 'none' : 'block' }} />
            <Zap  size={28} style={{ color: '#C9A84C', display: tab !== 'activities'     ? 'none' : 'block' }} />
            <Plane size={28} style={{ color: '#C9A84C', display: tab !== 'transports'    ? 'none' : 'block' }} />
          </div>
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400, marginBottom: 20 }}>Aucune offre pour l'instant</h3>
            <button onClick={() => openAdd(tab)} className="btn btn-gold">
              <Plus size={16} /> Créer ma première offre
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {currentItems.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
                {/* Image / header */}
                <div style={{ height: 130, background: 'var(--dark-4)', position: 'relative', overflow: 'hidden' }}>
                  {(item.images?.[0] || item.image) && (
                    <img src={item.images?.[0] || item.image} alt={item.nom || item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(tab, item)}
                      style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(96,165,250,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Edit2 size={14} />
                    </button>
                    {tab !== 'transports' && (
                      <button onClick={() => setDelConfirm({ id: item.id, name: item.nom || item.name, type: tab })}
                        style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(248,113,113,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <span style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', color: '#C9A84C', fontWeight: 600 }}>
                    {item.type || item.categorie || item.classe}
                  </span>
                </div>

                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: '1rem', fontFamily: 'Playfair Display', fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{item.nom || item.name || `${item.ville_depart || item.departure_city} → ${item.ville_arrivee || item.arrival_city}`}</h3>
                  {item.destination_name && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} style={{ color: '#C9A84C' }} /> {item.destination_name}</p>}
                  {(item.ville_depart) && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Plane size={11} style={{ color: '#C9A84C' }} /> {item.compagnie}</p>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1rem' }}>
                      {Number(item.prix_nuit || item.price_per_night || item.prix || item.price || 0).toLocaleString('fr-FR')} €
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {(item.prix_nuit || item.price_per_night) ? '/nuit' : (item.duree_heures || item.duration_hours) ? '/pers.' : ''}
                      </span>
                    </span>
                    {item.note > 0 && <StarRating rating={item.note} count={item.nombre_avis} size={11} />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'var(--dark-2)', border: '1px solid var(--border-light)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.3rem' }}>
                  {modal.item ? 'Modifier' : 'Ajouter'} {modal.type === 'accommodations' ? 'un hébergement' : modal.type === 'activities' ? 'une activité' : 'un transport'}
                </h2>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* HÉBERGEMENT */}
                {modal.type === 'accommodations' && (<>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Nom *</label>
                      <input value={form.nom || ''} onChange={e => set('nom', e.target.value)} className="input-field" placeholder="Villa Paradiso" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Type *</label>
                      <select value={form.type || 'hotel'} onChange={e => set('type', e.target.value)} className="input-field">
                        {['hotel','villa','appartement','auberge','resort'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Destination *</label>
                    <select value={form.destination_id || ''} onChange={e => set('destination_id', e.target.value)} className="input-field">
                      <option value="">Choisir une destination...</option>
                      {destinations.map(d => <option key={d.id} value={d.id}>{d.nom}, {d.pays}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} className="input-field" rows={3} placeholder="Description de l'hébergement..." style={{ resize: 'vertical' }} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Adresse</label>
                    <input value={form.adresse || ''} onChange={e => set('adresse', e.target.value)} className="input-field" placeholder="123 rue du Soleil, Bali" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Prix/nuit (€) *</label>
                      <input type="number" value={form.prix_nuit || ''} onChange={e => set('prix_nuit', e.target.value)} className="input-field" placeholder="250" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Capacité max</label>
                      <input type="number" value={form.capacite_max || 2} onChange={e => set('capacite_max', e.target.value)} className="input-field" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Étoiles</label>
                      <select value={form.etoiles || 3} onChange={e => set('etoiles', e.target.value)} className="input-field">
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">URL image principale</label>
                    <input value={form.images?.[0] || ''} onChange={e => set('images', [e.target.value])} className="input-field" placeholder="https://..." />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Équipements <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(séparés par virgule)</span></label>
                    <input value={Array.isArray(form.equipements) ? form.equipements.join(', ') : form.equipements || ''} onChange={e => set('equipements', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="input-field" placeholder="Piscine, Spa, WiFi, Restaurant..." />
                  </div>
                </>)}

                {/* ACTIVITÉ */}
                {modal.type === 'activities' && (<>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Nom *</label>
                      <input value={form.nom || ''} onChange={e => set('nom', e.target.value)} className="input-field" placeholder="Plongée sous-marine" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Catégorie *</label>
                      <select value={form.categorie || 'circuit'} onChange={e => set('categorie', e.target.value)} className="input-field">
                        {['aventure','culture','nature','bien_etre','gastronomie','famille','circuit'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Destination *</label>
                    <select value={form.destination_id || ''} onChange={e => set('destination_id', e.target.value)} className="input-field">
                      <option value="">Choisir une destination...</option>
                      {destinations.map(d => <option key={d.id} value={d.id}>{d.nom}, {d.pays}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} className="input-field" rows={3} placeholder="Description de l'activité..." style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Prix (€) *</label>
                      <input type="number" value={form.prix || ''} onChange={e => set('prix', e.target.value)} className="input-field" placeholder="95" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Durée (heures)</label>
                      <input type="number" step="0.5" value={form.duree_heures || 2} onChange={e => set('duree_heures', e.target.value)} className="input-field" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Participants max</label>
                      <input type="number" value={form.participants_max || 10} onChange={e => set('participants_max', e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">URL image</label>
                    <input value={form.image || ''} onChange={e => set('image', e.target.value)} className="input-field" placeholder="https://..." />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Inclus <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(séparés par virgule)</span></label>
                    <input value={Array.isArray(form.inclus) ? form.inclus.join(', ') : form.inclus || ''} onChange={e => set('inclus', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="input-field" placeholder="Équipement, Guide, Assurance..." />
                  </div>
                </>)}

                {/* TRANSPORT */}
                {modal.type === 'transports' && (<>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Type *</label>
                      <select value={form.type || 'vol'} onChange={e => set('type', e.target.value)} className="input-field">
                        <option value="vol">Vol</option>
                        <option value="train">Train</option>
                        <option value="bus">Bus</option>
                        <option value="voiture">Voiture</option>
                        <option value="ferry">Ferry</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Compagnie *</label>
                      <input value={form.compagnie || ''} onChange={e => set('compagnie', e.target.value)} className="input-field" placeholder="Air France" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Ville départ *</label>
                      <input value={form.ville_depart || ''} onChange={e => set('ville_depart', e.target.value)} className="input-field" placeholder="Paris" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Ville arrivée *</label>
                      <input value={form.ville_arrivee || ''} onChange={e => set('ville_arrivee', e.target.value)} className="input-field" placeholder="Dubaï" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Code départ</label>
                      <input value={form.code_depart || ''} onChange={e => set('code_depart', e.target.value)} className="input-field" placeholder="CDG" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Code arrivée</label>
                      <input value={form.code_arrivee || ''} onChange={e => set('code_arrivee', e.target.value)} className="input-field" placeholder="DXB" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Heure départ *</label>
                      <input type="datetime-local" value={form.heure_depart || ''} onChange={e => set('heure_depart', e.target.value)} className="input-field" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Heure arrivée *</label>
                      <input type="datetime-local" value={form.heure_arrivee || ''} onChange={e => set('heure_arrivee', e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Prix (€) *</label>
                      <input type="number" value={form.prix || ''} onChange={e => set('prix', e.target.value)} className="input-field" placeholder="350" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Places dispo</label>
                      <input type="number" value={form.places_disponibles || 100} onChange={e => set('places_disponibles', e.target.value)} className="input-field" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Classe</label>
                      <select value={form.classe || 'economique'} onChange={e => set('classe', e.target.value)} className="input-field">
                        <option value="economique">Économique</option>
                        <option value="affaires">Business</option>
                        <option value="premiere">Première</option>
                      </select>
                    </div>
                  </div>
                </>)}

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button onClick={closeModal} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
                  <button onClick={save} disabled={saving} className="btn btn-gold" style={{ flex: 2, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Enregistrement...' : <><Save size={16} /> {modal.item ? 'Mettre à jour' : 'Ajouter l\'offre'}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm delete */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ background: 'var(--dark-2)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={24} style={{ color: '#f87171' }} />
              </div>
              <h3 style={{ marginBottom: 8 }}>Supprimer cette offre ?</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
                "<strong>{deleteConfirm.name}</strong>" sera supprimé définitivement.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setDelConfirm(null)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
                <button onClick={confirmDelete} className="btn" style={{ flex: 1, justifyContent: 'center', background: '#f87171', color: '#fff', border: 'none' }}>
                  <Trash2 size={15} /> Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
