import { useState, useEffect } from 'react';
import { bridge, AppInfo, Entitlements } from '@shared/bridge';
import './App.css';

function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [status, setStatus] = useState<string>('Debug Mode');
  const [remoteConfig, setRemoteConfig] = useState<Record<string, any>>({});
  const [gameState, setGameState] = useState<string>('{}');

  useEffect(() => {
    loadAppInfo();
    loadEntitlements();
  }, []);

  const loadAppInfo = async () => {
    try {
      const info = await bridge.getAppInfo();
      setAppInfo(info);
    } catch (error) {
      console.error('Failed to get app info:', error);
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

  const handleToggleEntitlements = async () => {
    if (!bridge.debug) {
      setStatus('Debug methods not available');
      return;
    }
    // Note: Actual implementation would need native support
    setStatus('Toggle entitlements (requires native implementation)');
  };

  const handleForceAd = async () => {
    const shown = await bridge.showInterstitialAd();
    setStatus(shown ? 'Ad forced and shown' : 'Ad not available');
  };

  const handleSimulateRemoteConfig = () => {
    const mockConfig = {
      minBuild: 42,
      latestContentVersion: '2025.03',
      puzzlePackUrl: 'https://example.com/puzzles.json',
      enableAds: true,
      maxInterstitialsPerDay: 1,
    };
    setRemoteConfig(mockConfig);
    setStatus('Remote Config simulated (UI only)');
  };

  const handleClearLocalDB = () => {
    if (!bridge.debug) {
      setStatus('Debug methods not available');
      return;
    }
    bridge.debug.resetLocalData();
    setStatus('Local DB cleared');
  };

  const handleForceContentRefresh = () => {
    if (!bridge.debug) {
      setStatus('Debug methods not available');
      return;
    }
    bridge.debug.forceContentRefresh();
    setStatus('Content refresh forced');
  };

  const handleSetGameState = () => {
    if (!bridge.debug) {
      setStatus('Debug methods not available');
      return;
    }
    try {
      const state = JSON.parse(gameState);
      bridge.debug.setGameState(state);
      setStatus('Game state set');
    } catch (error) {
      setStatus('Invalid JSON in game state');
    }
  };

  const handleInspectState = () => {
    const state = {
      appInfo,
      entitlements,
      remoteConfig,
      timestamp: new Date().toISOString(),
    };
    setStatus(JSON.stringify(state, null, 2));
    console.log('Current State:', state);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Debug Control Panel</h1>
        <p className="status">{status}</p>
      </header>

      <main className="app-main">
        <section className="section">
          <h2>App Info</h2>
          <div className="info-grid">
            {appInfo && (
              <>
                <div className="info-item">
                  <strong>Version:</strong> {appInfo.version}
                </div>
                <div className="info-item">
                  <strong>Build:</strong> {appInfo.build}
                </div>
              </>
            )}
            {entitlements && (
              <div className="info-item">
                <strong>Remove Ads:</strong> {entitlements.removeAds ? 'Yes' : 'No'}
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <h2>Entitlements</h2>
          <div className="button-group">
            <button onClick={loadEntitlements} className="button">
              Refresh Entitlements
            </button>
            <button onClick={handleToggleEntitlements} className="button">
              Toggle Remove Ads
            </button>
          </div>
        </section>

        <section className="section">
          <h2>Ads</h2>
          <div className="button-group">
            <button onClick={handleForceAd} className="button">
              Force Show Ad
            </button>
          </div>
        </section>

        <section className="section">
          <h2>Remote Config</h2>
          <div className="button-group">
            <button onClick={handleSimulateRemoteConfig} className="button">
              Simulate Config
            </button>
          </div>
          {Object.keys(remoteConfig).length > 0 && (
            <pre className="config-display">{JSON.stringify(remoteConfig, null, 2)}</pre>
          )}
        </section>

        <section className="section">
          <h2>Local Storage</h2>
          <div className="button-group">
            <button onClick={handleClearLocalDB} className="button button-danger">
              Clear Local DB
            </button>
          </div>
        </section>

        <section className="section">
          <h2>Content</h2>
          <div className="button-group">
            <button onClick={handleForceContentRefresh} className="button">
              Force Content Refresh
            </button>
          </div>
        </section>

        <section className="section">
          <h2>Game State</h2>
          <textarea
            className="textarea"
            value={gameState}
            onChange={(e) => setGameState(e.target.value)}
            placeholder='{"key": "value"}'
          />
          <div className="button-group">
            <button onClick={handleSetGameState} className="button">
              Set Game State
            </button>
          </div>
        </section>

        <section className="section">
          <h2>Inspection</h2>
          <div className="button-group">
            <button onClick={handleInspectState} className="button">
              Inspect Current State
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
