import csv
import io
import re
from typing import List, Dict, Tuple, Any, Optional
from app.schemas.recipient import RecipientInput


class ValidationResult:
    def __init__(self):
        self.valid_items: List[Dict[str, str]] = []
        self.invalid_items: List[Dict[str, str]] = []
        self.duplicates: List[Dict[str, str]] = []

    @property
    def total_count(self) -> int:
        return len(self.valid_items) + len(self.invalid_items)


class ValidationService:
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

    @classmethod
    def validate_recipients(
        cls,
        recipients_data: List[RecipientInput],
        detect_duplicates: bool = True
    ) -> ValidationResult:
        result = ValidationResult()
        seen_emails = set()
        seen_names = set()

        for idx, item in enumerate(recipients_data):
            name = (item.recipient_name or "").strip()
            email = (item.recipient_email or "").strip().lower() if item.recipient_email else None

            # 1. Name validation
            if not name or len(name) < 2:
                result.invalid_items.append({
                    "row_index": idx + 1,
                    "recipient_name": name,
                    "recipient_email": email or "",
                    "reason": "Recipient name must be at least 2 characters long."
                })
                continue

            # 2. Email validation (if provided)
            if email and not cls.EMAIL_REGEX.match(email):
                result.invalid_items.append({
                    "row_index": idx + 1,
                    "recipient_name": name,
                    "recipient_email": email,
                    "reason": "Invalid email address format."
                })
                continue

            # 3. Duplicate detection
            is_dup = False
            if detect_duplicates:
                if email and email in seen_emails:
                    is_dup = True
                elif not email and name.lower() in seen_names:
                    is_dup = True

            if is_dup:
                result.duplicates.append({
                    "row_index": idx + 1,
                    "recipient_name": name,
                    "recipient_email": email or "",
                    "reason": f"Duplicate recipient detected ({email or name})."
                })
                result.invalid_items.append({
                    "row_index": idx + 1,
                    "recipient_name": name,
                    "recipient_email": email or "",
                    "reason": f"Duplicate recipient entry ({email or name})."
                })
                continue

            if email:
                seen_emails.add(email)
            seen_names.add(name.lower())

            result.valid_items.append({
                "recipient_name": name,
                "recipient_email": email
            })

        return result

    @classmethod
    def parse_csv(cls, file_content: bytes) -> Tuple[List[RecipientInput], List[str]]:
        """
        Parses CSV with header detection for recipient_name/name, recipient_email/email.
        Returns parsed list and any format warnings/errors.
        """
        text = file_content.decode("utf-8-sig", errors="replace")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)

        if not rows:
            return [], ["Uploaded CSV is empty."]

        headers = [h.strip().lower() for h in rows[0]]
        name_idx = -1
        email_idx = -1

        for i, h in enumerate(headers):
            if h in ["name", "recipient_name", "full_name", "student_name"]:
                name_idx = i
            elif h in ["email", "recipient_email", "email_address"]:
                email_idx = i

        if name_idx == -1:
            # Fallback: assume first column is name, second column is email if exists
            name_idx = 0
            if len(headers) > 1:
                email_idx = 1

        recipients: List[RecipientInput] = []
        errors = []

        for row_idx, row in enumerate(rows[1:], start=2):
            if not row or all(not cell.strip() for cell in row):
                continue
            
            name = row[name_idx].strip() if len(row) > name_idx else ""
            email = row[email_idx].strip() if email_idx != -1 and len(row) > email_idx else None

            if not name:
                errors.append(f"Row {row_idx}: Missing recipient name.")
                continue

            recipients.append(RecipientInput(
                recipient_name=name,
                recipient_email=email if email else None
            ))

        return recipients, errors
