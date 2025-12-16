import './style.css';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const el = document.querySelector<HTMLDivElement>('#app');
if (!el) throw new Error('#app not found');

el.innerHTML = `
  <main style="max-width: 520px; margin: 40px auto; padding: 16px; font-family: system-ui, -apple-system, sans-serif;">
    <h1 style="font-size: 24px; font-weight: 800; margin: 0 0 12px;">Capacitor Sanity</h1>
    <p style="margin: 0 0 16px; color: #555;">This app proves build number + haptics are wired.</p>

    <section style="border: 1px solid #ddd; border-radius: 12px; padding: 12px; margin-bottom: 12px;">
      <div style="display: grid; grid-template-columns: 110px 1fr; gap: 8px;">
        <div style="color:#666;">Version</div><div id="version">…</div>
        <div style="color:#666;">Build</div><div id="build">…</div>
      </div>
      <button id="refresh" style="margin-top: 12px; width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #111; background:#111; color:#fff; font-weight:700;">
        Refresh App.getInfo()
      </button>
      <div id="appInfoError" style="margin-top: 8px; color: #b00020; font-size: 12px; white-space: pre-wrap;"></div>
    </section>

    <section style="border: 1px solid #ddd; border-radius: 12px; padding: 12px;">
      <button id="haptic" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #0b5; background:#0b5; color:#fff; font-weight:800;">
        Test Haptics (impact)
      </button>
      <button id="hapticSuccess" style="margin-top: 10px; width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #07c; background:#07c; color:#fff; font-weight:800;">
        Test Haptics (success)
      </button>
      <div id="hapticsError" style="margin-top: 8px; color: #b00020; font-size: 12px; white-space: pre-wrap;"></div>
    </section>
  </main>
`;

const versionEl = document.getElementById('version')!;
const buildEl = document.getElementById('build')!;
const appInfoErrorEl = document.getElementById('appInfoError')!;
const hapticsErrorEl = document.getElementById('hapticsError')!;

async function refreshAppInfo() {
  appInfoErrorEl.textContent = '';
  try {
    const info = await App.getInfo();
    versionEl.textContent = info.version;
    buildEl.textContent = String(info.build);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    appInfoErrorEl.textContent = `App.getInfo() failed:\n${errorMsg}`;
    versionEl.textContent = '—';
    buildEl.textContent = '—';
    // Only log in dev (will be stripped in production build)
    if (import.meta.env.DEV) {
      console.error('App.getInfo() failed:', e);
    }
  }
}

async function testImpact() {
  hapticsErrorEl.textContent = '';
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    hapticsErrorEl.textContent = `Haptics.impact() failed:\n${errorMsg}`;
    if (import.meta.env.DEV) {
      console.error('Haptics.impact() failed:', e);
    }
  }
}

async function testSuccess() {
  hapticsErrorEl.textContent = '';
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    hapticsErrorEl.textContent = `Haptics.notification() failed:\n${errorMsg}`;
    if (import.meta.env.DEV) {
      console.error('Haptics.notification() failed:', e);
    }
  }
}

document.getElementById('refresh')!.addEventListener('click', () => void refreshAppInfo());
document.getElementById('haptic')!.addEventListener('click', () => void testImpact());
document.getElementById('hapticSuccess')!.addEventListener('click', () => void testSuccess());

void refreshAppInfo();
