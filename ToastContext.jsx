// ============================================================
// ToastContext.jsx — système de notifications (toasts)
// Affiche des messages temporaires en bas-droite de l'écran.
// Types disponibles : 'success', 'error', 'info'
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  // Liste des toasts actifs
  const [toasts, setToasts] = useState([]);

  // Affiche un nouveau toast et le supprime automatiquement après 4 secondes
  const toast = useCallback((message, type = 'info') => {
    const id = Date.now(); // identifiant unique basé sur l'horodatage
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  // Fermeture manuelle d'un toast par l'utilisateur
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  // Icône et couleur selon le type de notification
  const icones = { success: CheckCircle, error: AlertCircle, info: Info };
  const couleurs = { success: '#4ade80', error: '#f87171', info: '#60a5fa' };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Conteneur fixe en haut à droite */}
      <div className="toast-container">
        {toasts.map(t => {
          const Icone = icones[t.type] || Info;
          return (
            <div key={t.id} className={`toast ${t.type}`}>
              <Icone size={18} style={{ color: couleurs[t.type], flexShrink: 0, marginTop: 2 }} />
              <span style={{ flex: 1, fontSize: '0.9rem' }}>{t.message}</span>
              {/* Bouton de fermeture manuelle */}
              <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#8888A8', cursor: 'pointer', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// Hook personnalisé : appelle useToast() dans n'importe quel composant
export const useToast = () => useContext(ToastContext);
