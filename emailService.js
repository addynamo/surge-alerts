const sgMail = require('@sendgrid/mail');

class EmailService {
    constructor(apiKey, notificationEmail) {
        sgMail.setApiKey(apiKey);
        this.notificationEmail = notificationEmail;
    }

    async sendSurgeAlert(handle, currentCount, average, threshold) {
        const msg = {
            to: this.notificationEmail,
            from: this.notificationEmail, // Must be verified sender
            subject: `Surge Alert: High Hidden Reply Activity for @${handle}`,
            text: `A surge in hidden replies has been detected for @${handle}:
                \nCurrent Count: ${currentCount}
                \nHourly Average: ${average.toFixed(2)}
                \nSurge Threshold: ${threshold.toFixed(2)}`,
            html: `<h2>Surge Alert: Hidden Reply Activity</h2>
                  <p>A surge in hidden replies has been detected for <strong>@${handle}</strong></p>
                  <ul>
                    <li>Current Count: ${currentCount}</li>
                    <li>Hourly Average: ${average.toFixed(2)}</li>
                    <li>Surge Threshold: ${threshold.toFixed(2)}</li>
                  </ul>`
        };

        try {
            await sgMail.send(msg);
            return true;
        } catch (error) {
            console.error('Error sending surge alert email:', error);
            return false;
        }
    }
}

module.exports = EmailService;
