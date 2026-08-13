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
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function setup() {
    return __awaiter(this, void 0, void 0, function () {
        var user, org;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.user.findFirst()];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        console.log('No users found in database! Please create an account in the web app first.');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, prisma.organization.findFirst()];
                case 2:
                    org = _a.sent();
                    if (!org) {
                        console.log('No organizations found in database!');
                        return [2 /*return*/];
                    }
                    console.log("Using User: ".concat(user.email, " and Org: ").concat(org.name));
                    // Clear old test sessions
                    return [4 /*yield*/, prisma.delegatedSession.deleteMany({
                            where: { integrationProvider: 'MCA' }
                        })];
                case 3:
                    // Clear old test sessions
                    _a.sent();
                    // Create Test 1: No permissions
                    return [4 /*yield*/, prisma.delegatedSession.create({
                            data: {
                                organizationId: org.id,
                                grantorId: user.id,
                                granteeId: user.id,
                                scope: 'INTEGRATION',
                                resourceId: 'integration',
                                permission: 'REVEAL',
                                status: 'ACTIVE',
                                integrationProvider: 'MCA',
                                integrationResourceType: 'PORTAL',
                                integrationResourceExternalId: 'mca_portal_1',
                                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
                                capabilities: []
                            }
                        })];
                case 4:
                    // Create Test 1: No permissions
                    _a.sent();
                    console.log('✅ Created Test Session 1: MCA with NO capabilities (Everything should be hidden)');
                    // Create Test 2: Only Company e-Filing
                    return [4 /*yield*/, prisma.delegatedSession.create({
                            data: {
                                organizationId: org.id,
                                grantorId: user.id,
                                granteeId: user.id,
                                scope: 'INTEGRATION',
                                resourceId: 'integration',
                                permission: 'REVEAL',
                                status: 'ACTIVE',
                                integrationProvider: 'MCA',
                                integrationResourceType: 'PORTAL',
                                integrationResourceExternalId: 'mca_portal_2',
                                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
                                capabilities: ['mca.company_efiling']
                            }
                        })];
                case 5:
                    // Create Test 2: Only Company e-Filing
                    _a.sent();
                    console.log('✅ Created Test Session 2: MCA with ONLY Company e-Filing (Only this should be visible)');
                    // Create Test 3: Company e-Filing + DSC
                    return [4 /*yield*/, prisma.delegatedSession.create({
                            data: {
                                organizationId: org.id,
                                grantorId: user.id,
                                granteeId: user.id,
                                scope: 'INTEGRATION',
                                resourceId: 'integration',
                                permission: 'REVEAL',
                                status: 'ACTIVE',
                                integrationProvider: 'MCA',
                                integrationResourceType: 'PORTAL',
                                integrationResourceExternalId: 'mca_portal_3',
                                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
                                capabilities: ['mca.company_efiling', 'mca.dsc_services']
                            }
                        })];
                case 6:
                    // Create Test 3: Company e-Filing + DSC
                    _a.sent();
                    console.log('✅ Created Test Session 3: MCA with Company e-Filing + DSC (Both should be visible)');
                    console.log('\nDone! You now have 3 active MCA sessions in your database.');
                    return [2 /*return*/];
            }
        });
    });
}
setup().catch(console.error).finally(function () { return prisma.$disconnect(); });
