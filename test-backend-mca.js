"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var sessions_service_1 = require("./apps/api/src/sessions/sessions.service");
var MCA_TOP_LEVEL_MODULES = [
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
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var mockService, results, ghSession, mcaNoPerms, mcaOnePerm, mcaMultiPerm, mcaAllPerms;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockService = new sessions_service_1.SessionsService(null, null, null, null, null);
                    // Override the database call to return our test scenarios
                    mockService['prisma'] = {
                        delegatedSession: {
                            findMany: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, [
                                            { id: '1', integrationProvider: 'GITHUB', capabilities: ['repo'] },
                                            { id: '2', integrationProvider: 'MCA', capabilities: [] }, // No MCA permissions
                                            { id: '3', integrationProvider: 'MCA', capabilities: ['mca.company_efiling'] }, // One module
                                            { id: '4', integrationProvider: 'MCA', capabilities: ['mca.company_efiling', 'mca.dsc_services'] }, // Multiple modules
                                            { id: '5', integrationProvider: 'MCA', capabilities: __spreadArray([], MCA_TOP_LEVEL_MODULES, true) }, // All modules
                                        ]];
                                });
                            }); }
                        }
                    };
                    // Override enrich method
                    mockService['enrichSessionsWithResourceNames'] = function (sessions) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, sessions];
                    }); }); };
                    return [4 /*yield*/, mockService.getIncomingSessions('org_1', 'user_1')];
                case 1:
                    results = _a.sent();
                    console.log('--- BACKEND CALCULATION TESTS ---');
                    console.log('\nTest 1: Non-MCA platform (GitHub)');
                    ghSession = results.find(function (s) { return s.id === '1'; });
                    console.log('Provider:', ghSession.integrationProvider);
                    console.log('Capabilities:', ghSession.capabilities);
                    console.log('mcaRestrictedModules exists?', 'mcaRestrictedModules' in ghSession);
                    console.log('\nTest 2: No MCA permissions (Should deny all 9)');
                    mcaNoPerms = results.find(function (s) { return s.id === '2'; });
                    console.log('Denied Count:', mcaNoPerms.mcaRestrictedModules.length);
                    console.log('All 9 denied?', mcaNoPerms.mcaRestrictedModules.length === 9);
                    console.log('\nTest 3: One module allowed (mca.company_efiling)');
                    mcaOnePerm = results.find(function (s) { return s.id === '3'; });
                    console.log('Denied Count:', mcaOnePerm.mcaRestrictedModules.length);
                    console.log('Is company_efiling denied?', mcaOnePerm.mcaRestrictedModules.includes('mca.company_efiling'));
                    console.log('Is master_data denied?', mcaOnePerm.mcaRestrictedModules.includes('mca.master_data'));
                    console.log('\nTest 4: Multiple modules allowed (Company e-Filing, DSC)');
                    mcaMultiPerm = results.find(function (s) { return s.id === '4'; });
                    console.log('Denied Count:', mcaMultiPerm.mcaRestrictedModules.length);
                    console.log('Is company_efiling denied?', mcaMultiPerm.mcaRestrictedModules.includes('mca.company_efiling'));
                    console.log('Is dsc_services denied?', mcaMultiPerm.mcaRestrictedModules.includes('mca.dsc_services'));
                    console.log('Is llp_efiling denied?', mcaMultiPerm.mcaRestrictedModules.includes('mca.llp_efiling'));
                    console.log('\nTest 5: All MCA permissions allowed (Should deny 0)');
                    mcaAllPerms = results.find(function (s) { return s.id === '5'; });
                    console.log('Denied Count:', mcaAllPerms.mcaRestrictedModules.length);
                    console.log('Any denied?', mcaAllPerms.mcaRestrictedModules.length > 0);
                    return [2 /*return*/];
            }
        });
    });
}
runTests().catch(console.error);
