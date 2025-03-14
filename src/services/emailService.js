const sgMail = require('@sendgrid/mail');
const { logger } = require('../config/logger');
const config = require('../config/environment');

class EmailService {
    constructor() {
        if (!config.email.sendgridKey) {
            logger.error('SENDGRID_API_KEY environment variable must be set');
            process.exit(1);
        }
        sgMail.setApiKey(config.email.sendgridKey);
        this.defaultFromEmail = config.email.defaultFromEmail;
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
