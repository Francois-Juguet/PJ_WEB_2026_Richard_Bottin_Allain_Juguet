// ============================================================
// CartContext.jsx — gestion de l'itinéraire en cours de construction
// Joue le rôle de "panier" : l'utilisateur y ajoute des transports,
// hébergements et activités avant de valider sa réservation.
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
import { itinerariesAPI } from '../lib/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Itinéraire actuellement ouvert (null si aucun)
  const [currentItinerary, setCurrentItinerary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Charge un itinéraire existant depuis l'API (par son id)
  const loadItinerary = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await itinerariesAPI.getOne(id);
      setCurrentItinerary(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ajoute un transport à l'itinéraire courant
  const addTransport = useCallback(async (itineraryId, transportId, opts = {}) => {
    const { data } = await itinerariesAPI.update(itineraryId, { action: 'add_transport', transport_id: transportId, ...opts });
    setCurrentItinerary(data);
    return data;
  }, []);

  // Ajoute un hébergement à l'itinéraire courant
  const addAccommodation = useCallback(async (itineraryId, accommodationId, opts = {}) => {
    const { data } = await itinerariesAPI.update(itineraryId, { action: 'add_accommodation', accommodation_id: accommodationId, ...opts });
    setCurrentItinerary(data);
    return data;
  }, []);

  // Ajoute une activité à l'itinéraire courant
  const addActivity = useCallback(async (itineraryId, activityId, opts = {}) => {
    const { data } = await itinerariesAPI.update(itineraryId, { action: 'add_activity', activity_id: activityId, ...opts });
    setCurrentItinerary(data);
    return data;
  }, []);

  // Supprime un élément (transport, hébergement ou activité) de l'itinéraire
  const removeItem = useCallback(async (itineraryId, action, itemId) => {
    const { data } = await itinerariesAPI.update(itineraryId, { action, item_id: itemId });
    setCurrentItinerary(data);
    return data;
  }, []);

  // Nombre total d'éléments dans l'itinéraire (affiché sur l'icône panier)
  const itemCount = currentItinerary
    ? (currentItinerary.transports?.length ?? 0)
      + (currentItinerary.accommodations?.length ?? 0)
      + (currentItinerary.activities?.length ?? 0)
    : 0;

  return (
    <CartContext.Provider value={{ currentItinerary, setCurrentItinerary, loading, loadItinerary, addTransport, addAccommodation, addActivity, removeItem, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook personnalisé pour accéder au contexte panier
export const useCart = () => useContext(CartContext);
