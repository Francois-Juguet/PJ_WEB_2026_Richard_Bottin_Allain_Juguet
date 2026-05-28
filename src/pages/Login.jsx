import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Plane, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const { toast }             = useToast();
  const navigate              = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast('Bienvenue !', 'success');
      navigate('/');
    } catch (err) {
      toast(err.response?.data?.error || 'Identifiants incorrects', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920) center/cover no-repeat', filter: 'brightness(0.2)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={20} style={{ color: '#0A0A0F', transform: 'rotate(-30deg)' }} />
          </div>
          <span style={{ fontFamily: 'Playfair Display', fontSize: '1.5rem', fontWeight: 700 }}>
            Voyage<span style={{ color: '#C9A84C' }}>Vista</span>
          </span>
        </Link>

        {/* Card */}
        <div style={{ background: 'rgba(18,18,26,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 24, padding: 36 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 6 }}>Connexion</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 28 }}>
            Accédez à votre espace voyageur
          </p>

          {/* Demo accounts */}
          <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
            <p style={{ fontSize: '0.75rem', color: '#C9A84C', fontWeight: 600, marginBottom: 8 }}>Comptes de démonstration</p>
            {[
              { email: 'traveler@voyagevista.com', role: 'Voyageur' },
              { email: 'admin@voyagevista.com', role: 'Admin' },
            ].map(acc => (
              <button key={acc.email} onClick={() => setForm({ email: acc.email, password: 'password' })}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = '#E8E8F0'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                <span style={{ color: '#C9A84C' }}>{acc.role}:</span> {acc.email} / password
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" style={{ width: '100%', paddingLeft: 40 }} placeholder="votre@email.com" required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input type={show ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-field" style={{ width: '100%', paddingLeft: 40, paddingRight: 44 }} placeholder="••••••••" required />
                <button type="button" onClick={() => setShow(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0A0A0F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Connexion...</> : <>Se connecter <ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 24 }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: '#C9A84C', fontWeight: 600 }}>Créer un compte</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
