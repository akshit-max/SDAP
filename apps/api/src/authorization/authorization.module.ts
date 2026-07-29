import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from './authorization.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { MembershipResolver } from './resolvers/membership.resolver';
import { PolicyResolver } from './resolvers/policy.resolver';
import { PermissionEvaluator } from './evaluators/permission.evaluator';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    AuthorizationService,
    PermissionsGuard,
    MembershipResolver,
    PolicyResolver,
    PermissionEvaluator,
    Reflector,
  ],
  exports: [AuthorizationService, PermissionsGuard, PolicyResolver],
})
export class AuthorizationModule {}
