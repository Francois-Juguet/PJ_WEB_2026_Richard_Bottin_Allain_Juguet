import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Plane, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm]       = useState({ first_name: '', last_name: '', email: '', password: '', role: 'traveler' });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const { register }          = useAuth();
  const { toast }             = useToast();
  const navigate              = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 6) { toast('Le mot de passe doit faire au moins 6 caractères', 'error'); return; }
    setLoading(true);
    try {
      await register(form);
      toast('Compte créé avec succès ! Bienvenue.', 'success');
      navigate('/');
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la création du compte', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920) center/cover no-repeat', filter: 'brightness(0.2)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={20} style={{ color: '#0A0A0F', transform: 'rotate(-30deg)' }} />
          </div>
          <span style={{ fontFamily: 'Playfair Display', fontSize: '1.5rem', fontWeight: 700 }}>
            Voyage<span style={{ color: '#C9A84C' }}>Vista</span>
          </span>
        </Link>

        <div style={{ background: 'rgba(18,18,26,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 24, padding: 36 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 6 }}>Créer un compte</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 28 }}>
            Rejoignez la communauté VoyageVista
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Prénom</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="input-field" style={{ width: '100%', paddingLeft: 36 }} placeholder="Jean" required />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Nom</label>
                <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="input-field" style={{ width: '100%' }} placeholder="Dupont" required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" style={{ width: '100%', paddingLeft: 36 }} placeholder="jean@dupont.com" required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input type={show ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-field" style={{ width: '100%', paddingLeft: 36, paddingRight: 44 }} placeholder="Min. 6 caractères" required />
                <button type="button" onClick={() => setShow(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Je suis</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { value: 'traveler', label: '✈️ Voyageur', desc: 'Je cherche des voyages' },
                  { value: 'provider', label: '🏢 Prestataire', desc: 'Je propose des offres' },
                ].map(opt => (
                  <label key={opt.value} style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${form.role === opt.value ? 'rgba(201,168,76,0.4)' : 'var(--border-light)'}`, background: form.role === opt.value ? 'rgba(201,168,76,0.05)' : 'var(--dark-4)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="radio" name="role" value={opt.value} checked={form.role === opt.value} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ display: 'none' }} />
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2, color: form.role === opt.value ? '#C9A84C' : 'var(--text)' }}>{opt.label}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{opt.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0A0A0F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Création...</> : <>Créer mon compte <ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 24 }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#C9A84C', fontWeight: 600 }}>Se connecter</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
