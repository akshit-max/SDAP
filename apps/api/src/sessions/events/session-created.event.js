"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegatedSessionCreatedEvent = void 0;
var DelegatedSessionCreatedEvent = /** @class */ (function () {
    function DelegatedSessionCreatedEvent(sessionId, organizationId, grantorId, granteeId, scope, resourceId, timestamp) {
        if (timestamp === void 0) { timestamp = new Date(); }
        this.sessionId = sessionId;
        this.organizationId = organizationId;
        this.grantorId = grantorId;
        this.granteeId = granteeId;
        this.scope = scope;
        this.resourceId = resourceId;
        this.timestamp = timestamp;
    }
    return DelegatedSessionCreatedEvent;
}());
exports.DelegatedSessionCreatedEvent = DelegatedSessionCreatedEvent;
