import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Compass, Trash2, ShoppingCart, Plus, ArrowRight, Check, Calendar, Users, MapPin, Clock, ChevronDown, AlertTriangle } from 'lucide-react';
import { itinerariesAPI, bookingsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ItineraryBuilder() {
  const { id }             = useParams();
  const [itineraries, setItineraries] = useState([]);
  const [current, setCurrent]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [payMethod, setPayMethod]     = useState('card');
  const [delConfirm, setDelConfirm]   = useState(false);
  const { user }                      = useAuth();
  const { toast }                     = useToast();
  const navigate                      = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadAll();
  }, [user]);

  useEffect(() => {
    if (id && itineraries.length > 0) {
      const found = itineraries.find(i => i.id == id);
      if (found) setCurrent(found);
    }
  }, [id, itineraries]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data } = await itinerariesAPI.getAll();
      setItineraries(data ?? []);
      if (id) {
        const found = data.find(i => i.id == id);
        setCurrent(found || (data.length > 0 ? data[0] : null));
      } else if (data.length > 0) {
        setCurrent(data[0]);
      }
    } catch { toast('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  const createNew = async () => {
    try {
      const { data } = await itinerariesAPI.create({ title: 'Nouveau voyage' });
      await loadAll();
      const { data: newIt } = await itinerariesAPI.getOne(data.id);
      setCurrent(newIt);
      navigate(`/itinerary/${data.id}`);
      toast('Nouvel itinéraire créé !', 'success');
    } catch { toast('Erreur', 'error'); }
  };

  const deleteItinerary = async () => {
    if (!current || current.statut === 'confirme') return;
    setDelConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await itinerariesAPI.delete(current.id);
      const remaining = itineraries.filter(i => i.id !== current.id);
      setItineraries(remaining);
      setCurrent(remaining[0] || null);
      navigate('/itinerary');
      toast('Itinéraire supprimé', 'success');
    } catch { toast('Erreur lors de la suppression', 'error'); }
    setDelConfirm(false);
  };

  const removeItem = async (action, itemId) => {
    if (!current) return;
    try {
      const { data } = await itinerariesAPI.update(current.id, { action, item_id: itemId });
      setCurrent(data);
      setItineraries(p => p.map(i => i.id === data.id ? data : i));
      toast('Élément supprimé', 'success');
    } catch { toast('Erreur', 'error'); }
  };

  const checkout = async () => {
    if (!current) return;
    try {
      await bookingsAPI.create({ itinerary_id: current.id, payment_method: payMethod });
      toast('Réservation confirmée ! 🎉', 'success');
      setShowCheckout(false);
      navigate('/bookings');
    } catch (err) { toast(err.response?.data?.error || 'Erreur', 'error'); }
  };

  if (loading) return <div style={{ paddingTop: 70, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loader" /></div>;

  if (!user) return null;

  const totalItems = current ? (current.transports?.length || 0) + (current.accommodations?.length || 0) + (current.activities?.length || 0) : 0;

  return (
    <div className="page" style={{ paddingTop: 70, minHeight: '100vh' }}>
      <div style={{ background: 'var(--dark-2)', borderBottom: '1px solid var(--border-light)', padding: '32px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="section-eyebrow">Composition</p>
            <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.5rem)', margin: '4px 0 0' }}>Mes itinéraires</h1>
          </div>
          <button onClick={createNew} className="btn btn-gold">
            <Plus size={16} /> Nouvel itinéraire
          </button>
        </div>
      </div>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, padding: '32px 24px', alignItems: 'start' }}>

        {/* Sidebar: list */}
        <div style={{ background: 'var(--dark-3)', borderRadius: 20, border: '1px solid var(--border-light)', overflow: 'hidden', position: 'sticky', top: 90 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mes voyages</p>
          </div>
          {itineraries.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>Aucun voyage planifié</p>
              <button onClick={createNew} className="btn btn-gold" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                Créer mon premier voyage
              </button>
            </div>
          ) : (
            <div>
              {itineraries.map(it => (
                <button key={it.id} onClick={() => { setCurrent(it); navigate(`/itinerary/${it.id}`); }}
                  style={{ width: '100%', padding: '14px 20px', border: 'none', background: current?.id === it.id ? 'rgba(201,168,76,0.08)' : 'transparent', cursor: 'pointer', textAlign: 'left', borderLeft: `3px solid ${current?.id === it.id ? '#C9A84C' : 'transparent'}`, transition: 'all 0.2s' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: current?.id === it.id ? '#C9A84C' : 'var(--text)', marginBottom: 4 }}>{it.titre}</p>
                  {it.destination_name && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> {it.destination_name}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 8px', background: it.statut === 'confirme' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', color: it.statut === 'confirme' ? '#4ade80' : 'var(--text-muted)' }}>
                      {it.statut === 'confirme' ? '✓ Confirmé' : 'Brouillon'}
                    </span>
                    {it.prix_total > 0 && <span style={{ fontSize: '0.8rem', color: '#C9A84C', fontWeight: 600 }}>{Number(it.prix_total).toLocaleString('fr-FR')} €</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main: itinerary detail */}
        {current ? (
          <div>
            <div style={{ background: 'var(--dark-3)', borderRadius: 20, border: '1px solid var(--border-light)', padding: 28, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ marginBottom: 8 }}>{current.titre}</h2>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {current.destination_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} style={{ color: '#C9A84C' }} /> {current.destination_name}
                      </span>
                    )}
                    {current.date_debut && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} style={{ color: '#C9A84C' }} />
                        {new Date(current.date_debut).toLocaleDateString('fr-FR')} → {current.date_fin && new Date(current.date_fin).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {current.voyageurs > 1 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <Users size={14} style={{ color: '#C9A84C' }} /> {current.voyageurs} voyageurs
                      </span>
                    )}
                  </div>
                </div>
                <span className="badge" style={{ background: current.statut === 'confirme' ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.1)', color: current.statut === 'confirme' ? '#4ade80' : '#C9A84C', padding: '6px 14px' }}>
                  {current.statut === 'confirme' ? '✓ Confirmé' : 'Brouillon'}
                </span>
              </div>

              {/* Quick add buttons */}
              {current.statut !== 'confirme' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { label: 'Transport', path: `/transports?itinerary_id=${current.id}&dest_city=${encodeURIComponent(current.destination_name||'')}&dest_id=${current.destination_id||''}&start_date=${current.date_debut||''}&end_date=${current.date_fin||''}&travelers=${current.voyageurs||1}`, icon: Plane },
                    { label: 'Hébergement', path: `/accommodations?itinerary_id=${current.id}&destination_id=${current.destination_id||''}&dest_name=${encodeURIComponent(current.destination_name||'')}&start_date=${current.date_debut||''}&end_date=${current.date_fin||''}&travelers=${current.voyageurs||1}`, icon: Hotel },
                    { label: 'Activité', path: `/activities?itinerary_id=${current.id}&destination_id=${current.destination_id||''}&dest_name=${encodeURIComponent(current.destination_name||'')}&start_date=${current.date_debut||''}&end_date=${current.date_fin||''}&travelers=${current.voyageurs||1}`, icon: Compass },
                  ].map(({ label, path, icon: Icon }) => (
                    <button key={path} onClick={() => navigate(path)} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
                      <Plus size={12} /> <Icon size={13} /> {label}
                    </button>
                  ))}
                  <button onClick={deleteItinerary} className="btn" style={{ fontSize: '0.8rem', padding: '8px 14px', marginLeft: 'auto', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                    <Trash2 size={13} /> Supprimer l'itinéraire
                  </button>
                </div>
              )}
            </div>

            {/* Transport section */}
            <Section title="Transports" icon={Plane} items={current.transports} color="#60a5fa"
              renderItem={t => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.compagnie}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.ville_depart} → {t.ville_arrivee}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{t.type}</span>
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{t.direction === 'outbound' ? 'Aller' : 'Retour'}</span>
                    </div>
                  </div>
                  <span style={{ color: '#C9A84C', fontWeight: 700 }}>{Number(t.prix || 0).toLocaleString('fr-FR')} €</span>
                </div>
              )}
              onRemove={current.statut !== 'confirme' ? (item) => removeItem('remove_transport', item.id) : null}
              emptyMsg="Aucun transport ajouté" />

            {/* Accommodation section */}
            <Section title="Hébergements" icon={Hotel} items={current.accommodations} color="#a78bfa"
              renderItem={a => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.nom}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(a.check_in).toLocaleDateString('fr-FR')} → {new Date(a.check_out).toLocaleDateString('fr-FR')}
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{a.type}</span>
                      {a.rooms > 1 && <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{a.rooms} chambres</span>}
                    </div>
                  </div>
                  <span style={{ color: '#C9A84C', fontWeight: 700 }}>{Number(a.prix || 0).toLocaleString('fr-FR')} €</span>
                </div>
              )}
              onRemove={current.statut !== 'confirme' ? (item) => removeItem('remove_accommodation', item.id) : null}
              emptyMsg="Aucun hébergement ajouté" />

            {/* Activities section */}
            <Section title="Activités" icon={Compass} items={current.activities} color="#4ade80"
              renderItem={a => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.nom}</p>
                    {a.scheduled_date && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(a.scheduled_date).toLocaleDateString('fr-FR')} à {a.scheduled_time?.slice(0, 5)}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>{a.categorie}</span>
                      {a.participants > 1 && <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{a.participants} pers.</span>}
                    </div>
                  </div>
                  <span style={{ color: '#C9A84C', fontWeight: 700 }}>{Number(a.prix || 0).toLocaleString('fr-FR')} €</span>
                </div>
              )}
              onRemove={current.statut !== 'confirme' ? (item) => removeItem('remove_activity', item.id) : null}
              emptyMsg="Aucune activité ajoutée" />

            {/* Total & checkout */}
            <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total du voyage</p>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display' }}>
                  {Number(current.prix_total || 0).toLocaleString('fr-FR')} €
                </span>
              </div>
              {current.statut !== 'confirme' && totalItems > 0 && (
                <button onClick={() => setShowCheckout(true)} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '14px' }}>
                  <ShoppingCart size={18} />
                  Procéder au paiement
                </button>
              )}
              {current.statut === 'confirme' && (
                <div style={{ textAlign: 'center', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Check size={18} />
                  Voyage confirmé et payé
                </div>
              )}
              {totalItems === 0 && current.statut !== 'confirme' && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.875rem' }}>Ajoutez des éléments pour composer votre voyage</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, background: 'var(--dark-3)', borderRadius: 20, border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✈️</div>
            <h3 style={{ fontFamily: 'Playfair Display', marginBottom: 8 }}>Prêt à voyager ?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>Créez votre premier itinéraire</p>
            <button onClick={createNew} className="btn btn-gold">
              <Plus size={16} /> Créer un itinéraire
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {delConfirm && (
        <div className="modal-overlay" onClick={() => setDelConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: '#f87171', margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: 8 }}>Supprimer cet itinéraire ?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
              "<strong>{current?.titre}</strong>" et tous ses éléments seront définitivement supprimés.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDelConfirm(false)} className="btn btn-ghost" style={{ flex: 1 }}>Annuler</button>
              <button onClick={confirmDelete} className="btn" style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none' }}>
                <Trash2 size={15} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && current && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 style={{ marginBottom: 4 }}>Paiement sécurisé</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>Simulation pédagogique — aucun paiement réel</p>

            <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
              <p style={{ fontWeight: 600, marginBottom: 12, fontFamily: 'Playfair Display' }}>{current.titre}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {current.transports?.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>✈ {t.compagnie} ({t.ville_depart} → {t.ville_arrivee})</span>
                    <span>{Number(t.prix || 0).toLocaleString('fr-FR')} €</span>
                  </div>
                ))}
                {current.accommodations?.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>🏨 {a.nom}</span>
                    <span>{Number(a.prix || 0).toLocaleString('fr-FR')} €</span>
                  </div>
                ))}
                {current.activities?.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>🎯 {a.nom}</span>
                    <span>{Number(a.prix || 0).toLocaleString('fr-FR')} €</span>
                  </div>
                ))}
                <div className="divider-gold" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#C9A84C' }}>
                  <span>Total</span>
                  <span>{Number(current.prix_total).toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Méthode de paiement</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="input-field">
                <option value="card">💳 Carte bancaire</option>
                <option value="paypal">🅿️ PayPal</option>
                <option value="transfer">🏦 Virement bancaire</option>
              </select>
            </div>

            {payMethod === 'card' && (
              <div style={{ background: 'var(--dark-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 8 }}>4242 4242 4242 4242</div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <span>MM/AA: 12/28</span>
                  <span>CVV: 123</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCheckout(false)} className="btn btn-ghost" style={{ flex: 1 }}>Annuler</button>
              <button onClick={checkout} className="btn btn-gold" style={{ flex: 1 }}>
                <Check size={16} /> Confirmer ({Number(current.prix_total).toLocaleString('fr-FR')} €)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, items, renderItem, onRemove, emptyMsg, color }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen(p => !p)} style={{ width: '100%', padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Inter' }}>
        <Icon size={18} style={{ color }} />
        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)', flex: 1 }}>{title}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: 100 }}>{items?.length || 0}</span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ borderTop: '1px solid var(--border-light)', padding: '12px 24px 20px' }}>
              {!items || items.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', padding: '12px 0', textAlign: 'center' }}>{emptyMsg}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => (
                    <div key={item.id} style={{ background: 'var(--dark-4)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>{renderItem(item)}</div>
                      {onRemove && (
                        <button onClick={() => onRemove(item)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
                          <Trash2 size={14} style={{ color: '#f87171' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
