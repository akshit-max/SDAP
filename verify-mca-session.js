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
function verifyLatestMcaSession() {
    return __awaiter(this, void 0, void 0, function () {
        var sessions, _i, sessions_1, s;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, prisma.delegatedSession.findMany({
                        where: {
                            OR: [
                                { integrationProvider: 'MCA' },
                                { capabilities: { array_contains: ['mca.company_efiling'] } },
                                { capabilities: { array_contains: ['mca.master_data'] } },
                            ]
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        include: { grantee: { select: { email: true } }, grantor: { select: { email: true } } }
                    })];
                case 1:
                    sessions = _c.sent();
                    if (sessions.length === 0) {
                        console.log('❌ No MCA-related sessions found in the database.');
                        return [2 /*return*/];
                    }
                    console.log("Found ".concat(sessions.length, " MCA-related session(s):\n"));
                    for (_i = 0, sessions_1 = sessions; _i < sessions_1.length; _i++) {
                        s = sessions_1[_i];
                        console.log('─'.repeat(60));
                        console.log("ID:                  ".concat(s.id));
                        console.log("Grantee:             ".concat((_a = s.grantee) === null || _a === void 0 ? void 0 : _a.email));
                        console.log("Grantor:             ".concat((_b = s.grantor) === null || _b === void 0 ? void 0 : _b.email));
                        console.log("Status:              ".concat(s.status));
                        console.log("Scope:               ".concat(s.scope));
                        console.log("integrationProvider: ".concat(s.integrationProvider));
                        console.log("capabilities:        ".concat(JSON.stringify(s.capabilities)));
                        console.log("expiresAt:           ".concat(s.expiresAt));
                        console.log("createdAt:           ".concat(s.createdAt));
                        if (s.integrationProvider === 'MCA') {
                            console.log("\u2705 integrationProvider is 'MCA' \u2014 backend will generate mcaRestrictedModules");
                        }
                        else {
                            console.log("\u274C integrationProvider is '".concat(s.integrationProvider, "' \u2014 backend will NOT generate mcaRestrictedModules"));
                        }
                        console.log('');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
verifyLatestMcaSession().catch(console.error).finally(function () { return prisma.$disconnect(); });
