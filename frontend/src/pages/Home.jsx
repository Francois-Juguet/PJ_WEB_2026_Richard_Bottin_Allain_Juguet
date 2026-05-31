// ============================================================
// Home.jsx — page d'accueil de VoyageVista
// Contient :
//   - Section hero avec widget de recherche
//   - Barre de confiance (sécurité, prix, support)
//   - Barre de catégories horizontale (style CDiscount)
//   - Liste des destinations vedettes (une par ligne)
//   - Section avantages
//   - Appel à l'action pour l'inscription
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Search, Plane, Hotel, Compass, ArrowRight, MapPin,
  Shield, Award, Globe, Zap,
  Waves, Mountain, Building2, TreePalm, Tent, Landmark,
  Star, Lock, HeadphonesIcon, Tag
} from 'lucide-react';
import { destinationsAPI } from '../lib/api';
import StarRating from '../components/StarRating';

/* Catégories de destinations avec icônes Lucide */
const categories = [
  { id: 'beach',     label: 'Plages',     Icone: Waves     },
  { id: 'mountain',  label: 'Montagnes',  Icone: Mountain  },
  { id: 'city',      label: 'Villes',     Icone: Building2 },
  { id: 'island',    label: 'Îles',       Icone: TreePalm  },
  { id: 'adventure', label: 'Aventure',   Icone: Tent      },
  { id: 'culture',   label: 'Culture',    Icone: Landmark  },
];

