from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime
from io import BytesIO
from database import db
from models import AWSAccount, Scan, FindingModel, AttackPathModel, RecommendationModel

report_bp = Blueprint("report", __name__)

# ── Color palette matching CloudIntercept theme ──────────────────────────────
C_BG        = colors.HexColor("#061426")
C_SURFACE   = colors.HexColor("#0A1F38")
C_ACCENT    = colors.HexColor("#20C4E8")
C_GLOW      = colors.HexColor("#7DE8FF")
C_WHITE     = colors.white
C_MUTED     = colors.HexColor("#A9C3D9")
C_CRITICAL  = colors.HexColor("#EF4444")
C_WARNING   = colors.HexColor("#F59E0B")
C_MEDIUM    = colors.HexColor("#EAB308")
C_LOW       = colors.HexColor("#10B981")
C_BORDER    = colors.HexColor("#1E3A5F")

SEV_COLOR = {
    "Critical": C_CRITICAL,
    "High":     C_WARNING,
    "Medium":   C_MEDIUM,
    "Low":      C_LOW,
}

PRI_COLOR = {
    "Critical": C_CRITICAL,
    "High":     C_WARNING,
    "Medium":   C_MEDIUM,
    "Low":      C_LOW,
}


def _styles():
    base = getSampleStyleSheet()

    def s(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        "title": s("RPT_title",
            fontSize=26, textColor=C_GLOW, fontName="Helvetica-Bold",
            leading=32, alignment=TA_LEFT),
        "subtitle": s("RPT_sub",
            fontSize=12, textColor=C_MUTED, fontName="Helvetica",
            leading=16, alignment=TA_LEFT),
        "h1": s("RPT_h1",
            fontSize=16, textColor=C_GLOW, fontName="Helvetica-Bold",
            leading=22, spaceBefore=14, spaceAfter=6),
        "h2": s("RPT_h2",
            fontSize=13, textColor=C_ACCENT, fontName="Helvetica-Bold",
            leading=18, spaceBefore=10, spaceAfter=4),
        "body": s("RPT_body",
            fontSize=9, textColor=C_MUTED, fontName="Helvetica",
            leading=13, spaceAfter=4),
        "body_white": s("RPT_bw",
            fontSize=9, textColor=C_WHITE, fontName="Helvetica",
            leading=13, spaceAfter=4),
        "small": s("RPT_small",
            fontSize=8, textColor=C_MUTED, fontName="Helvetica",
            leading=11),
        "label": s("RPT_label",
            fontSize=8, textColor=C_ACCENT, fontName="Helvetica-Bold",
            leading=11, spaceAfter=2),
        "mono": s("RPT_mono",
            fontSize=8, textColor=C_GLOW, fontName="Courier",
            leading=11),
        "center": s("RPT_center",
            fontSize=9, textColor=C_MUTED, fontName="Helvetica",
            leading=13, alignment=TA_CENTER),
    }


def _sev_badge_color(severity):
    return SEV_COLOR.get(severity, C_MUTED)


def _security_score(findings):
    if not findings:
        return 100
    c = sum(1 for f in findings if f.severity == "Critical")
    h = sum(1 for f in findings if f.severity == "High")
    m = sum(1 for f in findings if f.severity == "Medium")
    l = sum(1 for f in findings if f.severity == "Low")
    penalty = c * 8 + h * 4 + m * 2 + l * 0.5
    return max(0, round(100 - penalty))


