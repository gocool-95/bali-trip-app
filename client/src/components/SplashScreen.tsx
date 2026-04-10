import { useState, useEffect } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 800);
    const t2 = setTimeout(() => setPhase('fade'), 2800);
    const t3 = setTimeout(() => onComplete(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`splash ${phase === 'fade' ? 'splash--fade' : ''}`}>
      {/* Animated background blobs */}
      <div className="splash-blob splash-blob--1" />
      <div className="splash-blob splash-blob--2" />
      <div className="splash-blob splash-blob--3" />

      <div className="splash-content">
        <div className={`splash-logo ${phase !== 'logo' ? 'splash-logo--up' : ''}`}>
          <img src="/logo.png" alt="Keego" className="splash-logo-img" />
        </div>

        <div className={`splash-text ${phase === 'text' || phase === 'fade' ? 'splash-text--visible' : ''}`}>
          <h1 className="splash-title">
            <span className="splash-title-line">Keego's</span>
            <span className="splash-title-line splash-title-line--accent">Adventure to Bali</span>
          </h1>
          <p className="splash-subtitle">Feb 27 – Mar 8, 2026</p>
          <div className="splash-dots">
            <span className="splash-dot" />
            <span className="splash-dot" />
            <span className="splash-dot" />
          </div>
        </div>
      </div>

      {/* Decorative palm leaves */}
      <div className="splash-leaf splash-leaf--left">🌴</div>
      <div className="splash-leaf splash-leaf--right">🌺</div>
    </div>
  );
};

export default SplashScreen;
