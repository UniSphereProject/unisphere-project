from __future__ import annotations

import random
import secrets
import string
from typing import Optional, Dict, Any

import requests

from app.utils.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


def generate_otp(length: int = 6) -> str:
    """Generate an alphanumeric OTP code."""

    return ''.join(str(secrets.randbelow(10)) for _ in range(length))



def send_email_via_brevo(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email via Brevo API using basic HTML content.

    Returns True when accepted by Brevo (201), else False with logs.
    Requires a verified sender email in Brevo (settings.brevo_sender_email).
    """

    if not settings.BREVO_API_KEY:
        logger.error("Brevo API key missing; email not sent")
        return False
    if not settings.BREVO_SENDER_EMAIL:
        logger.error("Brevo sender email missing; email not sent")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }
    print(settings.BREVO_API_KEY)
    # Match exact structure from Brevo docs
    payload: Dict[str, Any] = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }

    logger.info("Sending email to %s via Brevo", to_email)
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        logger.info("Brevo response: status=%s", resp.status_code)

        if resp.status_code == 201:
            result = resp.json() if resp.text else {}
            message_id = result.get("messageId", "unknown")
            logger.info("Email sent successfully. messageId=%s", message_id)
            return True

        # Log detailed error
        error_body = resp.text
        try:
            error_json = resp.json()
            logger.error("Brevo send failed: status=%s, error=%s", resp.status_code, error_json)
        except:
            logger.error("Brevo send failed: status=%s, body=%s", resp.status_code, error_body)
        return False

    except requests.exceptions.RequestException as exc:
        logger.error("Brevo request exception: %s", exc, exc_info=True)
        return False
    except Exception as exc:
        logger.error("Unexpected error sending email: %s", exc, exc_info=True)
        return False


def send_template_email_via_brevo(to_email: str, template_id: int, params: Optional[Dict[str, Any]] = None) -> bool:
    """Send an email via Brevo API using a pre-activated template with params.

    The recipient email should be a contact registered in Brevo.
    """
    if not settings.BREVO_API_KEY:
        logger.error("Brevo API key missing; template email not sent")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }
    # Match exact structure from Brevo docs for template emails
    payload: Dict[str, Any] = {
        "to": [
            {
                "email": to_email
            }
        ],
        "templateId": template_id
    }
    if params:
        payload["params"] = params

    logger.info("Sending template email (id=%s) to %s via Brevo", template_id, to_email)
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        logger.info("Brevo template response: status=%s", resp.status_code)

        if resp.status_code == 201:
            result = resp.json() if resp.text else {}
            message_id = result.get("messageId", "unknown")
            logger.info("Template email sent successfully. messageId=%s", message_id)
            return True

        error_body = resp.text
        try:
            error_json = resp.json()
            logger.error("Brevo template send failed: status=%s, error=%s", resp.status_code, error_json)
        except:
            logger.error("Brevo template send failed: status=%s, body=%s", resp.status_code, error_body)
        return False

    except requests.exceptions.RequestException as exc:
        logger.error("Brevo template request exception: %s", exc, exc_info=True)
        return False
    except Exception as exc:
        logger.error("Unexpected error sending template email: %s", exc, exc_info=True)
        return False

