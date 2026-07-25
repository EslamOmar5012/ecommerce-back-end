import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.getConfigValue('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  private getConfigValue(key: string): string {
    const value = this.configService.get<string>(key);
    return value ? value.replace(/^['"]|['"]$/g, '') : '';
  }

  private getHtmlTemplate(title: string, message: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            border: 1px solid #e5e7eb;
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 40px 30px;
            color: #374151;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 20px 0;
            font-size: 16px;
          }
          .otp-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border: 1px dashed #d1d5db;
          }
          .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #4f46e5;
            margin: 0;
            padding-left: 8px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Xeno E-commerce</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="otp-container">
              <p style="margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600;">Your OTP Verification Code</p>
              <div class="otp-code">${otp}</div>
            </div>
            <p style="font-size: 14px; color: #ef4444; font-weight: 500;">Note: This verification code is valid for 10 minutes. Please do not share this OTP with anyone.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Route E-Commerce. All rights reserved.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const from =
      this.getConfigValue('EMAIL_FROM') ||
      'Route Ecommerce <onboarding@resend.dev>';

    try {
      await this.resend.emails.send({
        from,
        to: [to],
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Email delivery failed to ${to}`, error);
      throw error;
    }
  }

  async sendVerificationOtp(email: string, otp: string): Promise<void> {
    const title = 'Verify Your Email Address';
    const message =
      'Thank you for registering with Route E-Commerce. To complete your sign-up process, please use the following one-time password (OTP) to verify your email address:';
    const html = this.getHtmlTemplate(title, message, otp);
    await this.sendMail(email, 'Email Verification - Route E-Commerce', html);
  }

  async sendResetPasswordOtp(email: string, otp: string): Promise<void> {
    const title = 'Reset Your Password';
    const message =
      'We received a request to reset your password for your Route E-Commerce account. Please use the following one-time password (OTP) to reset your password:';
    const html = this.getHtmlTemplate(title, message, otp);
    await this.sendMail(email, 'Password Reset - Route E-Commerce', html);
  }
}
