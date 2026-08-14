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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevealSessionDto = exports.CreateSessionDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var CreateSessionDto = function () {
    var _a;
    var _granteeId_decorators;
    var _granteeId_initializers = [];
    var _granteeId_extraInitializers = [];
    var _scope_decorators;
    var _scope_initializers = [];
    var _scope_extraInitializers = [];
    var _resourceId_decorators;
    var _resourceId_initializers = [];
    var _resourceId_extraInitializers = [];
    var _integrationProvider_decorators;
    var _integrationProvider_initializers = [];
    var _integrationProvider_extraInitializers = [];
    var _integrationResourceType_decorators;
    var _integrationResourceType_initializers = [];
    var _integrationResourceType_extraInitializers = [];
    var _integrationResourceExternalId_decorators;
    var _integrationResourceExternalId_initializers = [];
    var _integrationResourceExternalId_extraInitializers = [];
    var _integrationRole_decorators;
    var _integrationRole_initializers = [];
    var _integrationRole_extraInitializers = [];
    var _permission_decorators;
    var _permission_initializers = [];
    var _permission_extraInitializers = [];
    var _expiresAt_decorators;
    var _expiresAt_initializers = [];
    var _expiresAt_extraInitializers = [];
    var _maxReveals_decorators;
    var _maxReveals_initializers = [];
    var _maxReveals_extraInitializers = [];
    var _justification_decorators;
    var _justification_initializers = [];
    var _justification_extraInitializers = [];
    var _capabilities_decorators;
    var _capabilities_initializers = [];
    var _capabilities_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateSessionDto() {
                this.granteeId = __runInitializers(this, _granteeId_initializers, void 0);
                this.scope = (__runInitializers(this, _granteeId_extraInitializers), __runInitializers(this, _scope_initializers, void 0));
                this.resourceId = (__runInitializers(this, _scope_extraInitializers), __runInitializers(this, _resourceId_initializers, void 0));
                this.integrationProvider = (__runInitializers(this, _resourceId_extraInitializers), __runInitializers(this, _integrationProvider_initializers, void 0));
                this.integrationResourceType = (__runInitializers(this, _integrationProvider_extraInitializers), __runInitializers(this, _integrationResourceType_initializers, void 0));
                this.integrationResourceExternalId = (__runInitializers(this, _integrationResourceType_extraInitializers), __runInitializers(this, _integrationResourceExternalId_initializers, void 0));
                this.integrationRole = (__runInitializers(this, _integrationResourceExternalId_extraInitializers), __runInitializers(this, _integrationRole_initializers, void 0));
                this.permission = (__runInitializers(this, _integrationRole_extraInitializers), __runInitializers(this, _permission_initializers, void 0));
                this.expiresAt = (__runInitializers(this, _permission_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
                this.maxReveals = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _maxReveals_initializers, void 0));
                this.justification = (__runInitializers(this, _maxReveals_extraInitializers), __runInitializers(this, _justification_initializers, void 0));
                this.capabilities = (__runInitializers(this, _justification_extraInitializers), __runInitializers(this, _capabilities_initializers, void 0));
                __runInitializers(this, _capabilities_extraInitializers);
            }
            return CreateSessionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _granteeId_decorators = [(0, swagger_1.ApiProperty)({ example: 'user-id', description: 'User ID of the grantee' })];
            _scope_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'SECRET', description: 'Scope of the session' })];
            _resourceId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'resource-id', description: 'ID of the vault or secret' })];
            _integrationProvider_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'GITHUB', description: 'Integration Provider' })];
            _integrationResourceType_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'REPOSITORY', description: 'Integration Resource Type' })];
            _integrationResourceExternalId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'owner/repo', description: 'Integration Resource ID' })];
            _integrationRole_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'DEVELOPER', description: 'Integration Role' })];
            _permission_decorators = [(0, swagger_1.ApiProperty)({ example: 'REVEAL', description: 'Permission level granted' })];
            _expiresAt_decorators = [(0, swagger_1.ApiProperty)({ example: '2027-01-01T00:00:00Z', description: 'Expiration date of the session' })];
            _maxReveals_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 5, description: 'Maximum number of reveals allowed' })];
            _justification_decorators = [(0, swagger_1.ApiProperty)({ example: 'Need access for deployment', description: 'Justification for creating the session' })];
            _capabilities_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: ['GST_FILING'], description: 'List of module capabilities allowed for this session' })];
            __esDecorate(null, null, _granteeId_decorators, { kind: "field", name: "granteeId", static: false, private: false, access: { has: function (obj) { return "granteeId" in obj; }, get: function (obj) { return obj.granteeId; }, set: function (obj, value) { obj.granteeId = value; } }, metadata: _metadata }, _granteeId_initializers, _granteeId_extraInitializers);
            __esDecorate(null, null, _scope_decorators, { kind: "field", name: "scope", static: false, private: false, access: { has: function (obj) { return "scope" in obj; }, get: function (obj) { return obj.scope; }, set: function (obj, value) { obj.scope = value; } }, metadata: _metadata }, _scope_initializers, _scope_extraInitializers);
            __esDecorate(null, null, _resourceId_decorators, { kind: "field", name: "resourceId", static: false, private: false, access: { has: function (obj) { return "resourceId" in obj; }, get: function (obj) { return obj.resourceId; }, set: function (obj, value) { obj.resourceId = value; } }, metadata: _metadata }, _resourceId_initializers, _resourceId_extraInitializers);
            __esDecorate(null, null, _integrationProvider_decorators, { kind: "field", name: "integrationProvider", static: false, private: false, access: { has: function (obj) { return "integrationProvider" in obj; }, get: function (obj) { return obj.integrationProvider; }, set: function (obj, value) { obj.integrationProvider = value; } }, metadata: _metadata }, _integrationProvider_initializers, _integrationProvider_extraInitializers);
            __esDecorate(null, null, _integrationResourceType_decorators, { kind: "field", name: "integrationResourceType", static: false, private: false, access: { has: function (obj) { return "integrationResourceType" in obj; }, get: function (obj) { return obj.integrationResourceType; }, set: function (obj, value) { obj.integrationResourceType = value; } }, metadata: _metadata }, _integrationResourceType_initializers, _integrationResourceType_extraInitializers);
            __esDecorate(null, null, _integrationResourceExternalId_decorators, { kind: "field", name: "integrationResourceExternalId", static: false, private: false, access: { has: function (obj) { return "integrationResourceExternalId" in obj; }, get: function (obj) { return obj.integrationResourceExternalId; }, set: function (obj, value) { obj.integrationResourceExternalId = value; } }, metadata: _metadata }, _integrationResourceExternalId_initializers, _integrationResourceExternalId_extraInitializers);
            __esDecorate(null, null, _integrationRole_decorators, { kind: "field", name: "integrationRole", static: false, private: false, access: { has: function (obj) { return "integrationRole" in obj; }, get: function (obj) { return obj.integrationRole; }, set: function (obj, value) { obj.integrationRole = value; } }, metadata: _metadata }, _integrationRole_initializers, _integrationRole_extraInitializers);
            __esDecorate(null, null, _permission_decorators, { kind: "field", name: "permission", static: false, private: false, access: { has: function (obj) { return "permission" in obj; }, get: function (obj) { return obj.permission; }, set: function (obj, value) { obj.permission = value; } }, metadata: _metadata }, _permission_initializers, _permission_extraInitializers);
            __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: function (obj) { return "expiresAt" in obj; }, get: function (obj) { return obj.expiresAt; }, set: function (obj, value) { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
            __esDecorate(null, null, _maxReveals_decorators, { kind: "field", name: "maxReveals", static: false, private: false, access: { has: function (obj) { return "maxReveals" in obj; }, get: function (obj) { return obj.maxReveals; }, set: function (obj, value) { obj.maxReveals = value; } }, metadata: _metadata }, _maxReveals_initializers, _maxReveals_extraInitializers);
            __esDecorate(null, null, _justification_decorators, { kind: "field", name: "justification", static: false, private: false, access: { has: function (obj) { return "justification" in obj; }, get: function (obj) { return obj.justification; }, set: function (obj, value) { obj.justification = value; } }, metadata: _metadata }, _justification_initializers, _justification_extraInitializers);
            __esDecorate(null, null, _capabilities_decorators, { kind: "field", name: "capabilities", static: false, private: false, access: { has: function (obj) { return "capabilities" in obj; }, get: function (obj) { return obj.capabilities; }, set: function (obj, value) { obj.capabilities = value; } }, metadata: _metadata }, _capabilities_initializers, _capabilities_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateSessionDto = CreateSessionDto;
var RevealSessionDto = function () {
    var _a;
    var _reason_decorators;
    var _reason_initializers = [];
    var _reason_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RevealSessionDto() {
                this.reason = __runInitializers(this, _reason_initializers, void 0);
                __runInitializers(this, _reason_extraInitializers);
            }
            return RevealSessionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _reason_decorators = [(0, swagger_1.ApiProperty)({ example: 'Deploying service A', description: 'Reason for revealing the secret' })];
            __esDecorate(null, null, _reason_decorators, { kind: "field", name: "reason", static: false, private: false, access: { has: function (obj) { return "reason" in obj; }, get: function (obj) { return obj.reason; }, set: function (obj, value) { obj.reason = value; } }, metadata: _metadata }, _reason_initializers, _reason_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RevealSessionDto = RevealSessionDto;
