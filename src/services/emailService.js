const sgMail = require('@sendgrid/mail');
const logger = require('../config/logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  static async sendSurgeAlert(handle, replyCount) {
    try {
      const msg = {
        to: process.env.ALERT_EMAIL || 'alerts@example.com',
        from: 'surge-alerts@yourdomain.com',
        subject: `Surge Alert: Activity spike for ${handle}`,
        text: `A surge in activity has been detected for ${handle} with ${replyCount} replies in the configured time window.`,
        html: `
          <h2>Social Media Surge Alert</h2>
          <p>A surge in activity has been detected:</p>
          <ul>
            <li><strong>Handle:</strong> ${handle}</li>
            <li><strong>Reply Count:</strong> ${replyCount}</li>
            <li><strong>Time:</strong> ${new Date().toISOString()}</li>
          </ul>
        `
      };

      await sgMail.send(msg);
      logger.info(`Sent surge alert email for handle: ${handle}`);
    } catch (error) {
      logger.error(`Error sending surge alert email: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EmailService;
