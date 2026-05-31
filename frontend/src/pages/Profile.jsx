// ============================================================
// Profile.jsx — profil de l'utilisateur connecté
// Affiche les statistiques (réservations, itinéraires, favoris),
// les informations personnelles modifiables et des liens rapides
// vers les sections principales selon le rôle de l'utilisateur.
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Edit2, Save, X, ShoppingBag, MapPin, Heart, Bell, LayoutDashboard, Calendar, Globe, Map, Building2, Shield } from 'lucide-react';
import { usersAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});
  const { user, refreshUser } = useAuth();
  const { toast }             = useToast();
  const navigate              = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    usersAPI.getProfile()
      .then(r => {
        setProfile(r.data);
        setForm({ prenom: r.data.prenom, nom: r.data.nom, telephone: r.data.telephone || '' });
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false));
  }, [user]);

  // Enregistre les modifications du profil et rafraîchit les données globales
  const save = async () => {
    try {
      const { data } = await usersAPI.updateProfile(form);
      setProfile(p => ({ ...p, ...data }));
      setEditing(false);
      await refreshUser();
      toast('Profil mis à jour !', 'success');
    } catch { toast('Erreur lors de la mise à jour', 'error'); }
  };

  if (loading) return (
    <div style={{ paddingTop: 70, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loader" />
    </div>
  );
  if (!profile) return null;

  const roleLabel = profile.role === 'admin' ? 'Administrateur' : profile.role === 'prestataire' ? 'Prestataire' : 'Voyageur';
  const roleColor = profile.role === 'admin' ? '#f87171' : profile.role === 'prestataire' ? '#60a5fa' : '#C9A84C';

  /* Champs retournés par le PHP : nombre_reservations, nombre_itineraires, nombre_favoris */
  const stats = [
    { icon: ShoppingBag, value: profile.nombre_reservations ?? profile.bookings_count ?? 0,    label: 'Réservations',  link: '/bookings',     color: '#4ade80' },
    { icon: MapPin,      value: profile.nombre_itineraires  ?? profile.itineraries_count ?? 0, label: 'Itinéraires',   link: '/itinerary',    color: '#60a5fa' },
    { icon: Heart,       value: profile.nombre_favoris      ?? profile.favorites_count ?? 0,   label: 'Favoris',       link: '/destinations', color: '#f472b6' },
  ];

  /* Liens rapides avec icônes Lucide à la place des emojis */
  const quickLinks = [
    { to: '/destinations',  Icone: Globe,      label: 'Destinations',     desc: 'Explorer les offres premium' },
    { to: '/itinerary',     Icone: Map,        label: 'Mes itinéraires',  desc: 'Créer et gérer mes voyages' },
    { to: '/bookings',      Icone: ShoppingBag,label: 'Réservations',     desc: 'Suivre mes réservations' },
    { to: '/notifications', Icone: Bell,       label: 'Notifications',    desc: 'Mes alertes et messages' },
    ...(profile.role === 'prestataire' || profile.role === 'admin' ? [
      { to: '/provider', Icone: Building2, label: 'Espace prestataire', desc: 'Gérer mes offres', highlight: true },
    ] : []),
    ...(profile.role === 'admin' ? [
      { to: '/admin', Icone: Shield, label: 'Administration', desc: 'Gérer la plateforme', highlight: true },
    ] : []),
  ];

  return (
    <div style={{ paddingTop: 70, minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--dark-2) 0%, var(--dark) 100%)', padding: '48px 0 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ width: 96, height: 96, borderRadius: 28, background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#0A0A0F', fontFamily: 'Playfair Display', border: `3px solid ${roleColor}44`, boxShadow: `0 8px 32px ${roleColor}33`, flexShrink: 0 }}>
              {profile.prenom?.[0]?.toUpperCase()}{profile.nom?.[0]?.toUpperCase()}
            </motion.div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>{profile.prenom} {profile.nom}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: 10, fontSize: '0.95rem' }}>{profile.email}</p>
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: `${roleColor}18`, border: `1px solid ${roleColor}44`, color: roleColor, fontSize: '0.8rem', fontWeight: 600 }}>
                {roleLabel}
              </span>
            </div>
            <button onClick={() => setEditing(p => !p)} className={editing ? 'btn btn-outline' : 'btn btn-gold'} style={{ fontSize: '0.875rem', flexShrink: 0 }}>
              {editing ? <><X size={15} /> Annuler</> : <><Edit2 size={15} /> Modifier le profil</>}
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px 80px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link to={s.link} style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', textDecoration: 'none', display: 'flex' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={22} style={{ color: s.color }} />
                </div>
                <div>
                  <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Playfair Display', color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Infos personnelles */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, padding: 28 }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} style={{ color: '#C9A84C' }} /> Informations personnelles
            </h2>

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Prénom</label>
                    <input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Nom</label>
                    <input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Téléphone</label>
                  <input type="tel" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} className="input-field" placeholder="+33 6 00 00 00 00" />
                </div>
                <div className="input-group">
                  <label className="input-label">Nouveau mot de passe <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(laisser vide = inchangé)</span></label>
                  <input type="password" onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-field" placeholder="••••••••" />
                </div>
                <button onClick={save} className="btn btn-gold" style={{ justifyContent: 'center' }}>
                  <Save size={16} /> Sauvegarder les modifications
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: User,  label: 'Nom complet',  value: `${profile.prenom} ${profile.nom}` },
                  { icon: Mail,  label: 'Email',         value: profile.email },
                  { icon: Phone, label: 'Téléphone',     value: profile.telephone || 'Non renseigné' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--dark-4)', borderRadius: 14 }}>
                    <Icon size={16} style={{ color: '#C9A84C', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{value}</p>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '12px 16px', background: 'var(--dark-4)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Calendar size={16} style={{ color: '#C9A84C', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Membre depuis</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      {new Date(profile.cree_le).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Actions rapides */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            style={{ background: 'var(--dark-3)', border: '1px solid var(--border-light)', borderRadius: 20, padding: 28 }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LayoutDashboard size={18} style={{ color: '#C9A84C' }} /> Navigation rapide
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quickLinks.map(item => (
                <Link key={item.to} to={item.to}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: item.highlight ? 'rgba(201,168,76,0.06)' : 'var(--dark-4)', borderRadius: 14, border: `1px solid ${item.highlight ? 'rgba(201,168,76,0.25)' : 'var(--border-light)'}`, transition: 'all 0.2s', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = item.highlight ? 'rgba(201,168,76,0.25)' : 'var(--border-light)'; e.currentTarget.style.background = item.highlight ? 'rgba(201,168,76,0.06)' : 'var(--dark-4)'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: item.highlight ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.Icone size={16} style={{ color: '#C9A84C' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 1, color: item.highlight ? '#C9A84C' : 'var(--text)' }}>{item.label}</p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>›</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
