"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretRevealFailedEvent = exports.SecretRevealSucceededEvent = exports.SecretRevealRequestedEvent = exports.SecretDeletedEvent = exports.SecretUpdatedEvent = exports.SecretCreatedEvent = exports.VaultDeletedEvent = exports.VaultUpdatedEvent = exports.VaultCreatedEvent = void 0;
// Vault Events
var VaultCreatedEvent = /** @class */ (function () {
    function VaultCreatedEvent(organizationId, vaultId, actorId) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.actorId = actorId;
    }
    VaultCreatedEvent.EVENT_NAME = 'vault.created';
    return VaultCreatedEvent;
}());
exports.VaultCreatedEvent = VaultCreatedEvent;
var VaultUpdatedEvent = /** @class */ (function () {
    function VaultUpdatedEvent(organizationId, vaultId, actorId) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.actorId = actorId;
    }
    VaultUpdatedEvent.EVENT_NAME = 'vault.updated';
    return VaultUpdatedEvent;
}());
exports.VaultUpdatedEvent = VaultUpdatedEvent;
var VaultDeletedEvent = /** @class */ (function () {
    function VaultDeletedEvent(organizationId, vaultId, actorId) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.actorId = actorId;
    }
    VaultDeletedEvent.EVENT_NAME = 'vault.deleted';
    return VaultDeletedEvent;
}());
exports.VaultDeletedEvent = VaultDeletedEvent;
// Secret Events
var SecretCreatedEvent = /** @class */ (function () {
    function SecretCreatedEvent(organizationId, vaultId, secretId, actorId) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.secretId = secretId;
        this.actorId = actorId;
    }
    SecretCreatedEvent.EVENT_NAME = 'secret.created';
    return SecretCreatedEvent;
}());
exports.SecretCreatedEvent = SecretCreatedEvent;
var SecretUpdatedEvent = /** @class */ (function () {
    function SecretUpdatedEvent(organizationId, vaultId, secretId, actorId) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.secretId = secretId;
        this.actorId = actorId;
    }
    SecretUpdatedEvent.EVENT_NAME = 'secret.updated';
    return SecretUpdatedEvent;
}());
exports.SecretUpdatedEvent = SecretUpdatedEvent;
var SecretDeletedEvent = /** @class */ (function () {
    function SecretDeletedEvent(organizationId, vaultId, secretId, actorId) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.secretId = secretId;
        this.actorId = actorId;
    }
    SecretDeletedEvent.EVENT_NAME = 'secret.deleted';
    return SecretDeletedEvent;
}());
exports.SecretDeletedEvent = SecretDeletedEvent;
var SecretRevealRequestedEvent = /** @class */ (function () {
    function SecretRevealRequestedEvent(organizationId, vaultId, secretId, actorId, userAgent, ipAddress) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.secretId = secretId;
        this.actorId = actorId;
        this.userAgent = userAgent;
        this.ipAddress = ipAddress;
    }
    SecretRevealRequestedEvent.EVENT_NAME = 'secret.reveal.requested';
    return SecretRevealRequestedEvent;
}());
exports.SecretRevealRequestedEvent = SecretRevealRequestedEvent;
var SecretRevealSucceededEvent = /** @class */ (function () {
    function SecretRevealSucceededEvent(organizationId, vaultId, secretId, actorId) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.secretId = secretId;
        this.actorId = actorId;
    }
    SecretRevealSucceededEvent.EVENT_NAME = 'secret.reveal.succeeded';
    return SecretRevealSucceededEvent;
}());
exports.SecretRevealSucceededEvent = SecretRevealSucceededEvent;
var SecretRevealFailedEvent = /** @class */ (function () {
    function SecretRevealFailedEvent(organizationId, vaultId, secretId, actorId, reason) {
        this.organizationId = organizationId;
        this.vaultId = vaultId;
        this.secretId = secretId;
        this.actorId = actorId;
        this.reason = reason;
    }
    SecretRevealFailedEvent.EVENT_NAME = 'secret.reveal.failed';
    return SecretRevealFailedEvent;
}());
exports.SecretRevealFailedEvent = SecretRevealFailedEvent;
