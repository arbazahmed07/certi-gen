import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas


class CertificateGenerator:
    """
    Renders a landscape A4 certificate with elegant borders,
    refined typography, seal graphic, and verification ID.
    """

    WIDTH, HEIGHT = landscape(A4)

    @classmethod
    def generate_pdf(
        cls,
        certificate_id: str,
        recipient_name: str,
        course_name: str,
        issuer: str,
        organization: str,
        issue_date: str,
        event_name: str | None = None
    ) -> bytes:
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=landscape(A4))
        w = cls.WIDTH
        h = cls.HEIGHT

        # 1. Background fill
        c.setFillColor(colors.HexColor("#FCFDFD"))
        c.rect(0, 0, w, h, fill=1, stroke=0)

        # 2. Outer Decorative Border
        c.setStrokeColor(colors.HexColor("#4F46E5"))  # Indigo primary
        c.setLineWidth(3)
        margin_outer = 24
        c.rect(margin_outer, margin_outer, w - 2 * margin_outer, h - 2 * margin_outer)

        # 3. Inner Decorative Border
        c.setStrokeColor(colors.HexColor("#E0E7FF"))  # Soft indigo
        c.setLineWidth(1)
        margin_inner = 30
        c.rect(margin_inner, margin_inner, w - 2 * margin_inner, h - 2 * margin_inner)

        # 4. Corner Ornaments (Classic geometric brackets)
        corner_len = 36
        c.setStrokeColor(colors.HexColor("#312E81"))  # Deep indigo
        c.setLineWidth(2)
        # Top Left
        c.line(margin_outer, h - margin_outer - corner_len, margin_outer, h - margin_outer)
        c.line(margin_outer, h - margin_outer, margin_outer + corner_len, h - margin_outer)
        # Top Right
        c.line(w - margin_outer - corner_len, h - margin_outer, w - margin_outer, h - margin_outer)
        c.line(w - margin_outer, h - margin_outer, w - margin_outer, h - margin_outer - corner_len)
        # Bottom Left
        c.line(margin_outer, margin_outer + corner_len, margin_outer, margin_outer)
        c.line(margin_outer, margin_outer, margin_outer + corner_len, margin_outer)
        # Bottom Right
        c.line(w - margin_outer - corner_len, margin_outer, w - margin_outer, margin_outer)
        c.line(w - margin_outer, margin_outer, w - margin_outer, margin_outer + corner_len)

        # 5. Top Organization Ribbon
        c.setFillColor(colors.HexColor("#4F46E5"))
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(w / 2.0, h - 68, organization.upper())

        # 6. Certificate Title
        c.setFillColor(colors.HexColor("#1E1B4B"))
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(w / 2.0, h - 116, "CERTIFICATE OF ACHIEVEMENT")

        # Decorative separator beneath title
        c.setStrokeColor(colors.HexColor("#6366F1"))
        c.setLineWidth(1.5)
        c.line(w / 2.0 - 100, h - 128, w / 2.0 + 100, h - 128)

        # 7. Presentation Subtitle
        c.setFillColor(colors.HexColor("#6B7280"))
        c.setFont("Helvetica", 12)
        c.drawCentredString(w / 2.0, h - 162, "THIS CERTIFICATE IS PROUDLY PRESENTED TO")

        # 8. Recipient Name
        c.setFillColor(colors.HexColor("#111827"))
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(w / 2.0, h - 212, recipient_name)

        # Underline bar under recipient name
        c.setStrokeColor(colors.HexColor("#CBD5E1"))
        c.setLineWidth(1)
        c.line(w / 2.0 - 180, h - 224, w / 2.0 + 180, h - 224)

        # 9. Course Description Text
        c.setFillColor(colors.HexColor("#4B5563"))
        c.setFont("Helvetica", 13)
        c.drawCentredString(w / 2.0, h - 262, "For successfully completing and demonstrating mastery in")

        # 10. Course Name
        c.setFillColor(colors.HexColor("#4338CA"))
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(w / 2.0, h - 296, course_name)

        # 11. Event Context (Optional)
        current_y = h - 325
        if event_name:
            c.setFillColor(colors.HexColor("#6B7280"))
            c.setFont("Helvetica-Oblique", 11)
            c.drawCentredString(w / 2.0, current_y, f"Conducted during {event_name}")
            current_y -= 25

        # 12. Center Decorative Seal / Stamp
        seal_x = w / 2.0
        seal_y = 125
        c.setFillColor(colors.HexColor("#EEF2FF"))
        c.setStrokeColor(colors.HexColor("#4F46E5"))
        c.setLineWidth(1.5)
        c.circle(seal_x, seal_y, 32, fill=1, stroke=1)
        c.circle(seal_x, seal_y, 27, fill=0, stroke=1)
        c.setFillColor(colors.HexColor("#312E81"))
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(seal_x, seal_y + 4, "OFFICIAL")
        c.drawCentredString(seal_x, seal_y - 6, "SEAL")

        # 13. Left Side: Date Block
        left_col_x = 160
        c.setStrokeColor(colors.HexColor("#9CA3AF"))
        c.setLineWidth(1)
        c.line(left_col_x - 80, 115, left_col_x + 80, 115)
        c.setFillColor(colors.HexColor("#1F2937"))
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(left_col_x, 125, issue_date)
        c.setFillColor(colors.HexColor("#6B7280"))
        c.setFont("Helvetica", 10)
        c.drawCentredString(left_col_x, 100, "Date of Issue")

        # 14. Right Side: Authorized Signature
        right_col_x = w - 160
        c.setStrokeColor(colors.HexColor("#9CA3AF"))
        c.setLineWidth(1)
        c.line(right_col_x - 80, 115, right_col_x + 80, 115)
        c.setFillColor(colors.HexColor("#1F2937"))
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(right_col_x, 125, issuer)
        c.setFillColor(colors.HexColor("#6B7280"))
        c.setFont("Helvetica", 10)
        c.drawCentredString(right_col_x, 100, "Authorized Signatory")

        # 15. Bottom Footer / Unique ID & Verification Hash
        c.setFillColor(colors.HexColor("#9CA3AF"))
        c.setFont("Helvetica", 9)
        footer_text = f"Certificate ID: {certificate_id}  •  Verify authenticity online at certiflow.internal/verify/{certificate_id}"
        c.drawCentredString(w / 2.0, 48, footer_text)

        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer.getvalue()
