"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegatedSessionRevokedEvent = void 0;
var DelegatedSessionRevokedEvent = /** @class */ (function () {
    function DelegatedSessionRevokedEvent(sessionId, organizationId, revokedByUserId, timestamp) {
        if (timestamp === void 0) { timestamp = new Date(); }
        this.sessionId = sessionId;
        this.organizationId = organizationId;
        this.revokedByUserId = revokedByUserId;
        this.timestamp = timestamp;
    }
    return DelegatedSessionRevokedEvent;
}());
exports.DelegatedSessionRevokedEvent = DelegatedSessionRevokedEvent;
