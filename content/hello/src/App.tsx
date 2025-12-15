import { useState, useEffect } from 'react';
import { bridge, AppInfo, Entitlements } from '@shared/bridge';
import './App.css';

function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [status, setStatus] = useState<string>('Ready');

  useEffect(() => {
    // Load app info and entitlements on mount
    loadAppInfo();
    loadEntitlements();
  }, []);

  const loadAppInfo = async () => {
    try {
      const info = await bridge.getAppInfo();
      setAppInfo(info);
      setStatus(`App v${info.version} (Build ${info.build})`);
    } catch (error) {
      console.error('Failed to get app info:', error);
      setStatus('Error loading app info');
    }
  };

  const loadEntitlements = async () => {
    try {
      const ents = await bridge.getEntitlements();
      setEntitlements(ents);
    } catch (error) {
      console.error('Failed to get entitlements:', error);
    }
  };

  const handleHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    bridge.haptic(type);
    setStatus(`Haptic: ${type}`);
  };

  const handlePlaySound = () => {
    bridge.playSound('click');
    setStatus('Playing sound: click');
  };

  const handleAnalytics = () => {
    bridge.analytics('hello_world_test', { timestamp: Date.now() });
    setStatus('Analytics event logged');
  };

  const handleCheckEntitlements = async () => {
    await loadEntitlements();
    if (entitlements) {
      setStatus(`Remove Ads: ${entitlements.removeAds ? 'Yes' : 'No'}`);
    }
  };

  const handleShowAd = async () => {
    setStatus('Requesting ad...');
    const shown = await bridge.showInterstitialAd();
    setStatus(shown ? 'Ad shown' : 'Ad not shown (may be blocked by entitlements or unavailable)');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hello World</h1>
        <p className="status">{status}</p>
      </header>

      <main className="app-main">
        <div className="info-section">
          {appInfo && (
            <div className="info-item">
              <strong>Version:</strong> {appInfo.version}
            </div>
          )}
          {appInfo && (
            <div className="info-item">
              <strong>Build:</strong> {appInfo.build}
            </div>
          )}
          {entitlements && (
            <div className="info-item">
              <strong>Remove Ads:</strong> {entitlements.removeAds ? 'Yes' : 'No'}
            </div>
          )}
        </div>

        <div className="button-grid">
          <button onClick={() => handleHaptic('light')} className="button">
            Haptic: Light
          </button>
          <button onClick={() => handleHaptic('medium')} className="button">
            Haptic: Medium
          </button>
          <button onClick={() => handleHaptic('heavy')} className="button">
            Haptic: Heavy
          </button>
          <button onClick={() => handleHaptic('success')} className="button">
            Haptic: Success
          </button>
          <button onClick={() => handleHaptic('error')} className="button">
            Haptic: Error
          </button>
          <button onClick={handlePlaySound} className="button">
            Play Sound
          </button>
          <button onClick={handleAnalytics} className="button">
            Log Analytics
          </button>
          <button onClick={handleCheckEntitlements} className="button">
            Check Entitlements
          </button>
          <button onClick={handleShowAd} className="button">
            Show Ad
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
