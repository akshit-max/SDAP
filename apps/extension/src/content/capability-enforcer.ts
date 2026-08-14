import { platformRegistry } from '../providers/platform-registry';
import type { ExtensionMessage, ExtensionResponse, ExtensionSession } from '../lib/types';

// Helper to send messages to background script
function sendMessage<T>(message: ExtensionMessage): Promise<ExtensionResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || { success: false, error: 'No response from background' });
    });
  });
}

// Ensure we only run once per page load
if (!(window as any).__WITHUS_ENFORCER_LOADED__) {
  (window as any).__WITHUS_ENFORCER_LOADED__ = true;
  initEnforcer();
}

// ─── Cache key for instant first-paint restriction (session-scoped, cleared on browser close) ──
const WITHUS_CACHE_KEY = 'withus_cap_cache_v1';

/** Builds and injects the CSS <style> tag for the given restriction list. */
function injectCSS(config: ReturnType<typeof platformRegistry.getForHost>, restrictions: string[]) {
  if (!config) return;
  const styleId = 'withus-capability-enforcer-css';
  const stylesToInject: string[] = [];
  for (const cap of restrictions) {
    const rule = config.capabilityRestrictions?.[cap];
    if (rule?.hideElementsCSS) stylesToInject.push(...rule.hideElementsCSS);
  }
  if (stylesToInject.length === 0) return;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.documentElement.appendChild(styleEl);
  }
  styleEl.textContent = stylesToInject
    .map(sel => `${sel} { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }`)
    .join('\n');
}

