import { IonButton, IonIcon } from '@ionic/react';
import { navigateOutline } from 'ionicons/icons';

interface NavigateButtonProps {
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  label?: string;
  size?: 'small' | 'default' | 'large';
  expand?: 'block' | 'full';
}

const NavigateButton: React.FC<NavigateButtonProps> = ({
  googleMapsUrl,
  latitude,
  longitude,
  label = 'Navigate',
  size = 'default',
  expand,
}) => {
  const handleNavigate = () => {
    let url = googleMapsUrl;
    if (!url && latitude && longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }
    if (url) {
      window.open(url, '_system');
    }
  };

  if (!googleMapsUrl && !latitude && !longitude) return null;

  return (
    <IonButton
      color="secondary"
      size={size}
      expand={expand}
      onClick={handleNavigate}
    >
      <IonIcon slot="start" icon={navigateOutline} />
      {label}
    </IonButton>
  );
};

export default NavigateButton;