def _on_page(canvas, doc):
    """Header/footer on every page."""
    w, h = A4
    canvas.saveState()

    # Top bar
    canvas.setFillColor(C_SURFACE)
    canvas.rect(0, h - 18*mm, w, 18*mm, fill=1, stroke=0)
    canvas.setFillColor(C_ACCENT)
    canvas.rect(0, h - 18*mm, 4, 18*mm, fill=1, stroke=0)
    canvas.setFillColor(C_GLOW)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(12*mm, h - 11*mm, "CloudIntercept — Security Assessment Report")
    canvas.setFillColor(C_MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 12*mm, h - 11*mm,
        datetime.utcnow().strftime("%Y-%m-%d"))

    # Bottom bar
    canvas.setFillColor(C_SURFACE)
    canvas.rect(0, 0, w, 10*mm, fill=1, stroke=0)
    canvas.setFillColor(C_ACCENT)
    canvas.rect(0, 0, 4, 10*mm, fill=1, stroke=0)
    canvas.setFillColor(C_MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(12*mm, 3.5*mm, "Confidential — CloudIntercept AWS Security Platform")
    canvas.drawRightString(w - 12*mm, 3.5*mm, f"Page {doc.page}")

    canvas.restoreState()


def _build_pdf(scan, account, findings, attack_paths, recommendations):
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=24*mm, bottomMargin=16*mm,
        title="CloudIntercept Security Report",
        author="CloudIntercept Platform",
    )

    st = _styles()
    story = []

    score = _security_score(findings)
    score_color = C_LOW if score >= 80 else (C_WARNING if score >= 60 else C_CRITICAL)
    score_label = "Good" if score >= 80 else ("Fair" if score >= 60 else "Poor")

    c_count = sum(1 for f in findings if f.severity == "Critical")
    h_count = sum(1 for f in findings if f.severity == "High")
    m_count = sum(1 for f in findings if f.severity == "Medium")
    l_count = sum(1 for f in findings if f.severity == "Low")
    affected = len(set(f.resource for f in findings))

    # ── Cover block ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("AWS Cloud Security", st["subtitle"]))
    story.append(Paragraph("Assessment Report", st["title"]))
    story.append(Spacer(1, 2*mm))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceAfter=6))

    # Meta table
    meta = [
        ["Account", account.account_name or "N/A",
         "AWS Account ID", account.aws_account_id],
        ["Region",  account.region,
         "Scan Date", scan.started_at.strftime("%Y-%m-%d %H:%M UTC")],
        ["Scan ID", f"#{scan.id}",
         "Duration", f"{round(scan.duration or 0)}s"],
        ["Status",  scan.status,
         "Platform", "CloudIntercept"],
    ]
    meta_table = Table(meta, colWidths=[28*mm, 52*mm, 35*mm, 52*mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (-1,-1), C_SURFACE),
        ("TEXTCOLOR",   (0,0), (0,-1), C_ACCENT),
        ("TEXTCOLOR",   (2,0), (2,-1), C_ACCENT),
        ("TEXTCOLOR",   (1,0), (1,-1), C_WHITE),
        ("TEXTCOLOR",   (3,0), (3,-1), C_WHITE),
        ("FONTNAME",    (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",    (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTNAME",    (1,0), (1,-1), "Helvetica"),
        ("FONTNAME",    (3,0), (3,-1), "Helvetica"),
        ("FONTSIZE",    (0,0), (-1,-1), 8),
        ("PADDING",     (0,0), (-1,-1), 5),
        ("GRID",        (0,0), (-1,-1), 0.5, C_BORDER),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [C_SURFACE, colors.HexColor("#0D2540")]),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6*mm))

    # ── Executive summary ────────────────────────────────────────────────────
    story.append(Paragraph("Executive Summary", st["h1"]))

    summary_data = [
        ["Security Score", "Total Findings", "Critical", "High", "Medium", "Low", "Attack Paths", "Recommendations"],
        [
            Paragraph(f'<font color="#{score_color.hexval()[1:]}"><b>{score}/100</b> {score_label}</font>', st["center"]),
            Paragraph(f'<b>{len(findings)}</b>', st["center"]),
            Paragraph(f'<font color="#EF4444"><b>{c_count}</b></font>', st["center"]),
            Paragraph(f'<font color="#F59E0B"><b>{h_count}</b></font>', st["center"]),
            Paragraph(f'<font color="#EAB308"><b>{m_count}</b></font>', st["center"]),
            Paragraph(f'<font color="#10B981"><b>{l_count}</b></font>', st["center"]),
            Paragraph(f'<b>{len(attack_paths)}</b>', st["center"]),
            Paragraph(f'<b>{len(recommendations)}</b>', st["center"]),
        ]
    ]
    col_w = [25*mm] * 8
    sum_table = Table(summary_data, colWidths=col_w)
    sum_table.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (-1,0), colors.HexColor("#0D2540")),
        ("BACKGROUND",  (0,1), (-1,1), C_SURFACE),
        ("TEXTCOLOR",   (0,0), (-1,0), C_ACCENT),
        ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,-1), 8),
        ("ALIGN",       (0,0), (-1,-1), "CENTER"),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("PADDING",     (0,0), (-1,-1), 6),
        ("GRID",        (0,0), (-1,-1), 0.5, C_BORDER),
        ("ROWHEIGHT",   (0,1), (-1,1), 18),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 4*mm))

    # Affected resources
    story.append(Paragraph(
        f"This assessment identified <b>{len(findings)}</b> security findings across "
        f"<b>{affected}</b> affected resources in your AWS environment. "
        f"<b>{c_count}</b> critical and <b>{h_count}</b> high severity issues require immediate attention. "
        f"<b>{len(attack_paths)}</b> correlated attack paths show potential exploit chains. "
        f"<b>{len(recommendations)}</b> actionable recommendations have been generated.",
        st["body"]
    ))

    # ── Findings section ─────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Security Findings", st["h1"]))
    story.append(Paragraph(
        f"Detailed breakdown of all {len(findings)} findings discovered during the scan.",
        st["body"]))
    story.append(Spacer(1, 3*mm))

    if not findings:
        story.append(Paragraph("No security findings detected.", st["body"]))
    else:
        # Table header
        headers = ["#", "Severity", "Rule ID", "Title", "Service", "Resource"]
        col_ws  = [8*mm, 18*mm, 22*mm, 55*mm, 18*mm, 46*mm]
        rows = [headers]
        for i, f in enumerate(findings, 1):
            sev_c = _sev_badge_color(f.severity)
            rows.append([
                str(i),
                Paragraph(f'<font color="#{sev_c.hexval()[1:]}"><b>{f.severity}</b></font>', st["small"]),
                Paragraph(f.rule_id or "", st["mono"]),
                Paragraph(f.title or "", st["small"]),
                Paragraph(f.service or "", st["small"]),
                Paragraph(f.resource or "", st["mono"]),
            ])

        ftable = Table(rows, colWidths=col_ws, repeatRows=1)
        ftable.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1,0), colors.HexColor("#0D2540")),
            ("TEXTCOLOR",   (0,0), (-1,0), C_ACCENT),
            ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0), (-1,0), 8),
            ("ALIGN",       (0,0), (-1,-1), "LEFT"),
            ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
            ("PADDING",     (0,0), (-1,-1), 4),
            ("GRID",        (0,0), (-1,-1), 0.4, C_BORDER),
            ("ROWBACKGROUNDS", (1,0), (-1,-1), [C_SURFACE, colors.HexColor("#0D2540")]),
            ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
            ("FONTSIZE",    (0,1), (-1,-1), 7),
        ]))
        story.append(ftable)

        # Detail cards for Critical/High only
        crit_high = [f for f in findings if f.severity in ("Critical", "High")]
        if crit_high:
            story.append(Spacer(1, 5*mm))
            story.append(Paragraph("Critical & High Findings — Detail", st["h1"]))
            for f in crit_high[:20]:  # cap at 20 to keep PDF manageable
                sev_c = _sev_badge_color(f.severity)
                block = []
                block.append(Paragraph(
                    f'<font color="#{sev_c.hexval()[1:]}"><b>[{f.severity}]</b></font>'
                    f' <b>{f.title}</b>',
                    st["h2"]))
                block.append(Paragraph(
                    f'<b>Rule:</b> {f.rule_id}  |  <b>Service:</b> {f.service}  |  '
                    f'<b>Resource:</b> <font name="Courier">{f.resource}</font>',
                    st["small"]))
                if f.description:
                    block.append(Paragraph(f"<b>Description:</b> {f.description}", st["body"]))
                if f.business_impact:
                    block.append(Paragraph(f"<b>Business Impact:</b> {f.business_impact}", st["body"]))
                if f.recommendation:
                    block.append(Paragraph(f"<b>Recommendation:</b> {f.recommendation}", st["body"]))
                block.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
                story.append(KeepTogether(block))

    # ── Attack Paths ─────────────────────────────────────────────────────────
    if attack_paths:
        story.append(PageBreak())
        story.append(Paragraph("Attack Paths", st["h1"]))
        story.append(Paragraph(
            f"{len(attack_paths)} correlated exploit chains identified.",
            st["body"]))
        story.append(Spacer(1, 3*mm))

        for ap in attack_paths:
            risk_c = PRI_COLOR.get(ap.risk, C_MUTED)
            block = []
            block.append(Paragraph(
                f'<font color="#{risk_c.hexval()[1:]}"><b>[{ap.risk} RISK]</b></font>'
                f' <b>{ap.title}</b>',
                st["h2"]))
            block.append(Paragraph(
                f'<b>ID:</b> <font name="Courier">{ap.attack_id}</font>  |  '
                f'<b>Likelihood:</b> {ap.likelihood}  |  <b>Impact:</b> {ap.impact}',
                st["small"]))
            if ap.description:
                block.append(Paragraph(ap.description, st["body"]))
            if ap.affected_resources:
                res_str = ", ".join(ap.affected_resources[:5])
                block.append(Paragraph(f"<b>Affected Resources:</b> {res_str}", st["small"]))
            if ap.mitigation:
                block.append(Paragraph(f"<b>Mitigation:</b> {ap.mitigation}", st["body"]))
            block.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
            story.append(KeepTogether(block))

    # ── Recommendations ──────────────────────────────────────────────────────
    if recommendations:
        story.append(PageBreak())
        story.append(Paragraph("Remediation Recommendations", st["h1"]))
        story.append(Paragraph(
            f"{len(recommendations)} prioritized recommendations to improve your security posture.",
            st["body"]))
        story.append(Spacer(1, 3*mm))

        for rec in recommendations:
            pri_c = PRI_COLOR.get(rec.priority, C_MUTED)
            block = []
            block.append(Paragraph(
                f'<font color="#{pri_c.hexval()[1:]}"><b>[{rec.priority}]</b></font>'
                f' <b>{rec.title}</b>',
                st["h2"]))
            block.append(Paragraph(
                f'<b>Category:</b> {rec.category}  |  '
                f'<b>Effort:</b> {rec.estimated_effort}  |  '
                f'<b>Risk Reduction:</b> {rec.expected_risk_reduction}',
                st["small"]))
            if rec.description:
                block.append(Paragraph(rec.description, st["body"]))
            if rec.implementation_steps:
                steps = rec.implementation_steps
                if isinstance(steps, list):
                    for j, step in enumerate(steps[:5], 1):
                        s_text = step if isinstance(step, str) else step.get("description", "")
                        block.append(Paragraph(f"  {j}. {s_text}", st["body"]))
            if rec.auto_fix_supported:
                block.append(Paragraph(
                    '<font color="#10B981"><b>✓ Auto-fix supported</b></font>',
                    st["small"]))
            block.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
            story.append(KeepTogether(block))

    # Build
    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    buf.seek(0)
    return buf


