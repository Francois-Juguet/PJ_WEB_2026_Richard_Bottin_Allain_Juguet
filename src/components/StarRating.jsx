import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, size = 14, showNumber = true, count }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={size} style={{ fill: i <= Math.round(rating) ? '#C9A84C' : 'transparent', stroke: i <= Math.round(rating) ? '#C9A84C' : '#2E2E45' }} />
        ))}
      </div>
      {showNumber && <span style={{ fontSize: size * 0.85, color: '#C9A84C', fontWeight: 600 }}>{Number(rating).toFixed(1)}</span>}
      {count !== undefined && <span style={{ fontSize: size * 0.8, color: '#8888A8' }}>({count})</span>}
    </div>
  );
}
