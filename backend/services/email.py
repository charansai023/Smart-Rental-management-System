import os
import logging
import resend
from typing import Optional

logger = logging.getLogger(__name__)

# Initialize resend with env var if available
_resend_api_key = os.getenv("RESEND_API_KEY")
if _resend_api_key:
    resend.api_key = _resend_api_key

_resend_from_email = os.getenv("RESEND_FROM_EMAIL", "alerts@yourdomain.com")


def send_anomaly_email(
    recipient_email: str,
    equipment_id: str,
    equipment_type: str,
    site: str,
    operator_name: str,
    alert_level: str,
    alert_title: str,
    alert_body: str,
    anomaly_score: Optional[float] = None,
):
    """
    Sends an anomaly alert email to the operator using Resend.
    Does not crash the caller if it fails.
    """
    if not recipient_email:
        logger.info(f"No recipient email for {equipment_id} operator {operator_name}. Skipping email.")
        return

    if not resend.api_key:
        logger.warning("RESEND_API_KEY is not set. Email will not be sent.")
        return

    try:
        html_content = f"""
        <div style="font-family: sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">🚨 CatFleet360 Alert — {alert_title}</h2>
            <p><strong>CatFleet360 Equipment Alert</strong></p>
            <ul>
                <li><strong>Equipment:</strong> {equipment_id}</li>
                <li><strong>Equipment Type:</strong> {equipment_type}</li>
                <li><strong>Operator:</strong> {operator_name}</li>
                <li><strong>Site:</strong> {site}</li>
                <li><strong>Alert:</strong> {alert_title}</li>
                <li><strong>Severity:</strong> {alert_level.upper()}</li>
            </ul>
            <p><strong>Details:</strong><br/>{alert_body}</p>
        """
        
        if anomaly_score is not None:
            html_content += f"<p><strong>Anomaly Score:</strong> {anomaly_score:.2f}</p>"
            
        html_content += """
            <p><strong>Recommended Action:</strong><br/>Please inspect the equipment and verify the current operating conditions, operator assignment and site assignment.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">This alert was generated automatically by CatFleet360.</p>
        </div>
        """

        response = resend.Emails.send({
            "from": _resend_from_email,
            "to": [recipient_email],
            "subject": f"🚨 CatFleet360 Alert — {equipment_id} Anomaly",
            "html": html_content
        })
        logger.info(f"Successfully sent alert email for {equipment_id} to {recipient_email}. Response: {response}")
    except Exception as e:
        logger.error(f"Failed to send email for {equipment_id} to {recipient_email}: {e}")

def send_checkout_email(
    recipient_email: str,
    equipment_id: str,
    equipment_type: str,
    site: str,
    operator_name: str,
    rental_days: int
):
    """
    Sends a checkout confirmation email to the operator using Resend.
    Does not crash the caller if it fails.
    """
    if not recipient_email:
        logger.info(f"No recipient email for {equipment_id} checkout by {operator_name}. Skipping email.")
        return

    if not resend.api_key:
        logger.warning("RESEND_API_KEY is not set. Email will not be sent.")
        return

    try:
        html_content = f"""
        <div style="font-family: sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ CatFleet360 Lease Agreement Confirmed</h2>
            <p><strong>CatFleet360 Equipment Checkout</strong></p>
            <ul>
                <li><strong>Equipment:</strong> {equipment_id}</li>
                <li><strong>Equipment Type:</strong> {equipment_type}</li>
                <li><strong>Operator:</strong> {operator_name}</li>
                <li><strong>Site:</strong> {site}</li>
                <li><strong>Lease Duration:</strong> {rental_days} days</li>
            </ul>
            <p><strong>Details:</strong><br/>You have successfully checked out this equipment. Please ensure safe operation and return the equipment by the end of the lease duration.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">This confirmation was generated automatically by CatFleet360.</p>
        </div>
        """

        response = resend.Emails.send({
            "from": _resend_from_email,
            "to": [recipient_email],
            "subject": f"✅ CatFleet360 Checkout Confirmation — {equipment_id}",
            "html": html_content
        })
        logger.info(f"Successfully sent checkout email for {equipment_id} to {recipient_email}. Response: {response}")
    except Exception as e:
        logger.error(f"Failed to send checkout email for {equipment_id} to {recipient_email}: {e}")