@report_bp.route("/reports", methods=["GET"])
@jwt_required()
def list_reports():
    """List all completed scans available for report download."""
    user_id = int(get_jwt_identity())
    aws_account_id = request.args.get("aws_account_id")

    accounts = AWSAccount.query.filter_by(user_id=user_id).all()
    account_ids = [a.id for a in accounts]
    if not account_ids:
        return jsonify({"success": True, "reports": []}), 200

    query = Scan.query.filter(
        Scan.aws_account_id.in_(account_ids),
        Scan.status == "Completed"
    )
    if aws_account_id:
        query = query.filter(Scan.aws_account_id == int(aws_account_id))

    scans = query.order_by(Scan.started_at.desc()).all()
    reports = []
    for s in scans:
        reports.append({
            "scan_id": s.id,
            "account_name": s.aws_account.account_name,
            "aws_account_id": s.aws_account.aws_account_id,
            "region": s.aws_account.region,
            "scan_date": s.started_at.isoformat(),
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "duration": s.duration,
            "findings_count": len(s.findings),
            "critical_count": sum(1 for f in s.findings if f.severity == "Critical"),
            "attack_paths_count": len(s.attack_paths),
            "recommendations_count": len(s.recommendations),
        })
    return jsonify({"success": True, "reports": reports}), 200


