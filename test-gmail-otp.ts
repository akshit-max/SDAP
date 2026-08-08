import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { GmailOtpService } from './apps/api/src/integrations/gmail/gmail-otp.service';
import { GmailAdapter } from './apps/api/src/integrations/gmail/gmail.adapter';
import { PrismaService } from './apps/api/src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const gmailOtp = app.get(GmailOtpService);
  const gmailAdapter = app.get(GmailAdapter);

  console.log('--- GMAIL OTP TEST ---');

  // Find any active session
  const session = await prisma.delegatedSession.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!session) {
    console.log('No active session found in DB.');
    await app.close();
    return;
  }

  console.log(`Testing with Org ID: ${session.organizationId}`);
  console.log(`Platform: ${session.integrationProvider}`);

  try {
    const accessToken = await gmailAdapter.getValidAccessToken(session.organizationId);
    console.log('✅ Successfully obtained Gmail Access Token');

    const otp = await gmailOtp.fetchLatestOtp(accessToken, session.integrationProvider);
    console.log(`✅ Extracted OTP: ${otp}`);
  } catch (error) {
    console.error('❌ Error testing Gmail OTP:');
    console.error(error.message || error);
  }

  await app.close();
}
bootstrap();
