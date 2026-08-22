import { platformRegistry } from './apps/extension/src/providers/platform-registry';

// 1. Get the GitHub config
const config = platformRegistry.getForHost('github.com');
console.log('GitHub Config Found:', !!config);
console.log('Config ID:', config?.id);

if (!config) {
  console.log('Test Failed: Could not find GitHub config.');
  process.exit(1);
}

// 2. Mock a session with RESTRICTED access (allowed: 'github.repo_actions')
const mockSession = {
  id: 'sess_123',
  integrationProvider: 'GITHUB',
  capabilities: ['github.repo_actions'] // Only Actions allowed, everything else should be restricted
};

console.log('\n--- Mock Session ---');
console.log('Capabilities (Allowed):', mockSession.capabilities);

// 3. Run the capability-enforcer logic
let restrictionsToApply: string[] = [];

if (config.id === 'MCA') {
  console.log('Test Failed: Should not enter MCA branch.');
} else {
  if (!mockSession.capabilities) {
    console.log('Session is unrestricted (Full Access).');
  } else {
    const allPlatformCaps = Object.keys(config.capabilityRestrictions || {});
    restrictionsToApply = allPlatformCaps.filter(cap => !mockSession.capabilities.includes(cap));
    console.log('\n--- Enforcer Logic Result ---');
    console.log('Total Capabilities configured for GitHub:', allPlatformCaps.length);
    console.log('Restrictions to apply (Denied):', restrictionsToApply.length);
    console.log('Modules hidden:', restrictionsToApply);
    
    // Check if repo_actions is hidden (it shouldn't be)
    console.log('Is repo_actions hidden? (Expected: false)', restrictionsToApply.includes('github.repo_actions'));
    // Check if repo_settings is hidden (it should be)
    console.log('Is repo_settings hidden? (Expected: true)', restrictionsToApply.includes('github.repo_settings'));
  }
}

// 4. Check CSS styles that would be injected
console.log('\n--- CSS Styles to Inject ---');
const stylesToInject: string[] = [];
const restrictedRoutes: string[] = [];

for (const cap of restrictionsToApply) {
  const restriction = config.capabilityRestrictions?.[cap];
  if (restriction) {
    if (restriction.hideElementsCSS) stylesToInject.push(...restriction.hideElementsCSS);
    if (restriction.restrictedRoutePatterns) restrictedRoutes.push(...restriction.restrictedRoutePatterns);
  }
}

console.log('Total CSS selectors to hide:', stylesToInject.length);
console.log('Selectors:');
stylesToInject.forEach(sel => console.log(`  - ${sel}`));

console.log('\nTotal Routes to intercept:', restrictedRoutes.length);
console.log('Routes:');
restrictedRoutes.forEach(route => console.log(`  - ${route}`));
