import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, TrendingUp, Trash2, Globe, Star, Check, Hotel, Zap, Plane } from 'lucide-react';
import { destinationsAPI, bookingsAPI, accommodationsAPI, activitiesAPI, transportsAPI, usersAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

const TABS = [
  { key: 'overview',       label: 'Vue d\'ensemble' },
  { key: 'destinations',   label: 'Destinations' },
  { key: 'accommodations', label: 'Hébergements' },
  { key: 'activities',     label: 'Activités' },
  { key: 'transports',     label: 'Transports' },
  { key: 'users',          label: 'Utilisateurs' },
  { key: 'bookings',       label: 'Réservations' },
];

const btnDel = { width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const tdS    = { padding: '12px 16px', fontSize: '0.875rem' };

export default function AdminDashboard() {
  const [activeTab, setActiveTab]   = useState('overview');
  const [loading, setLoading]       = useState(true);
  const [destinations, setDest]     = useState([]);
  const [bookings, setBook]         = useState([]);
  const [accommodations, setAccom]  = useState([]);
  const [activities, setActiv]      = useState([]);
  const [transports, setTrans]      = useState([]);
  const [users, setUsers]           = useState([]);

  const { user, isAdmin } = useAuth();
  const { toast }         = useToast();
  const navigate          = useNavigate();

  useEffect(() => {
    if (!user || !isAdmin) { navigate('/'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, b, a, ac, t, u] = await Promise.all([
        destinationsAPI.getAll({ limit: 50 }),
        bookingsAPI.getAll(),
        activitiesAPI.getAll({}),
        accommodationsAPI.getAll({}),
        transportsAPI.search({}),
        usersAPI.getAll(),
      ]);
      setDest(d.data?.data ?? []);
      setBook(b.data ?? []);
      setActiv(a.data ?? []);
      setAccom(ac.data ?? []);
      setTrans(t.data ?? []);
      setUsers(u.data ?? []);
    } catch { toast('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  const del = async (type, id, setter, label) => {
    if (!confirm(`Supprimer ce(tte) ${label} ?`)) return;
    try {
      if (type === 'destination')   await destinationsAPI.delete(id);
      if (type === 'accommodation') await accommodationsAPI.delete(id);
      if (type === 'activity')      await activitiesAPI.delete(id);
      if (type === 'transport')     await transportsAPI.delete(id);
      if (type === 'user')          await usersAPI.deleteUser(id);
      setter(p => p.filter(x => x.id !== id));
      toast(`${label} supprimé(e)`, 'success');
    } catch (e) { toast(e.response?.data?.error || 'Erreur', 'error'); }
  };

  const statCards = [
    { icon: Globe,       label: 'Destinations',    value: destinations.length,   color: '#C9A84C' },
    { icon: Hotel,       label: 'Hébergements',     value: accommodations.length, color: '#60a5fa' },
    { icon: Zap,         label: 'Activités',        value: activities.length,     color: '#4ade80' },
    { icon: ShoppingBag, label: 'Réservations',     value: bookings.length,       color: '#f472b6' },
    { icon: TrendingUp,  label: 'Revenus (€)',      value: bookings.reduce((s, b) => s + (b.statut === 'confirme' ? Number(b.prix_total) : 0), 0).toLocaleString('fr-FR'), color: '#a78bfa' },
    { icon: Users,       label: 'Utilisateurs',     value: users.length,          color: '#fb923c' },
  ];

  if (!isAdmin) return null;

  const Table = ({ headers, children, empty }) => (
    <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            {headers.map(h => <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>{empty}</p>}
    </div>
  );

  const DelBtn = ({ onClick }) => (
    <button onClick={onClick} style={btnDel}><Trash2 size={13} style={{ color: '#f87171' }} /></button>
  );

  return (
    <div className="page" style={{ paddingTop: 70 }}>
      {/* Header */}
      <div style={{ background: 'var(--dark-2)', padding: '32px 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="section-eyebrow">Administration</p>
            <h1 style={{ margin: '4px 0 0', fontSize: '2rem' }}>Dashboard</h1>
          </div>
          <Link to="/destinations" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
            <Globe size={14} /> Voir le site
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--dark-3)', borderBottom: '1px solid var(--border-light)', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: 4, padding: '0 24px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap',
                color: activeTab === t.key ? '#C9A84C' : 'var(--text-muted)',
                borderBottom: `2px solid ${activeTab === t.key ? '#C9A84C' : 'transparent'}`,
                transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loader" /></div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
                  {statCards.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, padding: '24px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <s.icon size={22} style={{ color: s.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Playfair Display', color: s.color, lineHeight: 1 }}>{s.value}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <h2 style={{ marginBottom: 20, fontSize: '1.3rem' }}>Dernières réservations</h2>
                <Table headers={['Référence', 'Client', 'Voyage', 'Montant', 'Statut']} empty={bookings.length === 0 ? 'Aucune réservation' : null}>
                  {bookings.slice(0, 8).map((b, i) => (
                    <tr key={b.id} style={{ borderBottom: i < 7 ? '1px solid var(--border-light)' : 'none' }}>
                      <td style={{ ...tdS, color: '#C9A84C', fontWeight: 600 }}>{b.reference}</td>
                      <td style={tdS}>{b.prenom} {b.nom}</td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{b.titre_voyage}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{Number(b.prix_total).toLocaleString('fr-FR')} €</td>
                      <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, background: b.statut === 'confirme' ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.1)', color: b.statut === 'confirme' ? '#4ade80' : '#C9A84C' }}>{b.statut === 'confirme' ? 'Confirmée' : 'En attente'}</span></td>
                    </tr>
                  ))}
                </Table>
              </motion.div>
            )}

            {/* DESTINATIONS */}
            {activeTab === 'destinations' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Destinations ({destinations.length})</h2>
                <Table headers={['Destination', 'Pays', 'Catégorie', 'Prix depuis', 'Note', 'Vedette', '']} empty={destinations.length === 0 ? 'Aucune destination' : null}>
                  {destinations.map((d, i) => (
                    <tr key={d.id} style={{ borderBottom: i < destinations.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <td style={tdS}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{d.image && <img src={d.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}<span style={{ fontWeight: 600 }}>{d.nom}</span></div></td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{d.pays}</td>
                      <td style={tdS}><span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{d.categorie}</span></td>
                      <td style={{ ...tdS, color: '#C9A84C', fontWeight: 600 }}>{Number(d.prix_depuis).toLocaleString('fr-FR')} €</td>
                      <td style={tdS}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={11} style={{ color: '#C9A84C', fill: '#C9A84C' }} />{Number(d.note).toFixed(1)}</span></td>
                      <td style={tdS}>{d.est_vedette ? <Check size={14} style={{ color: '#4ade80' }} /> : '—'}</td>
                      <td style={tdS}><DelBtn onClick={() => del('destination', d.id, setDest, 'destination')} /></td>
                    </tr>
                  ))}
                </Table>
              </motion.div>
            )}

            {/* HÉBERGEMENTS */}
            {activeTab === 'accommodations' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Hébergements ({accommodations.length})</h2>
                <Table headers={['Nom', 'Type', 'Destination', 'Prix/nuit', 'Étoiles', 'Note', '']} empty={accommodations.length === 0 ? 'Aucun hébergement' : null}>
                  {accommodations.map((h, i) => (
                    <tr key={h.id} style={{ borderBottom: i < accommodations.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <td style={tdS}><span style={{ fontWeight: 600 }}>{h.nom}</span></td>
                      <td style={tdS}><span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{h.type}</span></td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{h.destination_nom}</td>
                      <td style={{ ...tdS, color: '#C9A84C', fontWeight: 600 }}>{Number(h.prix_nuit).toLocaleString('fr-FR')} €</td>
                      <td style={tdS}>{'★'.repeat(h.etoiles)}</td>
                      <td style={tdS}>{Number(h.note).toFixed(1)}</td>
                      <td style={tdS}><DelBtn onClick={() => del('accommodation', h.id, setAccom, 'hébergement')} /></td>
                    </tr>
                  ))}
                </Table>
              </motion.div>
            )}

            {/* ACTIVITÉS */}
            {activeTab === 'activities' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Activités ({activities.length})</h2>
                <Table headers={['Nom', 'Catégorie', 'Destination', 'Prix', 'Durée', 'Note', '']} empty={activities.length === 0 ? 'Aucune activité' : null}>
                  {activities.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: i < activities.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <td style={tdS}><span style={{ fontWeight: 600 }}>{a.nom}</span></td>
                      <td style={tdS}><span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{a.categorie}</span></td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{a.destination_nom}</td>
                      <td style={{ ...tdS, color: '#C9A84C', fontWeight: 600 }}>{Number(a.prix).toLocaleString('fr-FR')} €</td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{a.duree_heures}h</td>
                      <td style={tdS}>{Number(a.note).toFixed(1)}</td>
                      <td style={tdS}><DelBtn onClick={() => del('activity', a.id, setActiv, 'activité')} /></td>
                    </tr>
                  ))}
                </Table>
              </motion.div>
            )}

            {/* TRANSPORTS */}
            {activeTab === 'transports' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Transports ({transports.length})</h2>
                <Table headers={['Type', 'Compagnie', 'Trajet', 'Départ', 'Prix', 'Classe', '']} empty={transports.length === 0 ? 'Aucun transport' : null}>
                  {transports.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: i < transports.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <td style={tdS}><span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{t.type}</span></td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{t.compagnie}</td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{t.ville_depart} → {t.ville_arrivee}</td>
                      <td style={{ ...tdS, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(t.heure_depart).toLocaleDateString('fr-FR')}</td>
                      <td style={{ ...tdS, color: '#C9A84C', fontWeight: 600 }}>{Number(t.prix).toLocaleString('fr-FR')} €</td>
                      <td style={tdS}>{t.classe}</td>
                      <td style={tdS}><DelBtn onClick={() => del('transport', t.id, setTrans, 'transport')} /></td>
                    </tr>
                  ))}
                </Table>
              </motion.div>
            )}

            {/* UTILISATEURS */}
            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Utilisateurs ({users.length})</h2>
                <Table headers={['Nom', 'Email', 'Rôle', 'Téléphone', 'Inscrit le', '']} empty={users.length === 0 ? 'Aucun utilisateur' : null}>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <td style={tdS}><span style={{ fontWeight: 600 }}>{u.prenom} {u.nom}</span></td>
                      <td style={{ ...tdS, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.email}</td>
                      <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 600, background: u.role === 'admin' ? 'rgba(239,68,68,0.15)' : u.role === 'prestataire' ? 'rgba(96,165,250,0.15)' : 'rgba(201,168,76,0.1)', color: u.role === 'admin' ? '#f87171' : u.role === 'prestataire' ? '#60a5fa' : '#C9A84C' }}>{u.role}</span></td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{u.telephone || '—'}</td>
                      <td style={{ ...tdS, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(u.cree_le).toLocaleDateString('fr-FR')}</td>
                      <td style={tdS}>{u.role !== 'admin' && <DelBtn onClick={() => del('user', u.id, setUsers, 'utilisateur')} />}</td>
                    </tr>
                  ))}
                </Table>
              </motion.div>
            )}

            {/* RÉSERVATIONS */}
            {activeTab === 'bookings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Réservations ({bookings.length})</h2>
                <Table headers={['Référence', 'Client', 'Email', 'Voyage', 'Destination', 'Montant', 'Statut', 'Date']} empty={bookings.length === 0 ? 'Aucune réservation' : null}>
                  {bookings.map((b, i) => (
                    <tr key={b.id} style={{ borderBottom: i < bookings.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <td style={{ ...tdS, color: '#C9A84C', fontWeight: 600 }}>{b.reference}</td>
                      <td style={tdS}>{b.prenom} {b.nom}</td>
                      <td style={{ ...tdS, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{b.email}</td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{b.titre_voyage}</td>
                      <td style={{ ...tdS, color: 'var(--text-muted)' }}>{b.destination || '—'}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{Number(b.prix_total).toLocaleString('fr-FR')} €</td>
                      <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, background: b.statut === 'confirme' ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.1)', color: b.statut === 'confirme' ? '#4ade80' : '#C9A84C' }}>{b.statut}</span></td>
                      <td style={{ ...tdS, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(b.cree_le).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </Table>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
