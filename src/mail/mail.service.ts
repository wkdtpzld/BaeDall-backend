import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.interface';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(subject: string, to: string, code: string) {
    const smtpTransport = nodemailer.createTransport({
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

    const mailOption = {
      from: process.env.NODE_EAMIL,
      to,
      subject,
      text: `Your Verify Code: ${code}`,
    };

    await smtpTransport.sendMail(mailOption);
    smtpTransport.close();
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', email, code);
  }
}
