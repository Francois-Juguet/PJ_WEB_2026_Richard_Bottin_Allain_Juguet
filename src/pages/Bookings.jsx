import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, MapPin, Calendar, Check, X, Eye } from 'lucide-react';
import { bookingsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate  = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    bookingsAPI.getAll().then(r => setBookings(r.data ?? [])).catch(() => toast('Erreur', 'error')).finally(() => setLoading(false));
  }, [user]);

  const statusConfig = {
    confirmed: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', label: 'Confirmée' },
    pending:   { color: '#C9A84C', bg: 'rgba(201,168,76,0.1)', label: 'En attente' },
    cancelled: { color: '#f87171', bg: 'rgba(239,68,68,0.1)', label: 'Annulée' },
    completed: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', label: 'Terminée' },
  };

  return (
    <div className="page" style={{ paddingTop: 70 }}>
      <div style={{ background: 'var(--dark-2)', padding: '48px 0 32px', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <p className="section-eyebrow">Suivi</p>
          <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(1.8rem,4vw,3rem)' }}>Mes réservations</h1>
        </div>
      </div>

      <div className="container section">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />)}
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <ShoppingBag size={48} style={{ display: 'block', margin: '0 auto 16px', color: 'var(--text-dim)', opacity: 0.4 }} />
            <h3 style={{ color: 'var(--text-muted)', fontWeight: 400, marginBottom: 16 }}>Aucune réservation</h3>
            <Link to="/destinations" className="btn btn-gold">Explorer les destinations</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
            {bookings.map((b, i) => {
              const sc = statusConfig[b.status] || statusConfig.pending;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>

                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingBag size={26} style={{ color: '#C9A84C' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                      <h3 style={{ fontSize: '1rem', fontFamily: 'Playfair Display' }}>{b.trip_title}</h3>
                      <span style={{ padding: '3px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                    {b.destination && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <MapPin size={11} style={{ color: '#C9A84C' }} /> {b.destination}
                      </p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Réf: <span style={{ color: '#C9A84C', fontWeight: 600 }}>{b.booking_reference}</span> · {new Date(b.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display' }}>
                      {Number(b.total_price).toLocaleString('fr-FR')} €
                    </p>
                    <p style={{ fontSize: '0.75rem', color: b.payment_status === 'paid' ? '#4ade80' : 'var(--text-dim)' }}>
                      {b.payment_status === 'paid' ? '✓ Payé' : 'En attente'}
                    </p>
                    <Link to={`/itinerary/${b.itinerary_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#C9A84C', marginTop: 8 }}>
                      <Eye size={13} /> Voir le voyage
                    </Link>
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
