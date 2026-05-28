import { createContext, useContext, useState, useCallback } from 'react';
import { itinerariesAPI } from '../lib/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [currentItinerary, setCurrentItinerary] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadItinerary = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await itinerariesAPI.getOne(id);
      setCurrentItinerary(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransport = useCallback(async (itineraryId, transportId, opts = {}) => {
    const { data } = await itinerariesAPI.update(itineraryId, { action: 'add_transport', transport_id: transportId, ...opts });
    setCurrentItinerary(data);
    return data;
  }, []);

  const addAccommodation = useCallback(async (itineraryId, accommodationId, opts = {}) => {
    const { data } = await itinerariesAPI.update(itineraryId, { action: 'add_accommodation', accommodation_id: accommodationId, ...opts });
    setCurrentItinerary(data);
    return data;
  }, []);

  const addActivity = useCallback(async (itineraryId, activityId, opts = {}) => {
    const { data } = await itinerariesAPI.update(itineraryId, { action: 'add_activity', activity_id: activityId, ...opts });
    setCurrentItinerary(data);
    return data;
  }, []);

  const removeItem = useCallback(async (itineraryId, action, itemId) => {
    const { data } = await itinerariesAPI.update(itineraryId, { action, item_id: itemId });
    setCurrentItinerary(data);
    return data;
  }, []);

  const itemCount = currentItinerary
    ? (currentItinerary.transports?.length ?? 0) + (currentItinerary.accommodations?.length ?? 0) + (currentItinerary.activities?.length ?? 0)
    : 0;

  return (
    <CartContext.Provider value={{ currentItinerary, setCurrentItinerary, loading, loadItinerary, addTransport, addAccommodation, addActivity, removeItem, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
