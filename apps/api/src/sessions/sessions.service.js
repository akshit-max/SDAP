"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = exports.INTEGRATIONS_SERVICE_TOKEN = void 0;
var common_1 = require("@nestjs/common");
var session_created_event_1 = require("./events/session-created.event");
var session_revoked_event_1 = require("./events/session-revoked.event");
exports.INTEGRATIONS_SERVICE_TOKEN = 'INTEGRATIONS_SERVICE';
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
var SessionsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SessionsService = _classThis = /** @class */ (function () {
        function SessionsService_1(prisma, eventEmitter, validationService, secretLifecycleService, integrationsService) {
            this.prisma = prisma;
            this.eventEmitter = eventEmitter;
            this.validationService = validationService;
            this.secretLifecycleService = secretLifecycleService;
            this.integrationsService = integrationsService;
            this.logger = new common_1.Logger(SessionsService.name);
        }
        SessionsService_1.prototype.createSession = function (organizationId, grantorId, dto, tx) {
            return __awaiter(this, void 0, void 0, function () {
                var db, secret, vault, integrationProvider, integrationResourceType, integrationResourceExternalId, isIntegrationBound, sessionDb, session, grantee, principalId, result, activeSession, err_1;
                var _this = this;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            db = tx !== null && tx !== void 0 ? tx : this.prisma;
                            if (dto.expiresAt <= new Date()) {
                                throw new common_1.BadRequestException('Expiration date must be in the future.');
                            }
                            if (dto.maxReveals !== undefined && dto.maxReveals <= 0) {
                                throw new common_1.BadRequestException('maxReveals must be strictly positive.');
                            }
                            if (!(dto.scope === 'SECRET' && dto.resourceId)) return [3 /*break*/, 2];
                            return [4 /*yield*/, db.secret.findUnique({
                                    where: { id: dto.resourceId },
                                    include: { vault: true },
                                })];
                        case 1:
                            secret = _b.sent();
                            if (!secret || secret.vault.organizationId !== organizationId) {
                                throw new common_1.NotFoundException('Secret not found in your organization.');
                            }
                            return [3 /*break*/, 5];
                        case 2:
                            if (!(dto.scope === 'VAULT' && dto.resourceId)) return [3 /*break*/, 4];
                            return [4 /*yield*/, db.vault.findUnique({
                                    where: { id: dto.resourceId },
                                })];
                        case 3:
                            vault = _b.sent();
                            if (!vault || vault.organizationId !== organizationId) {
                                throw new common_1.NotFoundException('Vault not found in your organization.');
                            }
                            return [3 /*break*/, 5];
                        case 4:
                            if (dto.scope === 'INTEGRATION') {
                                // Integration access bypasses vault verification
                            }
                            _b.label = 5;
                        case 5:
                            integrationProvider = dto.integrationProvider;
                            integrationResourceType = dto.integrationResourceType;
                            integrationResourceExternalId = dto.integrationResourceExternalId;
                            isIntegrationBound = !!(integrationProvider &&
                                integrationResourceExternalId &&
                                this.integrationsService);
                            sessionDb = isIntegrationBound ? this.prisma : db;
                            return [4 /*yield*/, sessionDb.delegatedSession.create({
                                    data: {
                                        organizationId: organizationId,
                                        grantorId: grantorId,
                                        granteeId: dto.granteeId,
                                        scope: (dto.scope || 'SECRET'),
                                        resourceId: dto.resourceId || 'integration',
                                        permission: dto.permission,
                                        expiresAt: new Date(dto.expiresAt),
                                        maxReveals: dto.maxReveals,
                                        capabilities: (_a = dto.capabilities) !== null && _a !== void 0 ? _a : null,
                                        // PENDING_GRANT for integration-backed, ACTIVE for plain vault/secret sessions
                                        status: isIntegrationBound ? 'PENDING_GRANT' : 'ACTIVE',
                                        integrationProvider: isIntegrationBound ? integrationProvider : null,
                                        integrationResourceType: isIntegrationBound ? integrationResourceType : null,
                                        integrationResourceExternalId: isIntegrationBound ? integrationResourceExternalId : null,
                                        integrationReferenceId: null,
                                    },
                                })];
                        case 6:
                            session = _b.sent();
                            if (!isIntegrationBound) return [3 /*break*/, 15];
                            _b.label = 7;
                        case 7:
                            _b.trys.push([7, 13, , 15]);
                            return [4 /*yield*/, this.prisma.user.findUnique({
                                    where: { id: dto.granteeId },
                                    select: { id: true, email: true, providerProfiles: true },
                                })];
                        case 8:
                            grantee = _b.sent();
                            if (!(grantee === null || grantee === void 0 ? void 0 : grantee.email)) {
                                throw new Error('Grantee user not found or has no email address.');
                            }
                            principalId = grantee.email;
                            if (typeof this.integrationsService.resolvePrincipalId === 'function') {
                                principalId = this.integrationsService.resolvePrincipalId(integrationProvider, grantee);
                            }
                            result = void 0;
                            if (!(integrationProvider === 'GODADDY')) return [3 /*break*/, 9];
                            // GoDaddy uses extension-based delegation, so there is no programmatic grant.
                            result = { referenceId: "ext_".concat(Date.now()), status: 'ACTIVE' };
                            return [3 /*break*/, 11];
                        case 9: return [4 /*yield*/, this.integrationsService.grantAccess(organizationId, integrationProvider, {
                                resourceId: integrationResourceExternalId,
                                resourceType: integrationResourceType,
                                principalEmail: principalId, // Passing the resolved principalId
                                role: dto.integrationRole,
                            })];
                        case 10:
                            result = _b.sent();
                            _b.label = 11;
                        case 11: return [4 /*yield*/, this.prisma.delegatedSession.update({
                                where: { id: session.id },
                                data: {
                                    status: 'ACTIVE',
                                    integrationReferenceId: result.referenceId,
                                },
                            })];
                        case 12:
                            activeSession = _b.sent();
                            this.eventEmitter.emit('audit.log', {
                                organizationId: organizationId,
                                actorId: grantorId,
                                action: 'integration.access_granted',
                                resourceType: 'SESSION',
                                resourceId: session.id,
                                metadata: {
                                    provider: integrationProvider,
                                    resourceType: integrationResourceType,
                                    externalId: integrationResourceExternalId,
                                    username: grantee.email,
                                    referenceId: result.referenceId,
                                    status: result.status,
                                },
                            });
                            this.logger.log("[SESSION] ".concat(integrationProvider, " access granted: ").concat(grantee.email, " \u2192 ").concat(integrationResourceExternalId, " (ref: ").concat(result.referenceId, ")"));
                            this.eventEmitter.emit('session.created', new session_created_event_1.DelegatedSessionCreatedEvent(session.id, organizationId, grantorId, dto.granteeId, dto.scope || 'SECRET', dto.resourceId || 'integration'));
                            return [2 /*return*/, activeSession];
                        case 13:
                            err_1 = _b.sent();
                            // Provider call failed — delete the PENDING_GRANT row so no orphan exists
                            return [4 /*yield*/, this.prisma.delegatedSession
                                    .delete({ where: { id: session.id } })
                                    .catch(function (deleteErr) {
                                    return _this.logger.error("[SESSION] Failed to clean up PENDING_GRANT row ".concat(session.id, ": ").concat(deleteErr.message));
                                })];
                        case 14:
                            // Provider call failed — delete the PENDING_GRANT row so no orphan exists
                            _b.sent();
                            this.eventEmitter.emit('audit.log', {
                                organizationId: organizationId,
                                actorId: grantorId,
                                action: 'integration.access_failed',
                                resourceType: 'SESSION',
                                metadata: {
                                    provider: integrationProvider,
                                    externalId: integrationResourceExternalId,
                                    reason: err_1.message,
                                },
                            });
                            this.logger.error("[SESSION] ".concat(integrationProvider, " grantAccess failed for ").concat(integrationResourceExternalId, ": ").concat(err_1.message));
                            // Throw so the approval tx (if any) also rolls back
                            throw new common_1.BadGatewayException("".concat(integrationProvider, " access could not be granted: ").concat(err_1.message, ". Session not created."));
                        case 15:
                            // ── Non-integration session: already ACTIVE ─────────────────────────────
                            this.eventEmitter.emit('session.created', new session_created_event_1.DelegatedSessionCreatedEvent(session.id, organizationId, grantorId, dto.granteeId, dto.scope || 'SECRET', dto.resourceId || 'integration'));
                            return [2 /*return*/, session];
                    }
                });
            });
        };
        SessionsService_1.prototype.getIncomingSessions = function (organizationId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var where, sessions, enriched;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            where = { granteeId: userId };
                            if (organizationId) {
                                where.organizationId = organizationId;
                            }
                            return [4 /*yield*/, this.prisma.delegatedSession.findMany({
                                    where: where,
                                    orderBy: { createdAt: 'desc' },
                                    include: {
                                        grantor: { select: { email: true, fullName: true } },
                                    },
                                })];
                        case 1:
                            sessions = _a.sent();
                            return [4 /*yield*/, this.enrichSessionsWithResourceNames(sessions)];
                        case 2:
                            enriched = _a.sent();
                            return [2 /*return*/, enriched.map(function (session) {
                                    if (session.integrationProvider === 'MCA') {
                                        var allowed_1 = session.capabilities || [];
                                        var mcaRestrictedModules = MCA_TOP_LEVEL_MODULES.filter(function (mod) { return !allowed_1.includes(mod); });
                                        return __assign(__assign({}, session), { mcaRestrictedModules: mcaRestrictedModules });
                                    }
                                    return session;
                                })];
                    }
                });
            });
        };
        SessionsService_1.prototype.getOutgoingSessions = function (organizationId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var sessions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.delegatedSession.findMany({
                                where: { organizationId: organizationId, grantorId: userId },
                                orderBy: { createdAt: 'desc' },
                                include: {
                                    grantee: { select: { email: true, fullName: true } },
                                },
                            })];
                        case 1:
                            sessions = _a.sent();
                            return [2 /*return*/, this.enrichSessionsWithResourceNames(sessions)];
                    }
                });
            });
        };
        /**
         * Batch-enriches a list of sessions with their resource names.
         * Executes exactly 2 queries total regardless of list size.
         */
        SessionsService_1.prototype.enrichSessionsWithResourceNames = function (sessions) {
            return __awaiter(this, void 0, void 0, function () {
                var secretIds, vaultIds, _a, secrets, vaults, secretMap, vaultMap;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            secretIds = sessions.filter(function (s) { return s.scope === 'SECRET'; }).map(function (s) { return s.resourceId; });
                            vaultIds = sessions.filter(function (s) { return s.scope === 'VAULT'; }).map(function (s) { return s.resourceId; });
                            return [4 /*yield*/, Promise.all([
                                    secretIds.length > 0
                                        ? this.prisma.secret.findMany({ where: { id: { in: secretIds } }, select: { id: true, name: true } })
                                        : [],
                                    vaultIds.length > 0
                                        ? this.prisma.vault.findMany({ where: { id: { in: vaultIds } }, select: { id: true, name: true } })
                                        : [],
                                ])];
                        case 1:
                            _a = _b.sent(), secrets = _a[0], vaults = _a[1];
                            secretMap = new Map(secrets.map(function (s) { return [s.id, s.name]; }));
                            vaultMap = new Map(vaults.map(function (v) { return [v.id, v.name]; }));
                            return [2 /*return*/, sessions.map(function (s) {
                                    var _a, _b;
                                    return (__assign(__assign({}, s), { resourceName: s.scope === 'SECRET'
                                            ? ((_a = secretMap.get(s.resourceId)) !== null && _a !== void 0 ? _a : null)
                                            : s.scope === 'VAULT'
                                                ? ((_b = vaultMap.get(s.resourceId)) !== null && _b !== void 0 ? _b : null)
                                                : null }));
                                })];
                    }
                });
            });
        };
        SessionsService_1.prototype.revokeSession = function (organizationId, sessionId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var session, membership, isAuthorizedAdmin, principalId, err_2, updated;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.prisma.delegatedSession.findUnique({
                                where: { id: sessionId },
                                include: { grantee: { select: { id: true, email: true, providerProfiles: true } } },
                            })];
                        case 1:
                            session = _c.sent();
                            if (!session || session.organizationId !== organizationId) {
                                throw new common_1.NotFoundException('Session not found.');
                            }
                            return [4 /*yield*/, this.prisma.organizationMember.findUnique({
                                    where: { organizationId_userId: { organizationId: organizationId, userId: userId } }
                                })];
                        case 2:
                            membership = _c.sent();
                            isAuthorizedAdmin = membership && (membership.role === 'ADMIN' || membership.role === 'OWNER');
                            if (session.grantorId !== userId && !isAuthorizedAdmin) {
                                if (session.granteeId === userId) {
                                    throw new common_1.ForbiddenException('You cannot revoke a session granted to you.');
                                }
                                throw new common_1.ForbiddenException('You do not have permission to revoke this session.');
                            }
                            if (session.status !== 'ACTIVE' && session.status !== 'REVOKE_FAILED') {
                                throw new common_1.BadRequestException("Cannot revoke a session that is ".concat(session.status.toLowerCase(), "."));
                            }
                            if (!(session.integrationProvider &&
                                session.integrationResourceExternalId &&
                                ((_a = session.grantee) === null || _a === void 0 ? void 0 : _a.email) &&
                                this.integrationsService)) return [3 /*break*/, 8];
                            principalId = session.grantee.email;
                            if (typeof this.integrationsService.resolvePrincipalId === 'function') {
                                principalId = this.integrationsService.resolvePrincipalId(session.integrationProvider, session.grantee);
                            }
                            _c.label = 3;
                        case 3:
                            _c.trys.push([3, 6, , 8]);
                            if (!(session.integrationProvider !== 'GODADDY')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.integrationsService.revokeAccess(organizationId, session.integrationProvider, {
                                    resourceId: session.integrationResourceExternalId,
                                    resourceType: session.integrationResourceType,
                                    principalEmail: principalId,
                                    referenceId: (_b = session.integrationReferenceId) !== null && _b !== void 0 ? _b : undefined,
                                })];
                        case 4:
                            _c.sent();
                            _c.label = 5;
                        case 5:
                            this.eventEmitter.emit('audit.log', {
                                organizationId: organizationId,
                                actorId: userId,
                                action: 'integration.access_revoked',
                                resourceType: 'SESSION',
                                resourceId: sessionId,
                                metadata: {
                                    provider: session.integrationProvider,
                                    resourceType: session.integrationResourceType,
                                    externalId: session.integrationResourceExternalId,
                                    username: principalId,
                                    reason: 'Manual revocation by grantor/admin',
                                },
                            });
                            this.logger.log("[SESSION] ".concat(session.integrationProvider, " access revoked for session ").concat(sessionId));
                            return [3 /*break*/, 8];
                        case 6:
                            err_2 = _c.sent();
                            // Provider call failed — record REVOKE_FAILED so scheduler retries
                            this.logger.error("[REVOKE] ".concat(session.integrationProvider, " revokeAccess failed for session ").concat(sessionId, ": ").concat(err_2.message));
                            return [4 /*yield*/, this.prisma.delegatedSession.update({
                                    where: { id: sessionId },
                                    data: { status: 'REVOKE_FAILED' },
                                })];
                        case 7:
                            _c.sent();
                            this.eventEmitter.emit('audit.log', {
                                organizationId: organizationId,
                                actorId: userId,
                                action: 'integration.access_failed',
                                resourceType: 'SESSION',
                                resourceId: sessionId,
                                metadata: {
                                    provider: session.integrationProvider,
                                    reason: "Manual revoke failed: ".concat(err_2.message, ". Will retry automatically."),
                                },
                            });
                            // Return the pending state so the caller knows revocation was recorded
                            return [2 /*return*/, __assign(__assign({}, session), { status: 'REVOKE_FAILED' })];
                        case 8: return [4 /*yield*/, this.prisma.delegatedSession.update({
                                where: { id: sessionId },
                                data: {
                                    status: 'REVOKED',
                                    revokedAt: new Date(),
                                    revokedBy: userId,
                                },
                            })];
                        case 9:
                            updated = _c.sent();
                            this.eventEmitter.emit('session.revoked', new session_revoked_event_1.DelegatedSessionRevokedEvent(session.id, organizationId, userId));
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        SessionsService_1.prototype.revealSecretViaSession = function (organizationId, sessionId, granteeId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.delegatedSession.findUnique({
                                where: { id: sessionId },
                            })];
                        case 1:
                            session = _a.sent();
                            if (!session || session.organizationId !== organizationId) {
                                throw new common_1.NotFoundException('Session not found.');
                            }
                            this.validationService.validateSessionForUse(session, granteeId);
                            if (session.scope !== 'SECRET') {
                                throw new common_1.BadRequestException('Session must be scoped to a SECRET to reveal it directly. Vault scoped sessions require secret ID.');
                            }
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var lockedSession, updateResult, plaintext;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.delegatedSession.findUniqueOrThrow({
                                                    where: { id: sessionId },
                                                })];
                                            case 1:
                                                lockedSession = _a.sent();
                                                this.validationService.validateSessionForUse(lockedSession, granteeId);
                                                return [4 /*yield*/, tx.delegatedSession.updateMany({
                                                        where: {
                                                            id: sessionId,
                                                            revealCount: lockedSession.revealCount,
                                                        },
                                                        data: {
                                                            revealCount: { increment: 1 },
                                                        },
                                                    })];
                                            case 2:
                                                updateResult = _a.sent();
                                                if (updateResult.count === 0) {
                                                    throw new common_1.BadRequestException('Concurrent reveal detected or session modified. Please try again.');
                                                }
                                                return [4 /*yield*/, this.secretLifecycleService.revealSecret({
                                                        organizationId: organizationId,
                                                        secretId: lockedSession.resourceId,
                                                        userId: granteeId,
                                                        reason: "Session Reveal: ".concat(reason),
                                                    }, undefined, tx)];
                                            case 3:
                                                plaintext = _a.sent();
                                                if (!(lockedSession.maxReveals !== null &&
                                                    lockedSession.revealCount + 1 >= lockedSession.maxReveals)) return [3 /*break*/, 5];
                                                return [4 /*yield*/, tx.delegatedSession.update({
                                                        where: { id: sessionId },
                                                        data: { status: 'EXPIRED' },
                                                    })];
                                            case 4:
                                                _a.sent();
                                                _a.label = 5;
                                            case 5: return [2 /*return*/, plaintext];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        /**
         * Returns all delegated sessions where the given userId is the grantee.
         * Used by admins to see what access has been granted to a specific member.
         */
        SessionsService_1.prototype.getSessionsByGrantee = function (organizationId, granteeId) {
            return __awaiter(this, void 0, void 0, function () {
                var sessions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.delegatedSession.findMany({
                                where: { organizationId: organizationId, granteeId: granteeId },
                                orderBy: { createdAt: 'desc' },
                                include: {
                                    grantor: { select: { email: true, fullName: true } },
                                },
                            })];
                        case 1:
                            sessions = _a.sent();
                            return [2 /*return*/, this.enrichSessionsWithResourceNames(sessions)];
                    }
                });
            });
        };
        /**
         * Revokes all ACTIVE delegated sessions for a specific grantee in the org.
         * Vault/Secret sessions are revoked directly; integration sessions use the
         * existing per-session revoke path so provider cleanup is triggered correctly.
         * Returns a summary: { revokedCount, skippedCount }.
         */
        SessionsService_1.prototype.revokeAllForGrantee = function (organizationId, granteeId, adminId) {
            return __awaiter(this, void 0, void 0, function () {
                var sessions, revokedCount, skippedCount, _i, sessions_1, session, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.delegatedSession.findMany({
                                where: {
                                    organizationId: organizationId,
                                    granteeId: granteeId,
                                    status: { in: ['ACTIVE', 'REVOKE_FAILED'] },
                                },
                                include: { grantee: { select: { id: true, email: true, providerProfiles: true } } },
                            })];
                        case 1:
                            sessions = _b.sent();
                            if (sessions.length === 0) {
                                return [2 /*return*/, { revokedCount: 0, skippedCount: 0 }];
                            }
                            revokedCount = 0;
                            skippedCount = 0;
                            _i = 0, sessions_1 = sessions;
                            _b.label = 2;
                        case 2:
                            if (!(_i < sessions_1.length)) return [3 /*break*/, 7];
                            session = sessions_1[_i];
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.revokeSession(organizationId, session.id, adminId)];
                        case 4:
                            _b.sent();
                            revokedCount++;
                            return [3 /*break*/, 6];
                        case 5:
                            _a = _b.sent();
                            // Individual revoke failures are non-fatal for the bulk operation
                            skippedCount++;
                            return [3 /*break*/, 6];
                        case 6:
                            _i++;
                            return [3 /*break*/, 2];
                        case 7:
                            this.eventEmitter.emit('audit.log', {
                                organizationId: organizationId,
                                actorId: adminId,
                                action: 'session.revoke_all',
                                resourceType: 'USER',
                                resourceId: granteeId,
                                metadata: { revokedCount: revokedCount, skippedCount: skippedCount },
                            });
                            return [2 /*return*/, { revokedCount: revokedCount, skippedCount: skippedCount }];
                    }
                });
            });
        };
        return SessionsService_1;
    }());
    __setFunctionName(_classThis, "SessionsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SessionsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SessionsService = _classThis;
}();
exports.SessionsService = SessionsService;
