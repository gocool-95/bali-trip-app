interface PaymentBadgeProps {
  status?: string;
  amount?: number;
  currency?: string;
}

const IDR_TO_INR = 0.0053;
const USD_TO_INR = 87.0;

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  if (currency === 'USD') return `$${amount}`;
  if (amount >= 1000000) return `IDR ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `IDR ${(amount / 1000).toFixed(0)}k`;
  return `IDR ${amount}`;
}

export function toINR(amount: number, currency: string = 'IDR'): number {
  if (currency === 'USD') return Math.round(amount * USD_TO_INR);
  return Math.round(amount * IDR_TO_INR);
}

export function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 1000).toFixed(1)}k`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount}`;
}

export function totalToINR(idr: number, usd: number): number {
  return Math.round(idr * IDR_TO_INR + usd * USD_TO_INR);
}

const badgeStyles: Record<string, { bg: string; color: string; border: string }> = {
  paid:    { bg: '#10B98118', color: '#059669', border: '#10B98130' },
  pending: { bg: '#F59E0B18', color: '#D97706', border: '#F59E0B30' },
  free:    { bg: '#8896A612', color: '#8896A6', border: '#8896A620' },
};

const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status, amount, currency }) => {
  const key = (!status || status === 'free') ? 'free' : status;
  const style = badgeStyles[key] || badgeStyles.free;
  const label = key === 'paid' ? 'Paid' : key === 'pending' ? 'Pending' : 'Free';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.3px',
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: style.color, flexShrink: 0,
      }} />
      {label}{amount ? ` · ${formatCurrency(amount, currency)} (${formatINR(toINR(amount, currency))})` : ''}
    </span>
  );
};

export default PaymentBadge;
