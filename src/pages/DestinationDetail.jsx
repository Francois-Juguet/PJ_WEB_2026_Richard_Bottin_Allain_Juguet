import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Users, ArrowLeft, Heart, Plane, Hotel, Activity, Calendar, ChevronRight, Plus } from 'lucide-react';
import { destinationsAPI, itinerariesAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import StarRating from '../components/StarRating';

export default function DestinationDetail() {
  const { id }         = useParams();
  const [dest, setDest]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]    = useState('overview');
  const { user }         = useAuth();
  const { toast }        = useToast();
  const navigate         = useNavigate();

  useEffect(() => {
    destinationsAPI.getOne(id)
      .then(r => setDest(r.data))
      .catch(() => toast('Destination introuvable', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const startTrip = async () => {
    if (!user) { toast('Connectez-vous pour planifier un voyage', 'info'); navigate('/login'); return; }
    try {
      const { data } = await itinerariesAPI.create({ title: `Voyage à ${dest.name}`, destination_id: dest.id });
      navigate(`/itinerary/${data.id}`);
      toast('Itinéraire créé ! Composez votre voyage.', 'success');
    } catch { toast('Erreur', 'error'); }
  };

  if (loading) return (
    <div style={{ paddingTop: 70, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loader" />
    </div>
  );

  if (!dest) return null;

  const tabs = ['overview', 'accommodations', 'activities', 'reviews'];

  return (
    <div className="page" style={{ paddingTop: 70 }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: '55vh', minHeight: 400, overflow: 'hidden' }}>
        <img src={dest.image} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 50%)' }} />

        <div className="container" style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 40 }}>
          <button onClick={() => navigate('/destinations')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', color: '#E8E8F0', cursor: 'pointer', width: 'fit-content', marginBottom: 24, fontSize: '0.875rem' }}>
            <ArrowLeft size={15} /> Retour
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MapPin size={14} style={{ color: '#C9A84C' }} />
            <span style={{ color: '#C9A84C', fontSize: '0.9rem' }}>{dest.country}</span>
            {dest.region && <><span style={{ color: '#5A5A78' }}>·</span><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dest.region}</span></>}
          </div>
          <h1 style={{ marginBottom: 12 }}>{dest.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <StarRating rating={dest.rating} count={dest.reviews_count} size={15} />
            <span className="badge badge-gold">{dest.category}</span>
            <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1.1rem' }}>À partir de {Number(dest.price_from).toLocaleString('fr-FR')} €</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '0 24px' }}>
        {/* Sticky action bar */}
        <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: '0 0 20px 20px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s', background: tab === t ? 'rgba(201,168,76,0.15)' : 'transparent', color: tab === t ? '#C9A84C' : 'var(--text-muted)' }}>
                {t === 'overview' ? 'Aperçu' : t === 'accommodations' ? 'Hébergements' : t === 'activities' ? 'Activités' : 'Avis'}
              </button>
            ))}
          </div>
          <button onClick={startTrip} className="btn btn-gold">
            <Plane size={16} style={{ transform: 'rotate(-30deg)' }} />
            Planifier ce voyage
          </button>
        </div>

        {/* Tab: Overview */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>
              <div>
                <h2 style={{ marginBottom: 16, fontSize: '1.5rem' }}>À propos</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: 32 }}>{dest.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {[
                    { icon: Hotel, label: `${dest.accommodations?.length || 0} hébergements`, color: '#60a5fa' },
                    { icon: Activity, label: `${dest.activities?.length || 0} activités`, color: '#4ade80' },
                    { icon: Star, label: `${dest.reviews?.length || 0} avis`, color: '#C9A84C' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <item.icon size={20} style={{ color: item.color }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, position: 'sticky', top: 90 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Prix moyen à partir de</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display' }}>{Number(dest.price_from).toLocaleString('fr-FR')} €</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>par personne</div>
                </div>
                <div className="divider-gold" />
                <div style={{ margin: '20px 0' }}>
                  <StarRating rating={dest.rating} count={dest.reviews_count} size={15} />
                </div>
                <button onClick={startTrip} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
                  <Plane size={16} style={{ transform: 'rotate(-30deg)' }} />
                  Planifier maintenant
                </button>
                <Link to={`/accommodations?destination_id=${dest.id}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  <Hotel size={16} />
                  Voir les hébergements
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Accommodations */}
        {tab === 'accommodations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 24 }}>Hébergements disponibles</h2>
            {dest.accommodations?.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Aucun hébergement disponible.</p> :
              <div className="grid-2">
                {dest.accommodations?.map(acc => (
                  <div key={acc.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => navigate(`/accommodations?destination_id=${dest.id}`)}>
                    <div style={{ height: 180, background: 'var(--dark-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {acc.images ? <img src={JSON.parse(acc.images || '[]')[0]} alt={acc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} /> : <Hotel size={40} style={{ color: 'var(--text-dim)' }} />}
                    </div>
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                        <h3 style={{ fontSize: '1rem', fontFamily: 'Playfair Display' }}>{acc.name}</h3>
                        <span style={{ color: '#C9A84C', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>{Number(acc.price_per_night).toLocaleString('fr-FR')} €/nuit</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="badge badge-blue">{acc.type}</span>
                        <span style={{ color: '#C9A84C', fontSize: '0.8rem' }}>{'★'.repeat(acc.stars || 0)}</span>
                      </div>
                      <StarRating rating={acc.rating} count={acc.reviews_count} size={12} />
                    </div>
                  </div>
                ))}
              </div>}
          </motion.div>
        )}

        {/* Tab: Activities */}
        {tab === 'activities' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 24 }}>Activités & Expériences</h2>
            {dest.activities?.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Aucune activité disponible.</p> :
              <div className="grid-3">
                {dest.activities?.map(act => (
                  <div key={act.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => navigate(`/activities?destination_id=${dest.id}`)}>
                    <div style={{ height: 160, background: 'var(--dark-4)', overflow: 'hidden' }}>
                      {act.image && <img src={act.image} alt={act.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                    </div>
                    <div style={{ padding: 16 }}>
                      <span className="badge badge-green" style={{ marginBottom: 8, fontSize: '0.7rem' }}>{act.category}</span>
                      <h3 style={{ fontSize: '0.95rem', fontFamily: 'Playfair Display', marginBottom: 8 }}>{act.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <Clock size={12} />
                          {act.duration_hours}h
                        </div>
                        <span style={{ color: '#C9A84C', fontWeight: 700 }}>{Number(act.price).toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
          </motion.div>
        )}

        {/* Tab: Reviews */}
        {tab === 'reviews' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 24 }}>Avis des voyageurs</h2>
            {dest.reviews?.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Aucun avis pour l'instant.</p> :
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {dest.reviews?.map(review => (
                  <div key={review.id} style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#0A0A0F' }}>
                        {review.first_name?.[0]}{review.last_name?.[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{review.first_name} {review.last_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(review.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div style={{ marginLeft: 'auto' }}><StarRating rating={review.rating} size={13} showNumber={false} /></div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{review.comment}</p>
                  </div>
                ))}
              </div>}
          </motion.div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
