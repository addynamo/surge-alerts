const sgMail = require('@sendgrid/mail');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

class EmailService {
    constructor() {
        this.sendgridKey = process.env.SENDGRID_API_KEY;
        if (!this.sendgridKey) {
            logger.error('SENDGRID_API_KEY environment variable must be set');
            process.exit(1);
        }
        sgMail.setApiKey(this.sendgridKey);
        this.defaultFromEmail = 'reply-manager@bluerobot.com';
    }

    async sendSurgeAlert(handle, surgeAmount, threshold, periodInSeconds) {
        try {
            const msg = {
                to: [], // Will be populated from config
                from: this.defaultFromEmail,
                bcc: ['reply-manager@bluerobot.com'],
                subject: `Surge Alert: High Hidden Reply Activity for @${handle}`,
                html: `
                    <h2>Surge Alert: Hidden Reply Activity</h2>
                    <p>A surge in hidden replies has been detected for <strong>@${handle}</strong></p>
                    <ul>
                        <li>Current Count: ${surgeAmount}</li>
                        <li>Threshold: ${threshold} replies per ${periodInSeconds} seconds</li>
                    </ul>
                `
            };

            await sgMail.send(msg);
            logger.info(`Surge alert email sent successfully for handle: ${handle}`);
            return true;
        } catch (error) {
            logger.error('Error sending surge alert email:', error);
            return false;
        }
    }
}

module.exports = EmailService;
