import os
import sys
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.sendgrid_key = os.environ.get('SENDGRID_API_KEY')
        if not self.sendgrid_key:
            logger.error('SENDGRID_API_KEY environment variable must be set')
            sys.exit(1)
        self.sg_client = SendGridAPIClient(self.sendgrid_key)
        self.default_from_email = "reply-manager@bluerobot.com"

    def send_surge_alert(self, config_snapshot, surge_amount, handle):
        """Send surge alert email to configured recipients."""
        try:
            recipients = config_snapshot.get('emails_to_notify', [])
            if not recipients:
                logger.warning("No recipients configured for surge alert")
                return False

            subject = f"Surge Alert: High Hidden Reply Activity for @{handle}"
            
            # Create email content
            html_content = f"""
            <h2>Surge Alert: Hidden Reply Activity</h2>
            <p>A surge in hidden replies has been detected for <strong>@{handle}</strong></p>
            <ul>
                <li>Current Count: {surge_amount}</li>
                <li>Threshold: {config_snapshot.get('surge_reply_count_per_period')} replies per {config_snapshot.get('surge_reply_period_in_ms')/1000} seconds</li>
            </ul>
            """

            # Create message
            message = Mail(
                from_email=Email(self.default_from_email),
                to_emails=[To(email) for email in recipients],
                subject=subject
            )
            message.content = Content("text/html", html_content)

            # Always BCC reply-manager@bluerobot.com
            message.bcc = [Email("reply-manager@bluerobot.com")]

            # Send email
            response = self.sg_client.send(message)
            if response.status_code not in [200, 201, 202]:
                logger.error(f"Error sending surge alert email: {response.body}")
                return False

            logger.info(f"Surge alert email sent successfully to {len(recipients)} recipients")
            return True

        except Exception as e:
            logger.error(f"Error sending surge alert email: {str(e)}")
            return False
