import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  private compileTemplate(templateName: string, data: any) {
    const templatePath = path.join(
      process.cwd(),
      'src/mail/templates',
      `${templateName}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    return template({
      ...data,
      currentYear: new Date().getFullYear(),
    });
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    const html = this.compileTemplate('email-verification', {
      name,
      verificationUrl,
    });
    await this.transporter.sendMail({
      from: `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const html = this.compileTemplate('password-reset', {
      name,
      resetUrl,
    });

    await this.transporter.sendMail({
      from: `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: 'Reset Your Password',
      html,
    });
  }
}
