// @ts-nocheck
import { SessionsService } from './apps/api/src/sessions/sessions.service';

const MCA_TOP_LEVEL_MODULES = [
  'mca.master_data',
  'mca.llp_efiling',
  'mca.fo_services',
  'mca.dsc_services',
  'mca.company_efiling',
  'mca.complaints',
  'mca.document_related_services',
  'mca.payment_services',
  'mca.id_databank'
];

async function runTests() {
  // Mock the parts of SessionsService we need
  const mockService = new SessionsService(null as any, null as any, null as any, null as any, null as any);
  
  // Override the database call to return our test scenarios
  mockService['prisma'] = {
    delegatedSession: {
      findMany: async () => [
        { id: '1', integrationProvider: 'GITHUB', capabilities: ['repo'] },
        { id: '2', integrationProvider: 'MCA', capabilities: [] }, // No MCA permissions
        { id: '3', integrationProvider: 'MCA', capabilities: ['mca.company_efiling'] }, // One module
        { id: '4', integrationProvider: 'MCA', capabilities: ['mca.company_efiling', 'mca.dsc_services'] }, // Multiple modules
        { id: '5', integrationProvider: 'MCA', capabilities: [...MCA_TOP_LEVEL_MODULES] }, // All modules
      ]
    }
  } as any;
  
  // Override enrich method
  mockService['enrichSessionsWithResourceNames'] = async (sessions) => sessions;

  const results = await mockService.getIncomingSessions('org_1', 'user_1');
  
  console.log('--- BACKEND CALCULATION TESTS ---');
  
  console.log('\nTest 1: Non-MCA platform (GitHub)');
  const ghSession = results.find(s => s.id === '1');
  console.log('Provider:', ghSession.integrationProvider);
  console.log('Capabilities:', ghSession.capabilities);
  console.log('mcaRestrictedModules exists?', 'mcaRestrictedModules' in ghSession);

  console.log('\nTest 2: No MCA permissions (Should deny all 9)');
  const mcaNoPerms = results.find(s => s.id === '2');
  console.log('Denied Count:', mcaNoPerms.mcaRestrictedModules.length);
  console.log('All 9 denied?', mcaNoPerms.mcaRestrictedModules.length === 9);

  console.log('\nTest 3: One module allowed (mca.company_efiling)');
  const mcaOnePerm = results.find(s => s.id === '3');
  console.log('Denied Count:', mcaOnePerm.mcaRestrictedModules.length);
  console.log('Is company_efiling denied?', mcaOnePerm.mcaRestrictedModules.includes('mca.company_efiling'));
  console.log('Is master_data denied?', mcaOnePerm.mcaRestrictedModules.includes('mca.master_data'));

  console.log('\nTest 4: Multiple modules allowed (Company e-Filing, DSC)');
  const mcaMultiPerm = results.find(s => s.id === '4');
  console.log('Denied Count:', mcaMultiPerm.mcaRestrictedModules.length);
  console.log('Is company_efiling denied?', mcaMultiPerm.mcaRestrictedModules.includes('mca.company_efiling'));
  console.log('Is dsc_services denied?', mcaMultiPerm.mcaRestrictedModules.includes('mca.dsc_services'));
  console.log('Is llp_efiling denied?', mcaMultiPerm.mcaRestrictedModules.includes('mca.llp_efiling'));

  console.log('\nTest 5: All MCA permissions allowed (Should deny 0)');
  const mcaAllPerms = results.find(s => s.id === '5');
  console.log('Denied Count:', mcaAllPerms.mcaRestrictedModules.length);
  console.log('Any denied?', mcaAllPerms.mcaRestrictedModules.length > 0);
}

runTests().catch(console.error);
