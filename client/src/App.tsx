import { useState, useCallback } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton,
  IonIcon, IonLabel,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  homeOutline, mapOutline, alertCircleOutline, walletOutline,
} from 'ionicons/icons';

import Dashboard from './pages/Dashboard';
import Itinerary from './pages/Itinerary';
import DayView from './pages/DayView';
import ActivityDetail from './pages/ActivityDetail';
import PendingItems from './pages/PendingItems';
import PaymentSummary from './pages/PaymentSummary';
import TravelDocs from './pages/TravelDocs';
import PackingList from './pages/PackingList';
import SplashScreen from './components/SplashScreen';
import QuickConverter from './components/QuickConverter';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.always.css';

/* Theme variables */
import './theme/variables.css';

import { setupIonicReact } from '@ionic/react';
setupIonicReact();

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showConverter, setShowConverter] = useState(false);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <IonApp>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            {/* Tab root pages */}
            <Route exact path="/tabs/dashboard" component={Dashboard} />
            <Route exact path="/tabs/itinerary" component={Itinerary} />
            <Route exact path="/tabs/pending" component={PendingItems} />
            <Route exact path="/tabs/payments" component={PaymentSummary} />

            {/* Detail pages */}
            <Route exact path="/day/:dayNumber" component={DayView} />
            <Route exact path="/activity/new" component={ActivityDetail} />
            <Route exact path="/activity/:id" component={ActivityDetail} />
            <Route exact path="/travel-docs" component={TravelDocs} />
            <Route exact path="/packing-list" component={PackingList} />

            {/* Default redirect */}
            <Route exact path="/">
              <Redirect to="/tabs/dashboard" />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom" className="bali-tab-bar">
            <IonTabButton tab="dashboard" href="/tabs/dashboard">
              <IonIcon icon={homeOutline} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
            <IonTabButton tab="itinerary" href="/tabs/itinerary">
              <IonIcon icon={mapOutline} />
              <IonLabel>Itinerary</IonLabel>
            </IonTabButton>
            <IonTabButton tab="pending" href="/tabs/pending">
              <IonIcon icon={alertCircleOutline} />
              <IonLabel>Pending</IonLabel>
            </IonTabButton>
            <IonTabButton tab="payments" href="/tabs/payments">
              <IonIcon icon={walletOutline} />
              <IonLabel>Payments</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>

      {/* Floating currency button — rendered after router to avoid interfering with Ionic layout */}
      {!showSplash && (
        <div style={{ position: 'fixed', bottom: '76px', right: '16px', zIndex: 9998, pointerEvents: 'none' }}>
          <button
            onClick={() => setShowConverter(true)}
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #34D399, #0891B2)',
              border: 'none', color: 'white', fontSize: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(52,211,153,0.4)',
              touchAction: 'manipulation', pointerEvents: 'auto',
            }}
          >
            💱
          </button>
        </div>
      )}
      <QuickConverter isOpen={showConverter} onClose={() => setShowConverter(false)} />
    </IonApp>
  );
};

export default App;
