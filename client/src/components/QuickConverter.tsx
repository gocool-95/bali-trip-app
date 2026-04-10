import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { swapHorizontalOutline, closeOutline } from 'ionicons/icons';

const IDR_TO_INR = 0.0053;
const USD_TO_INR = 87.0;

interface QuickConverterProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickConverter: React.FC<QuickConverterProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<'idr-inr' | 'inr-idr' | 'usd-inr'>('idr-inr');

  if (!isOpen) return null;

  const val = parseFloat(input) || 0;
  let result = '';
  let fromLabel = '';
  let toLabel = '';

  switch (direction) {
    case 'idr-inr':
      fromLabel = 'IDR';
      toLabel = 'INR';
      result = val > 0 ? `₹${(val * IDR_TO_INR).toFixed(2)}` : '—';
      break;
    case 'inr-idr':
      fromLabel = 'INR';
      toLabel = 'IDR';
      result = val > 0 ? `Rp ${Math.round(val / IDR_TO_INR).toLocaleString()}` : '—';
      break;
    case 'usd-inr':
      fromLabel = 'USD';
      toLabel = 'INR';
      result = val > 0 ? `₹${Math.round(val * USD_TO_INR).toLocaleString()}` : '—';
      break;
  }

  const nextDirection = () => {
    setDirection(d => d === 'idr-inr' ? 'inr-idr' : d === 'inr-idr' ? 'usd-inr' : 'idr-inr');
    setInput('');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1E293B', borderRadius: '24px', padding: '24px',
          width: '100%', maxWidth: '400px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          marginBottom: 'env(safe-area-inset-bottom, 0)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>💱 Quick Convert</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: '18px' }} />
          </button>
        </div>

        {/* Direction pills */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {([
            { key: 'idr-inr', label: 'IDR → INR' },
            { key: 'inr-idr', label: 'INR → IDR' },
            { key: 'usd-inr', label: 'USD → INR' },
          ] as const).map(d => (
            <button
              key={d.key}
              onClick={() => { setDirection(d.key); setInput(''); }}
              style={{
                flex: 1, padding: '8px', borderRadius: '12px', border: 'none',
                background: direction === d.key ? '#34D399' : 'rgba(255,255,255,0.08)',
                color: direction === d.key ? '#0F172A' : 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            {fromLabel}
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={direction === 'idr-inr' ? '250000' : direction === 'inr-idr' ? '1000' : '50'}
            autoFocus
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '14px',
              border: '2px solid rgba(52,211,153,0.3)', fontSize: '1.3rem', fontWeight: 700,
              fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)',
              color: 'white', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#34D399'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(52,211,153,0.3)'; }}
          />
        </div>

        {/* Result */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            {toLabel}
          </div>
          <div style={{
            padding: '14px 16px', borderRadius: '14px',
            background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.2)',
            fontSize: '1.3rem', fontWeight: 800, color: '#34D399',
          }}>
            {result}
          </div>
        </div>

        {/* Quick amounts */}
        {direction === 'idr-inr' && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['50000', '100000', '250000', '500000', '1000000'].map(amt => (
              <button
                key={amt}
                onClick={() => setInput(amt)}
                style={{
                  padding: '6px 12px', borderRadius: '10px', border: 'none',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {parseInt(amt) >= 1000000 ? `${parseInt(amt)/1000000}M` : `${parseInt(amt)/1000}k`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickConverter;
