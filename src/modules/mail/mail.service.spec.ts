import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  const createTransportMock = nodemailer.createTransport as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    createTransportMock.mockReturnValue({
      sendMail: jest.fn(),
    });
  });

  it('uses IPv4 SMTP settings for Gmail-compatible delivery', () => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | undefined> = {
          EMAIL_USER: 'test@example.com',
          EMAIL_PASS: 'secret',
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: '587',
          SMTP_SECURE: 'false',
          EMAIL_FROM: 'Route Ecommerce <test@example.com>',
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    new MailService(configService);

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        family: 4,
        auth: {
          user: 'test@example.com',
          pass: 'secret',
        },
      }),
    );
  });
});
