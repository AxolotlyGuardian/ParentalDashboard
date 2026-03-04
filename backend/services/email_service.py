"""Email service for transactional emails: verification and password reset."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP. Returns True on success, False on failure."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.warning("SMTP not configured — skipping email to %s", to_email)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
        logger.info("Email sent to %s: %s", to_email, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


def send_verification_email(to_email: str, token: str) -> bool:
    """Send an email address verification link."""
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <html><body style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#F77B8A">Welcome to Axolotly!</h2>
      <p>Please verify your email address to activate your account.</p>
      <a href="{verify_url}"
         style="display:inline-block;padding:12px 24px;background:#F77B8A;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:bold">
        Verify Email Address
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">
        This link expires in 24 hours. If you did not create an Axolotly account, you can safely ignore this email.
      </p>
    </body></html>
    """
    return _send_email(to_email, "Verify your Axolotly email address", html)


def send_password_reset_email(to_email: str, token: str) -> bool:
    """Send a password reset link."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <html><body style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#F77B8A">Reset your Axolotly password</h2>
      <p>We received a request to reset the password for your account.</p>
      <a href="{reset_url}"
         style="display:inline-block;padding:12px 24px;background:#F77B8A;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:bold">
        Reset Password
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">
        This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
      </p>
    </body></html>
    """
    return _send_email(to_email, "Reset your Axolotly password", html)
