import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, ShoppingBag, TrendingUp, Trash2, Globe, Star, Check } from 'lucide-react';
import { destinationsAPI, bookingsAPI, accommodationsAPI, activitiesAPI, transportsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats]         = useState({ destinations: 0, bookings: 0 });
  const [destinations, setDestinations] = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading]     = useState(true);
  const { user, isAdmin }         = useAuth();
  const { toast }                 = useToast();
  const navigate                  = useNavigate();

  useEffect(() => {
    if (!user || !isAdmin) { navigate('/'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dests, books] = await Promise.all([
        destinationsAPI.getAll({ limit: 50 }),
        bookingsAPI.getAll()
      ]);
      setDestinations(dests.data?.data ?? []);
      setBookings(books.data ?? []);
      setStats({ destinations: dests.data?.total ?? 0, bookings: (books.data ?? []).length });
    } catch { toast('Erreur', 'error'); }
    finally { setLoading(false); }
  };

  const deleteDestination = async (id) => {
    if (!confirm('Supprimer cette destination ?')) return;
    try { await destinationsAPI.delete(id); setDestinations(p => p.filter(d => d.id !== id)); toast('Destination supprimée', 'success'); }
    catch { toast('Erreur', 'error'); }
  };

  const statCards = [
    { icon: Globe, label: 'Destinations', value: stats.destinations, color: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
    { icon: ShoppingBag, label: 'Réservations', value: bookings.length, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
    { icon: TrendingUp, label: 'Revenus (€)', value: bookings.reduce((s, b) => s + (b.statut === 'confirme' ? Number(b.prix_total) : 0), 0).toLocaleString('fr-FR'), color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { icon: Users, label: 'Voyageurs actifs', value: [...new Set(bookings.map(b => b.utilisateur_id))].length, color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
  ];

  if (!isAdmin) return null;

  return (
    <div className="page" style={{ paddingTop: 70 }}>
      <div style={{ background: 'var(--dark-2)', padding: '32px 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="section-eyebrow">Administration</p>
            <h1 style={{ margin: '4px 0 0', fontSize: '2rem' }}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/destinations" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
              <Globe size={14} /> Voir le site
            </Link>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ background: 'var(--dark-3)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container" style={{ display: 'flex', gap: 4, padding: '0 24px' }}>
          {['overview', 'destinations', 'bookings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: 500, color: activeTab === tab ? '#C9A84C' : 'var(--text-muted)', borderBottom: `2px solid ${activeTab === tab ? '#C9A84C' : 'transparent'}`, transition: 'all 0.2s' }}>
              {tab === 'overview' ? 'Vue d\'ensemble' : tab === 'destinations' ? 'Destinations' : 'Réservations'}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loader" /></div> : (
          <>
            {/* Overview */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid-4" style={{ marginBottom: 40 }}>
                  {statCards.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, padding: '24px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <s.icon size={24} style={{ color: s.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Playfair Display', color: s.color, lineHeight: 1 }}>{s.value}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent bookings */}
                <h2 style={{ marginBottom: 20, fontSize: '1.3rem' }}>Dernières réservations</h2>
                <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                        {['Référence', 'Client', 'Voyage', 'Montant', 'Statut'].map(h => (
                          <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 8).map((b, i) => (
                        <tr key={b.id} style={{ borderBottom: i < bookings.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#C9A84C', fontWeight: 600 }}>{b.reference}</td>
                          <td style={{ padding: '14px 20px', fontSize: '0.875rem' }}>{b.prenom} {b.nom}</td>
                          <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{b.titre_voyage}</td>
                          <td style={{ padding: '14px 20px', fontSize: '0.875rem', fontWeight: 600 }}>{Number(b.prix_total).toLocaleString('fr-FR')} €</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, background: b.statut === 'confirme' ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.1)', color: b.statut === 'confirme' ? '#4ade80' : '#C9A84C' }}>
                              {b.statut === 'confirme' ? 'Confirmée' : 'En attente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune réservation</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Destinations management */}
            {activeTab === 'destinations' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: '1.3rem' }}>Gestion des destinations ({destinations.length})</h2>
                </div>
                <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                        {['Destination', 'Pays', 'Catégorie', 'Prix de', 'Note', 'Featured', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {destinations.map((d, i) => (
                        <tr key={d.id} style={{ borderBottom: i < destinations.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {d.image && <img src={d.image} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.nom}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{d.pays}</td>
                          <td style={{ padding: '12px 16px' }}><span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{d.categorie}</span></td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#C9A84C', fontWeight: 600 }}>{Number(d.prix_depuis).toLocaleString('fr-FR')} €</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} style={{ color: '#C9A84C', fill: '#C9A84C' }} /> {Number(d.note).toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{d.est_vedette ? <Check size={14} style={{ color: '#4ade80' }} /> : '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => deleteDestination(d.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Trash2 size={13} style={{ color: '#f87171' }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Bookings management */}
            {activeTab === 'bookings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 24, fontSize: '1.3rem' }}>Toutes les réservations ({bookings.length})</h2>
                <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                        {['Référence', 'Client', 'Email', 'Voyage', 'Destination', 'Montant', 'Statut', 'Date'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b, i) => (
                        <tr key={b.id} style={{ borderBottom: i < bookings.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#C9A84C', fontWeight: 600 }}>{b.reference}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{b.prenom} {b.nom}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.email}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{b.titre_voyage}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{b.destination || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 600 }}>{Number(b.prix_total).toLocaleString('fr-FR')} €</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, background: b.statut === 'confirme' ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.1)', color: b.statut === 'confirme' ? '#4ade80' : '#C9A84C' }}>
                              {b.statut}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(b.cree_le).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune réservation</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
