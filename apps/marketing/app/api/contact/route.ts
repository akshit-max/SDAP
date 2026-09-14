import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, organization, message } = body;

    if (!name || !email || !organization) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use environment variables for email configuration to avoid hardcoding
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const toEmail = process.env.DEMO_REQUEST_RECIPIENT;

    if (!apiKey || !fromEmail || !toEmail) {
      console.error('Email configuration missing in environment variables');
      return NextResponse.json(
        { error: 'Server email configuration error' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeOrg = escapeHtml(organization.trim());
    const safeMessage = message && message.trim() ? escapeHtml(message.trim()) : '';

    const textBody = `Hello WITHUS Team,

A new product demo request has been submitted through the WITHUS public website.

━━━━━━━━━━━━━━━━━━━━
DEMO REQUEST DETAILS
━━━━━━━━━━━━━━━━━━━━

Name:
${name.trim()}

Work Email:
${email.trim()}

Organization:
${organization.trim()}${message && message.trim() ? `\n\nMessage:\n${message.trim()}` : ''}

━━━━━━━━━━━━━━━━━━━━

Submitted via:
WITHUS Public Product Page

Please follow up with the requester using the email address provided above.

Regards,
WITHUS`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New WITHUS Demo Request</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                  
                  <!-- Header Banner -->
                  <tr>
                    <td style="background-color: #09090b; padding: 28px 32px; border-bottom: 1px solid #27272a;">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <span style="font-size: 20px; font-weight: 800; tracking-tight; color: #ffffff; letter-spacing: -0.5px;">WITHUS</span>
                          </td>
                          <td align="right">
                            <span style="background-color: #27272a; color: #a1a1aa; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 20px; border: 1px solid #3f3f46; letter-spacing: 0.5px; text-transform: uppercase;">Demo Request</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 32px;">
                      
                      <!-- Greeting & Subtitle -->
                      <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #09090b;">Hello WITHUS Team,</p>
                      <p style="margin: 0 0 28px 0; font-size: 14px; color: #71717a; line-height: 1.5;">A new product demo request has been submitted through the WITHUS public website.</p>

                      <!-- Details Box -->
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
                        
                        <!-- Name Field -->
                        <tr>
                          <td style="padding: 16px 20px; border-bottom: 1px solid #f4f4f5;">
                            <span style="display: block; font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Full Name</span>
                            <span style="font-size: 15px; font-weight: 600; color: #09090b;">${safeName}</span>
                          </td>
                        </tr>

                        <!-- Work Email Field -->
                        <tr>
                          <td style="padding: 16px 20px; border-bottom: 1px solid #f4f4f5;">
                            <span style="display: block; font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Work Email</span>
                            <a href="mailto:${safeEmail}" style="font-size: 15px; font-weight: 600; color: #09090b; text-decoration: underline;">${safeEmail}</a>
                          </td>
                        </tr>

                        <!-- Organization Field -->
                        <tr>
                          <td style="padding: 16px 20px;">
                            <span style="display: block; font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Company / Organization</span>
                            <span style="font-size: 15px; font-weight: 600; color: #09090b;">${safeOrg}</span>
                          </td>
                        </tr>
                      </table>

                      ${safeMessage ? `
                      <!-- Optional Message Box -->
                      <div style="margin-bottom: 28px;">
                        <span style="display: block; font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Message / Use Case</span>
                        <div style="background-color: #fafafa; border-left: 3px solid #09090b; border-top: 1px solid #f4f4f5; border-right: 1px solid #f4f4f5; border-bottom: 1px solid #f4f4f5; border-radius: 0 8px 8px 0; padding: 16px; font-size: 14px; color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</div>
                      </div>
                      ` : ''}

                      <!-- Footer Notice -->
                      <p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a; line-height: 1.5; border-top: 1px solid #f4f4f5; padding-top: 20px;">
                        Please follow up with the requester using the email address provided above.
                      </p>

                      <!-- Sign-off -->
                      <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
                        Regards,<br />
                        <strong style="color: #09090b; font-weight: 700;">WITHUS Team</strong>
                      </p>

                    </td>
                  </tr>

                  <!-- Card Footer Metadata -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 16px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                      <p style="margin: 0; font-size: 11px; color: #a1a1aa; font-weight: 500;">Submitted via WITHUS Public Product Page &bull; System Notification</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email.trim(),
      subject: `New WITHUS Demo Request — ${organization.trim()}`,
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