/* Carte destination — affichage horizontal une par ligne (style liste CDiscount) */
function CarteDestination({ dest, delay = 0 }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      onClick={() => navigate(`/destinations/${dest.id}`)}
      style={{
        display: 'flex', gap: 0, borderRadius: 14, overflow: 'hidden',
        cursor: 'pointer', background: '#1A1A28',
        border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.22s',
      }}
      whileHover={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)', borderColor: 'rgba(201,168,76,0.3)' }}>

      {/* Image — taille fixe à gauche */}
      <div style={{ width: 220, minWidth: 220, height: 150, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        <img
          src={dest.image} alt={dest.nom}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          onError={e => { e.target.style.display = 'none'; }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.07)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        <span className="badge badge-gold" style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '0.65rem' }}>{dest.categorie}</span>
      </div>

      {/* Infos — occupe tout l'espace restant */}
      <div style={{ flex: 1, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <MapPin size={11} style={{ color: '#C9A84C' }} />
            <span style={{ fontSize: '0.72rem', color: '#8888A8' }}>{dest.pays}</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Playfair Display', marginBottom: 8, lineHeight: 1.2 }}>{dest.nom}</h3>
          <StarRating rating={dest.note} count={dest.nombre_avis} size={12} />
        </div>

        {/* Prix + bouton — à droite */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: '0.65rem', color: '#5A5A78', display: 'block' }}>à partir de</span>
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1.3rem', fontFamily: 'Playfair Display' }}>
            {dest.prix_depuis?.toLocaleString('fr-FR')} €
          </span>
          <div style={{ marginTop: 10, padding: '7px 16px', borderRadius: 8, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', fontSize: '0.8rem', fontWeight: 600, color: '#C9A84C' }}>
            Voir l'offre
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [destinations, setDestinations] = useState([]);
  const [chargement, setChargement]     = useState(true);
  const [recherche, setRecherche]       = useState('');
  const [ongletActif, setOngletActif]   = useState('flight');
  const navigate = useNavigate();

  useEffect(() => {
    destinationsAPI.getAll({ featured: true, limit: 6 })
      .then(r => setDestinations(r.data?.data ?? []))
      .catch(() => setDestinations([]))
      .finally(() => setChargement(false));
  }, []);

  const lancerRecherche = e => {
    e.preventDefault();
    if (recherche.trim()) navigate(`/destinations?search=${encodeURIComponent(recherche)}`);
  };

  /* Statistiques de la plateforme */
  const stats = [
    { valeur: '150+', label: 'Destinations' },
    { valeur: '50K+', label: 'Voyageurs satisfaits' },
    { valeur: '4.9',  label: 'Note moyenne', icone: Star },
    { valeur: '24/7', label: 'Assistance' },
  ];

  /* Points forts du service */
  const avantages = [
    { Icone: Shield, titre: 'Paiement sécurisé',   desc: 'Transactions protégées et assurance voyage incluse.' },
    { Icone: Award,  titre: 'Sélection premium',   desc: 'Chaque offre est vérifiée par nos experts voyage.' },
    { Icone: Globe,  titre: 'Couverture mondiale',  desc: 'Accès à des expériences uniques partout dans le monde.' },
    { Icone: Zap,    titre: 'Réservation rapide',  desc: 'Composez et validez votre séjour en quelques minutes.' },
  ];

  /* Barre de confiance — style CDiscount */
  const confiance = [
    { Icone: Lock,             texte: 'Paiement 100% sécurisé' },
    { Icone: Tag,              texte: 'Meilleur prix garanti' },
    { Icone: HeadphonesIcon,   texte: 'Support 7j/7' },
    { Icone: Shield,           texte: 'Remboursement garanti' },
  ];

  /* Onglets du widget de recherche */
  const onglets = [
    { id: 'flight',   label: 'Vols',       Icone: Plane   },
    { id: 'hotel',    label: 'Hôtels',     Icone: Hotel   },
    { id: 'activity', label: 'Activités',  Icone: Compass },
  ];

  return (
    <div className="page">

      {/* ── HERO ── */}
      <section style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1920) center/cover no-repeat', filter: 'brightness(0.28)' }} />
        {/* Dégradé latéral gauche pour lisibilité */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.3) 60%, transparent 100%)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 100, paddingBottom: 80 }}>
          <div style={{ maxWidth: 680 }}>

            {/* Badge statut */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 6, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', marginBottom: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C' }} />
                <span style={{ fontSize: '0.78rem', color: '#C9A84C', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Plateforme voyage premium</span>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              style={{ marginBottom: 18, lineHeight: 1.08 }}>
              Planifiez votre{' '}
              <span style={{ background: 'linear-gradient(135deg, #E8C97A, #C9A84C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                voyage de rêve
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ fontSize: '1.05rem', color: '#8888A8', maxWidth: 460, marginBottom: 36, lineHeight: 1.75 }}>
              Destinations d'exception, hébergements de luxe et expériences inoubliables — composez votre séjour parfait en quelques instants.
            </motion.p>

            {/* Widget de recherche — style CDiscount : fond solide, onglets nets */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ background: '#12121A', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: 20, maxWidth: 640, boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }}>

              {/* Onglets */}
              <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#0A0A0F', borderRadius: 8, padding: 3 }}>
                {onglets.map(o => (
                  <button key={o.id} onClick={() => setOngletActif(o.id)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: 600, fontFamily: 'Inter', transition: 'all 0.18s',
                    background: ongletActif === o.id ? '#C9A84C' : 'transparent',
                    color: ongletActif === o.id ? '#0A0A0F' : '#8888A8',
                  }}>
                    <o.Icone size={14} />
                    {o.label}
                  </button>
                ))}
              </div>

              {/* Formulaire de recherche */}
              <form onSubmit={lancerRecherche} style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#5A5A78' }} />
                  <input
                    value={recherche}
                    onChange={e => setRecherche(e.target.value)}
                    placeholder="Où souhaitez-vous aller ?"
                    className="input-field"
                    style={{ width: '100%', paddingLeft: 40 }}
                  />
                </div>
                <button type="submit" className="btn btn-gold" style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}>
                  Rechercher
                </button>
              </form>

              {/* Destinations populaires */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#5A5A78', fontWeight: 500 }}>Tendances :</span>
                {['Maldives', 'Santorini', 'Bali', 'Dubaï'].map(d => (
                  <button key={d} onClick={() => navigate(`/destinations?search=${d}`)}
                    style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#8888A8', cursor: 'pointer', transition: 'all 0.18s' }}
                    onMouseEnter={e => { e.target.style.color = '#C9A84C'; e.target.style.borderColor = 'rgba(201,168,76,0.4)'; }}
                    onMouseLeave={e => { e.target.style.color = '#8888A8'; e.target.style.borderColor = 'rgba(255,255,255,0.09)'; }}>
                    {d}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Statistiques sous le widget */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              style={{ display: 'flex', gap: 40, marginTop: 44, flexWrap: 'wrap' }}>
              {stats.map(s => (
                <div key={s.valeur}>
                  <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display', lineHeight: 1 }}>{s.valeur}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8888A8', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BARRE DE CONFIANCE (style CDiscount) ── */}
      <div style={{ background: '#12121A', borderTop: '1px solid rgba(201,168,76,0.1)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0', flexWrap: 'wrap', gap: 12 }}>
            {confiance.map(({ Icone, texte }) => (
              <div key={texte} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8888A8', fontSize: '0.82rem' }}>
                <Icone size={16} style={{ color: '#C9A84C', flexShrink: 0 }} />
                <span style={{ fontWeight: 500 }}>{texte}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BARRE CATÉGORIES (style CDiscount : navigation horizontale) ── */}
      <section style={{ background: '#0A0A0F', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/destinations?category=${cat.id}`)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 24px', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', color: '#8888A8', fontFamily: 'Inter', fontSize: '0.78rem', fontWeight: 500, minWidth: 'fit-content' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderBottomColor = '#C9A84C'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8888A8'; e.currentTarget.style.borderBottomColor = 'transparent'; }}>
                <cat.Icone size={18} />
                {cat.label}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS VEDETTES ── */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <div>
              <p className="section-eyebrow">Sélection exclusive</p>
              <h2 className="section-title" style={{ margin: '6px 0 0' }}>Destinations vedettes</h2>
            </div>
            <Link to="/destinations" className="btn btn-outline" style={{ padding: '9px 18px', fontSize: '0.85rem' }}>
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          {/* Une carte par ligne — pas de grille */}
          {chargement ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 14 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {destinations.map((dest, i) => <CarteDestination key={dest.id} dest={dest} delay={i * 0.07} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── AVANTAGES (style bannière horizontale CDiscount) ── */}
      <section className="section" style={{ background: '#12121A' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p className="section-eyebrow">Notre engagement</p>
            <h2 className="section-title">Pourquoi choisir VoyageVista ?</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>L'excellence au service de vos voyages, partout dans le monde.</p>
          </div>

          {/* Grille avantages — style cards CDiscount avec ligne verticale */}
          <div className="grid-4">
            {avantages.map((a, i) => (
              <motion.div key={a.titre}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: '28px 24px', borderRadius: 14, background: '#1A1A28', borderLeft: '3px solid #C9A84C', transition: 'all 0.25s' }}
                whileHover={{ background: '#1e1e30' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <a.Icone size={20} style={{ color: '#C9A84C' }} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, fontFamily: 'Playfair Display' }}>{a.titre}</h3>
                <p style={{ fontSize: '0.85rem', color: '#8888A8', lineHeight: 1.6 }}>{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA INSCRIPTION ── */}
      {!user && (
        <section style={{ padding: '72px 0', background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 60%)' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', background: '#12121A', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 16, padding: '40px 48px' }}>
              <div>
                <h2 style={{ marginBottom: 10 }}>Prêt à voyager ?</h2>
                <p style={{ color: '#8888A8', maxWidth: 420, lineHeight: 1.7 }}>
                  Rejoignez plus de 50 000 voyageurs qui nous font confiance pour leurs séjours d'exception.
                </p>
              </div>
              <motion.div whileInView={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: 20 }} viewport={{ once: true }}
                style={{ display: 'flex', gap: 14, flexWrap: 'wrap', flexShrink: 0 }}>
                <Link to="/register" className="btn btn-gold" style={{ fontSize: '0.95rem', padding: '13px 28px' }}>
                  Créer mon compte gratuit <ArrowRight size={16} />
                </Link>
                <Link to="/destinations" className="btn btn-outline" style={{ fontSize: '0.95rem', padding: '13px 28px' }}>
                  Explorer les destinations
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