async function initEnforcer() {
  const config = platformRegistry.getForHost(location.hostname);
  if (!config || !config.capabilityRestrictions) {
    return; // Not a supported platform, or no capability restrictions defined
  }

  // ── INSTANT PAINT: apply cached restrictions before any network call ────────
  // On every MCA page navigation the cache fires synchronously (sub-millisecond)
  // so there is zero visible flash of unrestricted content on repeat visits.
  try {
    const cached = await chrome.storage.session.get(WITHUS_CACHE_KEY);
    const cachedRestrictions: string[] | undefined = cached[WITHUS_CACHE_KEY];
    if (cachedRestrictions && cachedRestrictions.length > 0) {
      injectCSS(config, cachedRestrictions);
    }
  } catch (_) {
    // storage unavailable — fall through to network fetch
  }

  // ── FRESH FETCH: always verify with the backend and update cache ─────────────
  const response = await sendMessage<{ sessions: ExtensionSession[]; orgId: string }>({
    type: 'GET_ACTIVE_SESSION',
    payload: { domain: location.hostname },
  });

  if (!response.success || !response.data?.sessions.length) {
    // Session gone — clear cache and remove injected CSS so nothing stale persists
    chrome.storage.session.remove(WITHUS_CACHE_KEY).catch(() => {});
    document.getElementById('withus-capability-enforcer-css')?.remove();
    return;
  }

  // For this POC, we use the first active session for this domain.
  // We assume only one active session per platform.
  const session = response.data.sessions[0];

  let restrictionsToApply: string[] = [];

  if (config.id === 'MCA') {
    // If backend provided explicit restrictions, use them. 
    // If missing (legacy session), derive from capabilities.
    let mcaRestricted = session.mcaRestrictedModules;
    if (!mcaRestricted && Array.isArray(session.capabilities)) {
      const MCA_TOP_LEVEL_MODULES = ['mca.master_data', 'mca.llp_efiling', 'mca.fo_services', 'mca.dsc_services', 'mca.company_efiling', 'mca.complaints', 'mca.document_related_services', 'mca.payment_services', 'mca.id_databank'];
      mcaRestricted = MCA_TOP_LEVEL_MODULES.filter(mod => !session.capabilities!.includes(mod));
    }
    
    if (!mcaRestricted || mcaRestricted.length === 0) {
      chrome.storage.session.remove(WITHUS_CACHE_KEY).catch(() => {});
      document.getElementById('withus-capability-enforcer-css')?.remove();
      return; // No MCA restrictions, do nothing
    }
    restrictionsToApply = mcaRestricted;
  } else {
    if (!session.capabilities || session.capabilities.length === 0) {
      return; // Unrestricted session, do nothing
    }
    restrictionsToApply = session.capabilities;
  }

  // Update cache for the next page load
  chrome.storage.session.set({ [WITHUS_CACHE_KEY]: restrictionsToApply }).catch(() => {});

  const stylesToInject: string[] = [];
  const restrictedRoutes: string[] = [];
  const allowedRoutes: string[] = [];

  // Aggregate restrictions for all mapped restriction rules
  for (const cap of restrictionsToApply) {
    const restriction = config.capabilityRestrictions[cap];
    if (restriction) {
      if (restriction.hideElementsCSS) {
        stylesToInject.push(...restriction.hideElementsCSS);
      }
      if (restriction.restrictedRoutePatterns) {
        restrictedRoutes.push(...restriction.restrictedRoutePatterns);
      }
      if (restriction.allowedRoutePatterns) {
        allowedRoutes.push(...restriction.allowedRoutePatterns);
      }
    }
  }

  if (stylesToInject.length === 0 && restrictedRoutes.length === 0) {
    return; // No actionable restrictions
  }

  // 1. Inject/update permanent CSS to hide elements (injectCSS is idempotent)
  if (stylesToInject.length > 0) {
    injectCSS(config, restrictionsToApply);
  }

  // 2. Intercept SPA routing
  if (restrictedRoutes.length > 0 || allowedRoutes.length > 0) {
    enforceRoute(location.href, restrictedRoutes, allowedRoutes);

    // Override pushState and replaceState to catch SPA navigations
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const url = args[2];
      if (url && typeof url === 'string') {
        const fullUrl = new URL(url, location.origin).href;
        if (isRouteRestricted(fullUrl, restrictedRoutes, allowedRoutes)) {
          showRestrictedToast();
          return; // Block navigation
        }
      }
      return originalPushState.apply(this, args);
    };

    history.replaceState = function (...args) {
      const url = args[2];
      if (url && typeof url === 'string') {
        const fullUrl = new URL(url, location.origin).href;
        if (isRouteRestricted(fullUrl, restrictedRoutes, allowedRoutes)) {
          showRestrictedToast();
          return;
        }
      }
      return originalReplaceState.apply(this, args);
    };

    // Catch popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      enforceRoute(location.href, restrictedRoutes, allowedRoutes);
    });
  }
}

function isRouteRestricted(urlStr: string, restricted: string[], allowed: string[]): boolean {
  try {
    const url = new URL(urlStr, location.origin);
    const pathAndHash = url.pathname + url.hash;

    // Check if explicitly restricted
    for (const pattern of restricted) {
      if (pathAndHash.includes(pattern)) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

function enforceRoute(urlStr: string, restricted: string[], allowed: string[]) {
  if (isRouteRestricted(urlStr, restricted, allowed)) {
    showRestrictedToast();
    // Redirect to root or a safe allowed route to escape the restricted area
    const safeRoute = allowed.length > 0 ? allowed[0] : '/';
    location.replace(safeRoute);
  }
}

function showRestrictedToast() {
  let toast = document.getElementById('withus-restriction-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'withus-restriction-toast';
    toast.style.cssText = [
      'position:fixed', 'top:24px', 'right:24px', 'z-index:2147483647',
      'background:#dc3545', 'color:#ffffff', 'border-radius:8px',
      'padding:12px 20px', 'font-family:system-ui,sans-serif', 'font-size:14px',
      'font-weight:600', 'box-shadow:0 10px 40px rgba(0,0,0,0.5)',
      'transition:opacity 0.3s ease', 'pointer-events:none'
    ].join(';');
    toast.textContent = 'Access Restricted by Administrator';
    document.body.appendChild(toast);
  }
  
  toast.style.opacity = '1';
  setTimeout(() => {
    toast!.style.opacity = '0';
  }, 3000);
}
