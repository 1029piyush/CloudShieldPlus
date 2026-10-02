"""PDF rendering for completed CloudShield security assessments."""

import json
from collections import Counter
from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


NAVY = colors.HexColor("#071A2F")
BLUE = colors.HexColor("#0B6E99")
INK = colors.HexColor("#172B4D")
MUTED = colors.HexColor("#52657A")
LIGHT = colors.HexColor("#EEF5F8")
SEVERITY_COLORS = {
	"Critical": colors.HexColor("#C62828"),
	"High": colors.HexColor("#D97706"),
	"Medium": colors.HexColor("#A16207"),
	"Low": colors.HexColor("#15803D"),
}


def _text(value, fallback="Not provided"):
	if value is None or value == "":
		return fallback
	if isinstance(value, (dict, list)):
		return json.dumps(value, default=str)
	return str(value)


def _paragraph(value, style):
	escaped = _text(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
	return Paragraph(escaped, style)


def _section_title(title, styles):
	return [Spacer(1, 8), Paragraph(title, styles["section"]), Spacer(1, 4)]


def _footer(canvas, doc):
	canvas.saveState()
	canvas.setStrokeColor(colors.HexColor("#D7E4EA"))
	canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
	canvas.setFont("Helvetica", 8)
	canvas.setFillColor(MUTED)
	canvas.drawString(18 * mm, 9 * mm, "CloudShieldPlus | Confidential security assessment")
	canvas.drawRightString(192 * mm, 9 * mm, f"Page {doc.page}")
	canvas.restoreState()


def build_pdf_report(scan):
	"""Build a professional, self-contained PDF from one completed scan."""
	findings = list(scan.findings or [])
	attack_paths = list(scan.attack_paths or [])
	recommendations = list(scan.recommendations or [])
	services = scan.service_inventory or []
	severity_counts = Counter(getattr(item, "severity", "Unknown") for item in findings)
	risk_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
	attack_paths.sort(key=lambda item: risk_order.get(getattr(item, "risk", ""), 0), reverse=True)
	recommendations.sort(key=lambda item: risk_order.get(getattr(item, "priority", ""), 0), reverse=True)

	styles = getSampleStyleSheet()
	styles.add(ParagraphStyle("cover", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=28, leading=33, textColor=colors.white, spaceAfter=12))
	styles.add(ParagraphStyle("cover_subtitle", parent=styles["Normal"], fontSize=12, leading=17, textColor=colors.HexColor("#D9F4FA")))
	styles.add(ParagraphStyle("section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=NAVY, spaceBefore=8, spaceAfter=4))
	styles.add(ParagraphStyle("body_small", parent=styles["BodyText"], fontSize=9, leading=13, textColor=INK))
	styles.add(ParagraphStyle("muted", parent=styles["BodyText"], fontSize=8, leading=11, textColor=MUTED))
	styles.add(ParagraphStyle("label", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=MUTED))
	styles.add(ParagraphStyle("card_value", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=NAVY, alignment=1))
	styles.add(ParagraphStyle("table_head", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.white))
	styles.add(ParagraphStyle("table_cell", parent=styles["BodyText"], fontSize=8, leading=11, textColor=INK))

	output = BytesIO()
	doc = SimpleDocTemplate(output, pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=18 * mm, bottomMargin=20 * mm, title="CloudShieldPlus Security Assessment")
	story = []
	account = scan.aws_account
	completed = scan.completed_at or datetime.utcnow()

	cover = Table([
		[Paragraph("CLOUDSHIELDPLUS", styles["label"])],
		[Paragraph("Security Assessment Report", styles["cover"])],
		[Paragraph(f"{_text(account.account_name, 'AWS account')}<br/>{_text(account.aws_account_id)} | {_text(account.region)}<br/>Completed {completed.strftime('%B %d, %Y at %H:%M UTC')}", styles["cover_subtitle"])],
	], colWidths=[174 * mm], rowHeights=[22 * mm, 35 * mm, 32 * mm])
	cover.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY), ("LEFTPADDING", (0, 0), (-1, -1), 14 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 14 * mm), ("TOPPADDING", (0, 0), (-1, -1), 8 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm)]))
	story.extend([cover, Spacer(1, 12), Paragraph("Prepared from the latest completed CloudShieldPlus scan. This report is intended to support security prioritization, remediation planning, and audit readiness.", styles["body_small"])])

	story.extend(_section_title("Executive Summary", styles))
	metrics = Table([
		[_paragraph(len(findings), styles["card_value"]), _paragraph(len(attack_paths), styles["card_value"]), _paragraph(len(recommendations), styles["card_value"]), _paragraph(len(services), styles["card_value"])],
		[_paragraph("Findings", styles["label"]), _paragraph("Attack paths", styles["label"]), _paragraph("Recommendations", styles["label"]), _paragraph("Services", styles["label"])],
	], colWidths=[43.5 * mm] * 4, rowHeights=[14 * mm, 8 * mm])
	metrics.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT), ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7E4EA")), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.white), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
	story.append(metrics)
	story.append(Spacer(1, 8))
	severity_rows = [[_paragraph("Severity", styles["table_head"]), _paragraph("Count", styles["table_head"]), _paragraph("Priority meaning", styles["table_head"])]]
	meanings = {"Critical": "Immediate risk requiring urgent action", "High": "Significant exposure to prioritize", "Medium": "Address in the planned remediation cycle", "Low": "Hygiene improvement and monitoring"}
	for severity in ("Critical", "High", "Medium", "Low"):
		severity_rows.append([_paragraph(severity, styles["table_cell"]), _paragraph(severity_counts.get(severity, 0), styles["table_cell"]), _paragraph(meanings[severity], styles["table_cell"])])
	severity_table = Table(severity_rows, colWidths=[35 * mm, 25 * mm, 114 * mm], repeatRows=1)
	severity_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), BLUE), ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D7E4EA")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
	story.append(severity_table)

	story.extend(_section_title("Security Findings", styles))
	if findings:
		for finding in findings:
			severity = getattr(finding, "severity", "Unknown")
			table = Table([
				[_paragraph(f"{severity} | {_text(finding.title)}", styles["table_head"])],
				[_paragraph(f"Service: {_text(finding.service)} | Resource: {_text(finding.resource)}", styles["muted"])],
				[_paragraph(_text(finding.description), styles["body_small"])],
				[_paragraph(f"Recommendation: {_text(finding.recommendation)}", styles["body_small"])],
			], colWidths=[174 * mm], spaceAfter=7)
			table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), SEVERITY_COLORS.get(severity, BLUE)), ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FBFC")), ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#D7E4EA")), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
			story.append(table)
	else:
		story.append(Paragraph("No security findings were recorded in this scan.", styles["body_small"]))

	story.append(PageBreak())
	story.extend(_section_title("Attack Paths", styles))
	if attack_paths:
		rows = [[_paragraph("Risk", styles["table_head"]), _paragraph("Attack path", styles["table_head"]), _paragraph("Impact and mitigation", styles["table_head"])]]
		for path in attack_paths:
			rows.append([_paragraph(_text(path.risk), styles["table_cell"]), _paragraph(f"{_text(path.attack_id)}: {_text(path.title)}<br/>{_text(path.description)}", styles["table_cell"]), _paragraph(f"Impact: {_text(path.impact)}<br/>Mitigation: {_text(path.mitigation)}", styles["table_cell"])])
		table = Table(rows, colWidths=[25 * mm, 75 * mm, 74 * mm], repeatRows=1)
		table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), BLUE), ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D7E4EA")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FBFC")]), ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
		story.append(table)
	else:
		story.append(Paragraph("No correlated attack paths were identified.", styles["body_small"]))

	story.extend(_section_title("Remediation Recommendations", styles))
	if recommendations:
		rows = [[_paragraph("Priority", styles["table_head"]), _paragraph("Recommendation", styles["table_head"]), _paragraph("Implementation", styles["table_head"])]]
		for rec in recommendations:
			steps = rec.implementation_steps or []
			step_text = "<br/>".join(f"{index + 1}. {_text(step)}" for index, step in enumerate(steps)) or "See recommendation details in the dashboard."
			rows.append([_paragraph(_text(rec.priority), styles["table_cell"]), _paragraph(f"{_text(rec.recommendation_id)}: {_text(rec.title)}<br/>{_text(rec.description)}", styles["table_cell"]), _paragraph(step_text, styles["table_cell"])])
		table = Table(rows, colWidths=[25 * mm, 78 * mm, 71 * mm], repeatRows=1)
		table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), BLUE), ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D7E4EA")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FBFC")]), ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
		story.append(table)
	else:
		story.append(Paragraph("No remediation recommendations were recorded.", styles["body_small"]))

	story.extend(_section_title("Scan Metadata", styles))
	metadata = [[_paragraph("Scan ID", styles["label"]), _paragraph(scan.id, styles["body_small"])], [_paragraph("Status", styles["label"]), _paragraph(scan.status, styles["body_small"])], [_paragraph("Started", styles["label"]), _paragraph(scan.started_at.strftime("%Y-%m-%d %H:%M UTC"), styles["body_small"])], [_paragraph("Duration", styles["label"]), _paragraph(f"{scan.duration:.1f} seconds", styles["body_small"])]]
	metadata_table = Table(metadata, colWidths=[35 * mm, 139 * mm])
	metadata_table.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D7E4EA")), ("BACKGROUND", (0, 0), (0, -1), LIGHT), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
	story.append(metadata_table)
	doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
	output.seek(0)
	return output
