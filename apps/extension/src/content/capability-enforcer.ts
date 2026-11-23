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
  if (config.hideElementsCSS && config.hideElementsCSS.length > 0) {
    stylesToInject.push(...config.hideElementsCSS);
  }
  for (const cap of restrictions) {
    const rule = config.capabilityRestrictions?.[cap];
    if (rule?.hideElementsCSS) stylesToInject.push(...rule.hideElementsCSS);
  }
  if (stylesToInject.length === 0) return;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.documentElement.appendChild(styleEl);
    }
  }
  styleEl.textContent = stylesToInject
    .map(sel => `${sel} { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }`)
    .join('\n');
}

async function initEnforcer() {
  const config = platformRegistry.getForHost(location.hostname);
  if (!config || (!config.capabilityRestrictions && !config.hideElementsCSS)) {
    return; // Not a supported platform, or no capability restrictions/hiding defined
  }

  // ── INSTANT PAINT: apply cached restrictions before any network call ────────
  // On every MCA page navigation the cache fires synchronously (sub-millisecond)
  // so there is zero visible flash of unrestricted content on repeat visits.
  try {
    const cached = await chrome.storage.session.get(WITHUS_CACHE_KEY);
    const cachedRestrictions = cached[WITHUS_CACHE_KEY] as string[] | undefined;
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
    // For all non-MCA platforms:
    // session.capabilities = the modules the delegate IS ALLOWED to use.
    // (The "Allowed Modules" checklist in the web dashboard sets this.)
    // Restrictions = all capability keys defined for this platform MINUS the allowed ones.
    if (!session.capabilities || session.capabilities.length === 0) {
      if (config.hideElementsCSS && config.hideElementsCSS.length > 0) {
        restrictionsToApply = [];
      } else {
        chrome.storage.session.remove(WITHUS_CACHE_KEY).catch(() => {});
        document.getElementById('withus-capability-enforcer-css')?.remove();
        return;
      }
    } else {
      const allPlatformCaps = Object.keys(config.capabilityRestrictions || {});
      const restricted = allPlatformCaps.filter(cap => !session.capabilities!.includes(cap));
      if (restricted.length === 0) {
        if (config.hideElementsCSS && config.hideElementsCSS.length > 0) {
          restrictionsToApply = [];
        } else {
          chrome.storage.session.remove(WITHUS_CACHE_KEY).catch(() => {});
          document.getElementById('withus-capability-enforcer-css')?.remove();
          return;
        }
      } else {
        restrictionsToApply = restricted;
      }
    }
  }

  // Update cache for the next page load
  chrome.storage.session.set({ [WITHUS_CACHE_KEY]: restrictionsToApply }).catch(() => {});

  const stylesToInject: string[] = [];
  if (config.hideElementsCSS && config.hideElementsCSS.length > 0) {
    stylesToInject.push(...config.hideElementsCSS);
  }
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

    // --- LINKEDIN SPA FIX ---
    // LinkedIn's SPA dynamically wipes unknown elements from document.head on certain navigations.
    // This strictly-scoped observer reinstates the exact same <style> element if removed.
    if (config.id === 'LINKEDIN') {
      if (!(window as any).__WITHUS_OBSERVER_LOADED__) {
        (window as any).__WITHUS_OBSERVER_LOADED__ = true;
        const styleId = 'withus-capability-enforcer-css';
        
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              for (let i = 0; i < mutation.removedNodes.length; i++) {
                const removedNode = mutation.removedNodes[i];
                if (removedNode instanceof HTMLStyleElement && removedNode.id === styleId) {
                  injectCSS(config, restrictionsToApply);
                }
              }
              // Catch complete <head> replacements by the SPA
              for (let i = 0; i < mutation.addedNodes.length; i++) {
                const addedNode = mutation.addedNodes[i];
                if (addedNode instanceof HTMLHeadElement) {
                  injectCSS(config, restrictionsToApply);
                  observer.observe(addedNode, { childList: true }); // re-attach to new head
                }
              }
            }
          }
        });
        
        const attachObserver = () => {
          if (document.head) observer.observe(document.head, { childList: true });
          if (document.documentElement) observer.observe(document.documentElement, { childList: true });
        };
        
        if (document.head) {
          attachObserver();
        } else {
          window.addEventListener('DOMContentLoaded', attachObserver, { once: true });
        }
      }
    }

    // --- INCOMETAX PORTAL SPA ENFORCER ---
    // Income Tax Portal renders its menu dynamically via Angular components.
    // In addition to CSS selectors, we scan navbar elements and hide matching items by text and attribute.
    if (config.id === 'INCOMETAX' && restrictionsToApply.length > 0) {
      const ITR_TEXT_MAP: Record<string, string[]> = {
        'incometax.efile': ['e-file'],
        'incometax.authorised_partners': ['authorised partners', 'authorised partner', 'authorised'],
        'incometax.services': ['services'],
        'incometax.ais': ['ais'],
        'incometax.pending_actions': ['pending actions', 'pending action'],
        'incometax.grievances': ['grievances', 'grievance'],
        'incometax.help': ['help', 'help & guidance'],
        'incometax.individual_huf': ['individual', 'huf', 'e-file'],
        'incometax.company': ['company', 'authorised partners'],
        'incometax.non_company': ['non-company', 'pending actions'],
        'incometax.tax_professionals': ['tax professional', 'tax professionals & others', 'services'],
        'incometax.downloads': ['downloads', 'ais'],
      };

      const hideByText = () => {
        const keywordsToHide: string[] = [];
        for (const cap of restrictionsToApply) {
          const words = ITR_TEXT_MAP[cap];
          if (words) keywordsToHide.push(...words);
        }
        if (keywordsToHide.length === 0) return;

        // Query candidate buttons, links, and list items in the navigation/header
        const candidates = document.querySelectorAll<HTMLElement>(
          'nav button, nav a, nav li, header button, header a, header li, [role="navigation"] button, [role="navigation"] a, [id*="navBar-"], app-menu-item-unlogged button, .mat-mdc-tab-header, .mat-mdc-tab, .mat-mdc-menu-trigger, .menuText, [role="menuitem"], [id="e-File"], [id="Authorised Partners"], [id="Services"], [id="AIS"], [id="Pending Actions"], [id="Grievances"], [id="Help"], button, a'
        );

        candidates.forEach(el => {
          const text = (el.innerText || el.textContent || '').trim().toLowerCase();
          const labelText = (el.querySelector('.mdc-button__label')?.textContent || '').trim().toLowerCase();
          const nameAttr = (el.getAttribute('name') || '').trim().toLowerCase();
          const idAttr = (el.getAttribute('id') || '').trim().toLowerCase();

          // Target navigation IDs should never be excluded by vertical offset
          const isKnownNavId = ['e-file', 'authorised partners', 'services', 'ais', 'pending actions', 'grievances', 'help'].includes(idAttr);
          const rect = el.getBoundingClientRect();
          if (!isKnownNavId && rect.top > 400 && rect.height > 0) return;

          const matches = keywordsToHide.some(kw => {
            if (kw === 'company') {
              if (text.includes('non-company') || nameAttr.includes('non-company') || labelText.includes('non-company')) return false;
            }
            return (
              text === kw ||
              labelText === kw ||
              nameAttr === kw ||
              idAttr === kw ||
              (kw.length >= 3 && (text.includes(kw) || labelText.includes(kw) || nameAttr.includes(kw) || idAttr.includes(kw)))
            );
          });

          if (matches) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            const parent = el.closest('span, li, div.nav-item, app-menu-item, div.menuText');
            if (parent && parent !== document.body && parent.parentElement && parent.parentElement !== document.body) {
              (parent as HTMLElement).style.setProperty('display', 'none', 'important');
              (parent as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
            }
          }
        });
      };

      const startEnforcing = () => {
        hideByText();
        const target = document.body || document.documentElement;
        if (target) {
          const itrObserver = new MutationObserver(() => hideByText());
          itrObserver.observe(target, { childList: true, subtree: true });
        }
      };

      if (document.body) {
        startEnforcing();
      } else {
        window.addEventListener('DOMContentLoaded', startEnforcing, { once: true });
      }
    }
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
