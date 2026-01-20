import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.logger.debug(`Mail Config: Host=${process.env.MAIL_HOST}, Port=${process.env.MAIL_PORT}, User=${process.env.MAIL_USERNAME}, Secure=${process.env.MAIL_ENCRYPTION === 'ssl'}`);

    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: process.env.MAIL_ENCRYPTION === 'ssl', // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
      logger: true, // Enable nodemailer logging
      debug: true,  // Enable nodemailer debugging
    });

    this.registerPartials();
  }

  private getTemplatesPath(): string {
    // Check if running in production (dist) or development (src)
    const distPath = path.join(process.cwd(), 'dist', 'emails', 'templates');
    const srcPath = path.join(process.cwd(), 'src', 'emails', 'templates');

    if (fs.existsSync(distPath)) {
      return distPath;
    }
    return srcPath;
  }

  private registerPartials() {
    const templatesPath = this.getTemplatesPath();
    const layoutPath = path.join(templatesPath, 'layout');

    if (fs.existsSync(layoutPath)) {
      const partials = fs.readdirSync(layoutPath);
      partials.forEach((partial) => {
        const content = fs.readFileSync(path.join(layoutPath, partial), 'utf8');
        const name = path.basename(partial, '.hbs');
        handlebars.registerPartial(name, content);
      });
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: any,
  ) {
    try {
      const templateBasePath = this.getTemplatesPath();
      const templatePath = path.join(
        templateBasePath,
        `${templateName}.hbs`,
      );

      if (!fs.existsSync(templatePath)) {
        this.logger.error(
          `Template ${templateName} not found at ${templatePath}`,
        );
        return;
      }

      const source = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(source);
      const html = template(context);

      const info = await this.transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || 'ERP Elite'}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent: ${info.messageId} to ${to}`);
      this.logger.debug(`Email response:`, info);
      return info;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
      // Log more details about the error
      if (error.code) {
        this.logger.error(`Email error code: ${error.code}`);
      }
      if (error.response) {
        this.logger.error(`Email error response: ${error.response}`);
      }
      throw error; // Re-throw to allow caller to handle
    }


  }
}
