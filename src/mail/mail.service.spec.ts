import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn(() => {
      return {
        sendMail: jest.fn(),
        close: jest.fn(),
      };
    }),
  };
});

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: 'test-apiKey',
            domain: 'test-domain',
            fromEmail: 'test-fromEamil',
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', () => {
      const sendVerificationEmailArgs = {
        email: 'email',
        code: 'code',
      };

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => {});
      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );

      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );
    });
  });

  describe('sendEmail', () => {
    it('send email', async () => {
      await service.sendEmail('', '', '');

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: 'Naver',
        host: 'smtp.naver.com',
        port: 587,
        auth: {
          user: process.env.NODE_EAMIL,
          pass: process.env.NODE_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    });
  });

  it.todo('sendEmail');
  it.todo('sendEmailVerification');
});
