import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interface';
import got from 'got';
import * as FormData from 'form-data';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  private async sendEmail(
    subject: string,
    to: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    form.append('from', `${to} from BuyDell <mailgun@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));

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

    try {
      const Code = emailVars.filter((eVar) =>
        eVar.key === 'code' ? eVar.value : null,
      );
      const mailOption = {
        from: process.env.NODE_EAMIL,
        to,
        subject: 'BuyDell Verify Code Email',
        text: `Your Verify Code: ${Code[0].value}`,
      };

      await smtpTransport.sendMail(mailOption);
      smtpTransport.close();

      // const response = await got(
      //   `https://api.mailgun.net/v3/${this.options.domain}/messages`,
      //   {
      //     headers: {
      //       Authorization: `Basic ${Buffer.from(
      //         `api:${this.options.apiKey}`,
      //       ).toString('base64')}`,
      //     },
      //     method: 'POST',
      //     body: form,
      //   },
      // );
    } catch (e) {
      console.log(e.response.body);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', email, 'buy-dell-account-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
