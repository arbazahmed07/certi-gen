from app.schemas.recipient import RecipientInput
from app.services.validation_service import ValidationService


def test_validation_clean_data():
    recipients = [
        RecipientInput(recipient_name="Alice Smith", recipient_email="alice@example.com"),
        RecipientInput(recipient_name="Bob Jones", recipient_email="bob@example.com"),
    ]
    res = ValidationService.validate_recipients(recipients)
    assert len(res.valid_items) == 2
    assert len(res.invalid_items) == 0


def test_validation_duplicate_detection():
    recipients = [
        RecipientInput(recipient_name="Alice Smith", recipient_email="alice@example.com"),
        RecipientInput(recipient_name="Alice Smith 2", recipient_email="alice@example.com"),  # duplicate email
    ]
    res = ValidationService.validate_recipients(recipients)
    assert len(res.valid_items) == 1
    assert len(res.invalid_items) == 1
    assert "Duplicate" in res.invalid_items[0]["reason"]


def test_parse_csv():
    csv_data = b"name,email\nJohn Doe,john@test.com\nJane Doe,jane@test.com\n,invalid@test.com\n"
    parsed, errors = ValidationService.parse_csv(csv_data)
    assert len(parsed) == 2
    assert len(errors) == 1
    assert parsed[0].recipient_name == "John Doe"
    assert parsed[1].recipient_email == "jane@test.com"
