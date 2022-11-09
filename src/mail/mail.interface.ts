export interface MailModuleOptions {
  apiKey: string;
  domain: string;
  fromEmail: string;
  email: string;
  password: string;
}

export interface EmailVar {
  key: string;
  value: string;
}