@report_bp.route("/reports/pdf/<int:scan_id>", methods=["GET"])
@jwt_required()
def download_report(scan_id):
    """Generate and stream a PDF report for a specific scan."""
    user_id = int(get_jwt_identity())

    scan = Scan.query.get(scan_id)
    if not scan or scan.aws_account.user_id != user_id:
        return jsonify({"success": False, "message": "Scan not found or access denied."}), 404

    if scan.status != "Completed":
        return jsonify({"success": False, "message": "Scan is not yet completed."}), 400

    account  = scan.aws_account
    findings = scan.findings
    attack_paths    = scan.attack_paths
    recommendations = scan.recommendations

    pdf_buf = _build_pdf(scan, account, findings, attack_paths, recommendations)

    filename = f"cloudintercept-report-{account.account_name or scan_id}-{scan.started_at.strftime('%Y%m%d')}.pdf"
    filename = filename.replace(" ", "_").lower()

    response = make_response(pdf_buf.read())
    response.headers["Content-Type"]        = "application/pdf"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response


@report_bp.route("/reports/pdf", methods=["GET"])
@jwt_required()
def download_latest_report():
    """Download PDF for the most recent completed scan."""
    user_id = int(get_jwt_identity())
    aws_account_id = request.args.get("aws_account_id")

    accounts = AWSAccount.query.filter_by(user_id=user_id).all()
    account_ids = [a.id for a in accounts]
    if not account_ids:
        return jsonify({"success": False, "message": "No AWS accounts found."}), 404

    query = Scan.query.filter(
        Scan.aws_account_id.in_(account_ids),
        Scan.status == "Completed"
    )
    if aws_account_id:
        query = query.filter(Scan.aws_account_id == int(aws_account_id))

    scan = query.order_by(Scan.started_at.desc()).first()
    if not scan:
        return jsonify({"success": False, "message": "No completed scans found."}), 404

    return download_report(scan.id)
