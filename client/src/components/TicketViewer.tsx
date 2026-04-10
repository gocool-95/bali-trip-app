import {
  IonButton, IonIcon, IonImg, IonItem, IonLabel, IonList, IonText,
} from '@ionic/react';
import { documentOutline, cameraOutline } from 'ionicons/icons';

interface TicketViewerProps {
  ticketImages?: string[];
  bookingRef?: string;
  confirmationNumber?: string;
  onAddTicket?: () => void;
}

const TicketViewer: React.FC<TicketViewerProps> = ({
  ticketImages,
  bookingRef,
  confirmationNumber,
  onAddTicket,
}) => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  return (
    <div>
      {bookingRef && (
        <IonItem lines="none">
          <IonIcon icon={documentOutline} slot="start" color="primary" />
          <IonLabel>
            <p>Booking Reference</p>
            <h3>{bookingRef}</h3>
          </IonLabel>
        </IonItem>
      )}
      {confirmationNumber && (
        <IonItem lines="none">
          <IonIcon icon={documentOutline} slot="start" color="primary" />
          <IonLabel>
            <p>Confirmation #</p>
            <h3>{confirmationNumber}</h3>
          </IonLabel>
        </IonItem>
      )}

      {ticketImages && ticketImages.length > 0 && (
        <IonList>
          {ticketImages.map((img, idx) => (
            <IonItem key={idx} lines="none">
              <IonImg
                src={img.startsWith('http') || img.startsWith('data:') ? img : `${apiBase}${img}`}
                alt={`Ticket ${idx + 1}`}
                style={{ maxHeight: '200px', borderRadius: '8px' }}
              />
            </IonItem>
          ))}
        </IonList>
      )}

      {(!ticketImages || ticketImages.length === 0) && !bookingRef && !confirmationNumber && (
        <IonText color="medium">
          <p style={{ padding: '0 16px' }}>No tickets or bookings attached</p>
        </IonText>
      )}

      {onAddTicket && (
        <IonButton fill="outline" expand="block" onClick={onAddTicket} style={{ margin: '8px 16px' }}>
          <IonIcon slot="start" icon={cameraOutline} />
          Add Ticket / Booking
        </IonButton>
      )}
    </div>
  );
};

export default TicketViewer;
