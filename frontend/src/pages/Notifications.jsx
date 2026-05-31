import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, ShoppingBag, Plane, Hotel, Compass, Tag, Settings, BellOff } from 'lucide-react';
import { notificationsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
  booking:       { icon: ShoppingBag, color: '#4ade80', label: 'Réservation' },
  transport:     { icon: Plane,       color: '#60a5fa', label: 'Transport' },
  accommodation: { icon: Hotel,       color: '#a78bfa', label: 'Hébergement' },
  activity:      { icon: Compass,     color: '#fb923c', label: 'Activité' },
  promotion:     { icon: Tag,         color: '#C9A84C', label: 'Promotion' },
  system:        { icon: Settings,    color: '#8888A8', label: 'Système' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('all');
  const { user }                          = useAuth();
  const { toast }                         = useToast();
  const navigate                          = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchNotifs();
  }, [user]);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data?.notifications ?? []);
      setUnread(data?.nombre_non_lues ?? 0);
    } catch { toast('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, est_lu: true } : n));
    setUnread(p => Math.max(0, p - 1));
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifications(p => p.map(n => ({ ...n, est_lu: true })));
    setUnread(0);
    toast('Toutes les notifications marquées comme lues', 'success');
  };

  const deleteNotif = async (id) => {
    await notificationsAPI.delete(id);
    setNotifications(p => p.filter(n => n.id !== id));
  };

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.est_lu) : notifications.filter(n => n.type === filter);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="page" style={{ paddingTop: 70 }}>
      <div style={{ background: 'var(--dark-2)', padding: '48px 0 32px', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="section-eyebrow">Centre</p>
            <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(1.8rem,4vw,3rem)', display: 'flex', alignItems: 'center', gap: 12 }}>
              Notifications
              {unread > 0 && <span style={{ fontSize: '1rem', background: '#ef4444', color: '#fff', borderRadius: 100, padding: '2px 10px', fontFamily: 'Inter', fontWeight: 700 }}>{unread}</span>}
            </h1>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
              <Check size={15} /> Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="container" style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ id: 'all', label: 'Toutes' }, { id: 'unread', label: `Non lues (${unread})` }, ...Object.entries(TYPE_CONFIG).map(([id, cfg]) => ({ id, label: cfg.label }))].map(({ id, label }) => (
            <button key={id} onClick={() => setFilter(id)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: '0.8rem', cursor: 'pointer', border: 'none', fontFamily: 'Inter', transition: 'all 0.2s', background: filter === id ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', color: filter === id ? '#C9A84C' : 'var(--text-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: filter === id ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px', maxWidth: 800 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <BellOff size={48} style={{ display: 'block', margin: '0 auto 16px', color: 'var(--text-dim)', opacity: 0.4 }} />
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Aucune notification</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <motion.div key={n.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  style={{ background: n.est_lu ? 'var(--dark-3)' : 'rgba(201,168,76,0.04)', border: `1px solid ${n.est_lu ? 'var(--border-light)' : 'rgba(201,168,76,0.15)'}`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, cursor: !n.est_lu ? 'pointer' : 'default', transition: 'all 0.2s' }}
                  onClick={() => !n.est_lu && markRead(n.id)}
                  whileHover={{ borderColor: n.est_lu ? 'rgba(255,255,255,0.1)' : 'rgba(201,168,76,0.3)' }}>

                  <div style={{ width: 42, height: 42, borderRadius: 12, background: cfg.color + '15', border: `1px solid ${cfg.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontWeight: n.est_lu ? 500 : 700, fontSize: '0.9rem' }}>{n.titre}</p>
                      {!n.est_lu && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />}
                      <span className="badge" style={{ marginLeft: 'auto', fontSize: '0.65rem', background: cfg.color + '15', color: cfg.color, padding: '2px 8px' }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 6 }}>{timeAgo(n.created_at)}</p>
                  </div>

                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {!n.est_lu && (
                      <button onClick={e => { e.stopPropagation(); markRead(n.id); }} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Check size={13} style={{ color: '#4ade80' }} />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); deleteNotif(n.id); }} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Trash2 size={13} style={{ color: '#f87171' }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
