"use strict";
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
var common_1 = require("@nestjs/common");
var crypto = require("crypto");
var EncryptionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var EncryptionService = _classThis = /** @class */ (function () {
        function EncryptionService_1() {
            this.ALGORITHM = 'aes-256-gcm';
            var mekBase64 = process.env.VAULT_ENCRYPTION_KEY;
            if (!mekBase64) {
                throw new Error('VAULT_ENCRYPTION_KEY environment variable is missing.');
            }
            this.MEK = Buffer.from(mekBase64, 'base64');
            if (this.MEK.length !== 32) {
                throw new Error('VAULT_ENCRYPTION_KEY must be a valid 256-bit (32 byte) key encoded in Base64.');
            }
        }
        /**
         * Generates a random 256-bit Data Encryption Key (DEK).
         */
        EncryptionService_1.prototype.generateDEK = function () {
            return crypto.randomBytes(32);
        };
        /**
         * Encrypts the DEK using the MEK.
         */
        EncryptionService_1.prototype.encryptDEK = function (dek) {
            if (dek.length !== 32) {
                throw new common_1.InternalServerErrorException('Invalid DEK length');
            }
            var iv = crypto.randomBytes(12);
            var cipher = crypto.createCipheriv(this.ALGORITHM, this.MEK, iv);
            var ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
            var authTag = cipher.getAuthTag();
            return {
                ciphertext: ciphertext,
                iv: iv,
                authTag: authTag,
                fingerprint: this.computeFingerprint(dek),
            };
        };
        /**
         * Decrypts the DEK using the MEK.
         */
        EncryptionService_1.prototype.decryptDEK = function (encryptedDek, iv, authTag) {
            try {
                var decipher = crypto.createDecipheriv(this.ALGORITHM, this.MEK, iv);
                decipher.setAuthTag(authTag);
                return Buffer.concat([decipher.update(encryptedDek), decipher.final()]);
            }
            catch (_a) {
                // Swallowing cryptographic errors to maintain constant-time response profiles externally
                // In a real app, this should log to an internal secure logger
                throw new Error('Decryption failed');
            }
        };
        /**
         * Encrypts the actual secret payload using the provided DEK and contextual AAD.
         */
        EncryptionService_1.prototype.encryptPayload = function (plaintext, dek, context) {
            if (dek.length !== 32) {
                throw new common_1.InternalServerErrorException('Invalid DEK length');
            }
            var iv = crypto.randomBytes(12);
            var aad = this.computeAAD(context);
            var cipher = crypto.createCipheriv(this.ALGORITHM, dek, iv);
            cipher.setAAD(aad);
            var ciphertext = Buffer.concat([
                cipher.update(plaintext),
                cipher.final(),
            ]);
            var authTag = cipher.getAuthTag();
            return {
                ciphertext: ciphertext,
                iv: iv,
                authTag: authTag,
                fingerprint: this.computeFingerprint(plaintext),
            };
        };
        /**
         * Decrypts the secret payload using the provided DEK and contextual AAD.
         */
        EncryptionService_1.prototype.decryptPayload = function (ciphertext, dek, iv, authTag, context) {
            if (dek.length !== 32) {
                throw new common_1.InternalServerErrorException('Invalid DEK length');
            }
            try {
                var aad = this.computeAAD(context);
                var decipher = crypto.createDecipheriv(this.ALGORITHM, dek, iv);
                decipher.setAuthTag(authTag);
                decipher.setAAD(aad);
                return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            }
            catch (_a) {
                throw new Error('Decryption failed');
            }
        };
        /**
         * Generates a deterministic, serialized string for the AAD context and hashes it for logging/storage,
         * but the actual AAD passed to AES-GCM is a Buffer.
         */
        EncryptionService_1.prototype.computeAAD = function (context) {
            var serialized = "".concat(context.organizationId, ":").concat(context.vaultId, ":").concat(context.secretId, ":").concat(context.version);
            return Buffer.from(serialized, 'utf8');
        };
        /**
         * Computes the SHA-256 fingerprint for integrity and duplicate detection.
         */
        EncryptionService_1.prototype.computeFingerprint = function (data) {
            return crypto.createHash('sha256').update(data).digest('hex');
        };
        /**
         * Decrypts a DEK with an old MEK and re-encrypts it with a new MEK.
         * Used during offline key rotation.
         */
        EncryptionService_1.prototype.rewrapDEK = function (encryptedDek, iv, authTag, oldMek, newMek) {
            var dek;
            try {
                var decipher = crypto.createDecipheriv(this.ALGORITHM, oldMek, iv);
                decipher.setAuthTag(authTag);
                dek = Buffer.concat([decipher.update(encryptedDek), decipher.final()]);
            }
            catch (_a) {
                throw new Error('Failed to decrypt DEK with old MEK');
            }
            if (dek.length !== 32) {
                throw new common_1.InternalServerErrorException('Invalid DEK length after decryption');
            }
            var newIv = crypto.randomBytes(12);
            var cipher = crypto.createCipheriv(this.ALGORITHM, newMek, newIv);
            var ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
            var newAuthTag = cipher.getAuthTag();
            return {
                ciphertext: ciphertext,
                iv: newIv,
                authTag: newAuthTag,
                fingerprint: this.computeFingerprint(dek),
            };
        };
        return EncryptionService_1;
    }());
    __setFunctionName(_classThis, "EncryptionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EncryptionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EncryptionService = _classThis;
}();
exports.EncryptionService = EncryptionService;
