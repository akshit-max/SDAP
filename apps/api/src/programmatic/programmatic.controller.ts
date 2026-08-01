import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { SecretLifecycleService } from '../vaults/secret-lifecycle.service';
import type { Request as Req } from 'express';
import { Request } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const RevealSecretSchema = z.object({
  reason: z.string().min(1, 'Reason is required for audit purposes'),
});
class RevealSecretDto {
  reason!: string;
}

/**
 * Programmatic Secret API — for CI/CD pipelines and integrations.
 *
 * All endpoints require a valid API key (wk_live_...) in Authorization header.
 * Secret access is scoped to the API key's organization automatically.
 *
 * No new reveal logic — delegates entirely to SecretLifecycleService.
 * Full audit logging is applied via the existing event system.
 */
@ApiTags('Programmatic API')
@ApiSecurity('apiKey')
@Controller('programmatic')
@UseGuards(ApiKeyGuard)
export class ProgrammaticController {
  constructor(private readonly secretLifecycle: SecretLifecycleService) {}

  /**
   * GET /programmatic/secrets/:secretId
   * Retrieve secret metadata (not plaintext).
   */
  @Get('secrets/:secretId')
  @ApiOperation({ summary: 'Get secret metadata by ID (no plaintext)' })
  async getSecret(
    @Request() req: Req,
    @Param('secretId') secretId: string,
  ) {
    const { organizationId } = (req as any).apiKeyContext;

    // Delegate to SecretLifecycleService — it enforces org scoping
    const result = await this.secretLifecycle.getSecretMetadataById(secretId);
    // Verify it belongs to the caller's org
    if ((result as any)?.vault?.organizationId !== organizationId) {
      throw new Error('Secret not found in your organization.');
    }
    return result;
  }

  /**
   * POST /programmatic/secrets/:secretId/reveal
   * Reveal secret plaintext. Requires a reason (audit logged).
   */
  @Post('secrets/:secretId/reveal')
  @ApiOperation({ summary: 'Reveal secret plaintext (API key auth, audit logged)' })
  async revealSecret(
    @Request() req: Req,
    @Param('secretId') secretId: string,
    @Body(new ZodValidationPipe(RevealSecretSchema)) dto: RevealSecretDto,
  ) {
    const { organizationId } = (req as any).apiKeyContext;

    const result = await this.secretLifecycle.revealSecret({
      secretId,
      organizationId,
      // Use a synthetic userId representing the API key caller
      userId: `apikey:${(req as any).apiKeyContext.id}`,
      reason: dto.reason,
    });

    return { plaintext: result };
  }
}
