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
exports.SecretLifecycleService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var crypto = require("crypto");
var vaults_events_1 = require("./vaults.events");
var SecretLifecycleService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SecretLifecycleService = _classThis = /** @class */ (function () {
        function SecretLifecycleService_1(prisma, encryption, eventEmitter) {
            this.prisma = prisma;
            this.encryption = encryption;
            this.eventEmitter = eventEmitter;
            this.logger = new common_1.Logger(SecretLifecycleService.name);
        }
        /**
         * Serializes an EncryptionResult into a single Base64 string for storage (IV + AuthTag + Ciphertext)
         */
        SecretLifecycleService_1.prototype.serializeDek = function (result) {
            var iv = result.iv.toString('base64');
            var authTag = result.authTag.toString('base64');
            var ciphertext = result.ciphertext.toString('base64');
            return "".concat(iv, ".").concat(authTag, ".").concat(ciphertext);
        };
        /**
         * Deserializes a Base64 string back into IV, AuthTag, and Ciphertext buffers
         */
        SecretLifecycleService_1.prototype.deserializeDek = function (serialized) {
            var parts = serialized.split('.');
            if (parts.length !== 3) {
                throw new common_1.InternalServerErrorException('Corrupted DEK format in database');
            }
            return {
                iv: Buffer.from(parts[0], 'base64'),
                authTag: Buffer.from(parts[1], 'base64'),
                ciphertext: Buffer.from(parts[2], 'base64'),
            };
        };
        /**
         * Fetches the currently active MEK metadata record.
         */
        SecretLifecycleService_1.prototype.getActiveKeyMetadata = function (tx) {
            return __awaiter(this, void 0, void 0, function () {
                var activeKey;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, tx.keyMetadata.findFirst({
                                where: { status: 'ACTIVE' },
                                orderBy: { version: 'desc' },
                            })];
                        case 1:
                            activeKey = _a.sent();
                            if (!activeKey) {
                                this.logger.error('No active KeyMetadata record found in the database. Cannot encrypt secrets.');
                                throw new common_1.InternalServerErrorException('Cryptographic configuration error');
                            }
                            return [2 /*return*/, activeKey];
                    }
                });
            });
        };
        SecretLifecycleService_1.prototype.createSecret = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var vaultId, name, description, type, plaintext, organizationId, userId, plaintextBuffer, secretId;
                var _this = this;
                return __generator(this, function (_a) {
                    vaultId = input.vaultId, name = input.name, description = input.description, type = input.type, plaintext = input.plaintext, organizationId = input.organizationId, userId = input.userId;
                    plaintextBuffer = Buffer.from(plaintext, 'utf8');
                    secretId = crypto.randomUUID();
                    return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var activeKey, dek, encryptedDekResult, serializedDek, version, context, encryptedPayload, secret;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.getActiveKeyMetadata(tx)];
                                    case 1:
                                        activeKey = _a.sent();
                                        dek = this.encryption.generateDEK();
                                        encryptedDekResult = this.encryption.encryptDEK(dek);
                                        serializedDek = this.serializeDek(encryptedDekResult);
                                        version = 1;
                                        context = { organizationId: organizationId, vaultId: vaultId, secretId: secretId, version: version };
                                        encryptedPayload = this.encryption.encryptPayload(plaintextBuffer, dek, context);
                                        this.logger.log("[AUDIT INTENT] User ".concat(userId, " creating Secret ").concat(secretId, " (v1) in Vault ").concat(vaultId));
                                        return [4 /*yield*/, tx.secret.create({
                                                data: {
                                                    id: secretId,
                                                    vaultId: vaultId,
                                                    name: name,
                                                    description: description,
                                                    type: type || client_1.SecretType.OTHER,
                                                    status: client_1.SecretStatus.ACTIVE,
                                                    encryptedDek: serializedDek,
                                                    keyMetadataId: activeKey.id,
                                                    createdBy: userId,
                                                    updatedBy: userId,
                                                },
                                            })];
                                    case 2:
                                        secret = _a.sent();
                                        return [4 /*yield*/, tx.secretVersion.create({
                                                data: {
                                                    secretId: secret.id,
                                                    version: version,
                                                    ciphertext: encryptedPayload.ciphertext.toString('base64'),
                                                    iv: encryptedPayload.iv.toString('base64'),
                                                    authTag: encryptedPayload.authTag.toString('base64'),
                                                    fingerprint: encryptedPayload.fingerprint,
                                                    keyMetadataId: activeKey.id,
                                                    createdBy: userId,
                                                },
                                            })];
                                    case 3:
                                        _a.sent();
                                        this.logger.log("[AUDIT SUCCESS] User ".concat(userId, " successfully created Secret ").concat(secret.id, " (v1)"));
                                        this.eventEmitter.emit(vaults_events_1.SecretCreatedEvent.EVENT_NAME, new vaults_events_1.SecretCreatedEvent(organizationId, vaultId, secret.id, userId));
                                        return [2 /*return*/, secret];
                                }
                            });
                        }); })];
                });
            });
        };
        SecretLifecycleService_1.prototype.getSecretsByVaultId = function (vaultId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.secret.findMany({
                            where: { vaultId: vaultId, deletedAt: null },
                            orderBy: { createdAt: 'desc' },
                            select: {
                                id: true,
                                vaultId: true,
                                name: true,
                                description: true,
                                type: true,
                                status: true,
                                createdAt: true,
                                updatedAt: true,
                                lastRevealedAt: true,
                                revealCount: true,
                                createdBy: true,
                                updatedBy: true,
                            },
                        })];
                });
            });
        };
        SecretLifecycleService_1.prototype.getSecretMetadataById = function (secretId) {
            return __awaiter(this, void 0, void 0, function () {
                var secret;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.secret.findFirst({
                                where: { id: secretId, deletedAt: null },
                                select: {
                                    id: true,
                                    vaultId: true,
                                    name: true,
                                    description: true,
                                    type: true,
                                    status: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    lastRevealedAt: true,
                                    revealCount: true,
                                    createdBy: true,
                                    updatedBy: true,
                                },
                            })];
                        case 1:
                            secret = _a.sent();
                            if (!secret) {
                                throw new common_1.NotFoundException('Secret not found');
                            }
                            return [2 /*return*/, secret];
                    }
                });
            });
        };
        SecretLifecycleService_1.prototype.updateSecret = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var secretId, plaintext, organizationId, userId, error_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            secretId = input.secretId, plaintext = input.plaintext, organizationId = input.organizationId, userId = input.userId;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var secret, latestVersion, updatedSecret, newVersionNumber, dekParts, dek, context, plaintextBuffer, encryptedPayload;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.secret.findUnique({
                                                    where: { id: secretId },
                                                    include: {
                                                        vault: true,
                                                        versions: { orderBy: { version: 'desc' }, take: 1 },
                                                    },
                                                })];
                                            case 1:
                                                secret = _a.sent();
                                                if (!secret ||
                                                    secret.deletedAt ||
                                                    secret.vault.organizationId !== organizationId) {
                                                    throw new common_1.NotFoundException('Secret not found');
                                                }
                                                latestVersion = secret.versions[0];
                                                updatedSecret = secret;
                                                if (!plaintext) return [3 /*break*/, 3];
                                                newVersionNumber = ((latestVersion === null || latestVersion === void 0 ? void 0 : latestVersion.version) || 0) + 1;
                                                dekParts = this.deserializeDek(secret.encryptedDek);
                                                dek = this.encryption.decryptDEK(dekParts.ciphertext, dekParts.iv, dekParts.authTag);
                                                context = {
                                                    organizationId: organizationId,
                                                    vaultId: secret.vaultId,
                                                    secretId: secretId,
                                                    version: newVersionNumber,
                                                };
                                                plaintextBuffer = Buffer.from(plaintext, 'utf8');
                                                encryptedPayload = this.encryption.encryptPayload(plaintextBuffer, dek, context);
                                                this.logger.log("[AUDIT INTENT] User ".concat(userId, " appending new version v").concat(newVersionNumber, " to Secret ").concat(secretId));
                                                // Persist new version
                                                return [4 /*yield*/, tx.secretVersion.create({
                                                        data: {
                                                            secretId: secret.id,
                                                            version: newVersionNumber,
                                                            ciphertext: encryptedPayload.ciphertext.toString('base64'),
                                                            iv: encryptedPayload.iv.toString('base64'),
                                                            authTag: encryptedPayload.authTag.toString('base64'),
                                                            fingerprint: encryptedPayload.fingerprint,
                                                            keyMetadataId: secret.keyMetadataId, // Keep original DEK's key relation (no rotation yet)
                                                            createdBy: userId,
                                                        },
                                                    })];
                                            case 2:
                                                // Persist new version
                                                _a.sent();
                                                _a.label = 3;
                                            case 3: return [4 /*yield*/, tx.secret.update({
                                                    where: { id: secretId },
                                                    data: __assign(__assign(__assign(__assign({}, (input.name !== undefined && { name: input.name })), (input.description !== undefined && {
                                                        description: input.description,
                                                    })), (input.status !== undefined && { status: input.status })), { updatedAt: new Date(), updatedBy: userId }),
                                                    include: {
                                                        vault: true,
                                                        versions: { orderBy: { version: 'desc' }, take: 1 },
                                                    },
                                                })];
                                            case 4:
                                                // Update metadata
                                                updatedSecret = _a.sent();
                                                this.logger.log("[AUDIT SUCCESS] User ".concat(userId, " successfully updated metadata/version for Secret ").concat(secret.id));
                                                this.eventEmitter.emit(vaults_events_1.SecretUpdatedEvent.EVENT_NAME, new vaults_events_1.SecretUpdatedEvent(organizationId, secret.vaultId, secret.id, userId));
                                                return [2 /*return*/, updatedSecret];
                                        }
                                    });
                                }); })];
                        case 2: return [2 /*return*/, _a.sent()];
                        case 3:
                            error_1 = _a.sent();
                            if (error_1 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                                error_1.code === 'P2002') {
                                throw new common_1.ConflictException('Concurrent update detected. Please try again.');
                            }
                            throw error_1;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        SecretLifecycleService_1.prototype.revealSecret = function (input, versionNumber, tx) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (tx) {
                        return [2 /*return*/, this.executeRevealSecret(input, versionNumber, tx)];
                    }
                    return [2 /*return*/, this.prisma.$transaction(function (innerTx) {
                            return _this.executeRevealSecret(input, versionNumber, innerTx);
                        })];
                });
            });
        };
        SecretLifecycleService_1.prototype.executeRevealSecret = function (input, versionNumber, tx) {
            return __awaiter(this, void 0, void 0, function () {
                var secretId, organizationId, userId, reason, secret, targetVersion, dekParts, dek, context, plaintextBuffer, err_1, msg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            secretId = input.secretId, organizationId = input.organizationId, userId = input.userId, reason = input.reason;
                            this.logger.log("[AUDIT INTENT] User ".concat(userId, " requesting reveal of Secret ").concat(secretId, " ").concat(versionNumber ? "(v".concat(versionNumber, ")") : '(latest)', ". Reason: ").concat(reason || 'None'));
                            return [4 /*yield*/, tx.secret.findUnique({
                                    where: { id: secretId },
                                    include: {
                                        vault: true,
                                        versions: versionNumber
                                            ? { where: { version: versionNumber } }
                                            : { orderBy: { version: 'desc' }, take: 1 },
                                    },
                                })];
                        case 1:
                            secret = _a.sent();
                            if (!secret ||
                                secret.deletedAt ||
                                secret.vault.organizationId !== organizationId ||
                                secret.versions.length === 0) {
                                this.eventEmitter.emit(vaults_events_1.SecretRevealRequestedEvent.EVENT_NAME, new vaults_events_1.SecretRevealRequestedEvent(organizationId, 'unknown', secretId, userId, 'unknown', 'unknown'));
                                this.eventEmitter.emit(vaults_events_1.SecretRevealFailedEvent.EVENT_NAME, new vaults_events_1.SecretRevealFailedEvent(organizationId, 'unknown', secretId, userId, 'Secret unavailable'));
                                throw new common_1.InternalServerErrorException('Unable to reveal secret');
                            }
                            this.eventEmitter.emit(vaults_events_1.SecretRevealRequestedEvent.EVENT_NAME, new vaults_events_1.SecretRevealRequestedEvent(organizationId, secret.vaultId, secretId, userId, 'unknown', 'unknown'));
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            targetVersion = secret.versions[0];
                            if (!targetVersion) {
                                throw new Error('Secret unavailable');
                            }
                            dekParts = this.deserializeDek(secret.encryptedDek);
                            dek = this.encryption.decryptDEK(dekParts.ciphertext, dekParts.iv, dekParts.authTag);
                            context = {
                                organizationId: organizationId,
                                vaultId: secret.vaultId,
                                secretId: secretId,
                                version: targetVersion.version,
                            };
                            plaintextBuffer = this.encryption.decryptPayload(Buffer.from(targetVersion.ciphertext, 'base64'), dek, Buffer.from(targetVersion.iv, 'base64'), Buffer.from(targetVersion.authTag, 'base64'), context);
                            // Update Reveal Metadata
                            return [4 /*yield*/, tx.secret.update({
                                    where: { id: secretId },
                                    data: {
                                        lastRevealedAt: new Date(),
                                        revealCount: { increment: 1 },
                                    },
                                })];
                        case 3:
                            // Update Reveal Metadata
                            _a.sent();
                            this.logger.log("[AUDIT SUCCESS] User ".concat(userId, " successfully revealed Secret ").concat(secretId, " (v").concat(targetVersion.version, ")"));
                            this.eventEmitter.emit(vaults_events_1.SecretRevealSucceededEvent.EVENT_NAME, new vaults_events_1.SecretRevealSucceededEvent(organizationId, secret.vaultId, secret.id, userId));
                            return [2 /*return*/, plaintextBuffer.toString('utf8')];
                        case 4:
                            err_1 = _a.sent();
                            msg = 'Unknown error';
                            if (err_1 instanceof Error)
                                msg = err_1.message;
                            this.logger.warn("[AUDIT FAILURE] User ".concat(userId, " failed to reveal Secret ").concat(secretId, ": ").concat(msg));
                            this.eventEmitter.emit(vaults_events_1.SecretRevealFailedEvent.EVENT_NAME, new vaults_events_1.SecretRevealFailedEvent(organizationId, (secret === null || secret === void 0 ? void 0 : secret.vaultId) || 'unknown', secretId, userId, msg));
                            throw new common_1.InternalServerErrorException('Unable to reveal secret');
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        SecretLifecycleService_1.prototype.softDeleteSecret = function (secretId, userId, organizationId) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var secret, now;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        this.logger.log("[AUDIT INTENT] User ".concat(userId, " soft-deleting Secret ").concat(secretId));
                                        return [4 /*yield*/, tx.secret.findUnique({
                                                where: { id: secretId },
                                                include: { vault: true },
                                            })];
                                    case 1:
                                        secret = _a.sent();
                                        if (!secret ||
                                            secret.deletedAt ||
                                            secret.vault.organizationId !== organizationId) {
                                            throw new common_1.NotFoundException('Secret not found');
                                        }
                                        now = new Date();
                                        return [4 /*yield*/, tx.secret.update({
                                                where: { id: secretId },
                                                data: {
                                                    status: client_1.SecretStatus.DELETED,
                                                    deletedAt: now,
                                                    deletedBy: userId,
                                                },
                                            })];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, tx.secretVersion.updateMany({
                                                where: { secretId: secretId },
                                                data: { deletedAt: now },
                                            })];
                                    case 3:
                                        _a.sent();
                                        this.logger.log("[AUDIT SUCCESS] User ".concat(userId, " soft-deleted Secret ").concat(secretId));
                                        this.eventEmitter.emit(vaults_events_1.SecretDeletedEvent.EVENT_NAME, new vaults_events_1.SecretDeletedEvent(secret.vault.organizationId, secret.vaultId, secret.id, userId));
                                        return [2 /*return*/, secret];
                                }
                            });
                        }); })];
                });
            });
        };
        return SecretLifecycleService_1;
    }());
    __setFunctionName(_classThis, "SecretLifecycleService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SecretLifecycleService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SecretLifecycleService = _classThis;
}();
exports.SecretLifecycleService = SecretLifecycleService;
