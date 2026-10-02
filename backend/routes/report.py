from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import AWSAccount, Scan
from reports.pdf_report import build_pdf_report


report_bp = Blueprint("report", __name__)


def _latest_scan_for_user(user_id):
	return (
		Scan.query.join(AWSAccount)
		.filter(AWSAccount.user_id == user_id, Scan.status == "Completed")
		.order_by(Scan.completed_at.desc(), Scan.started_at.desc())
		.first()
	)


@report_bp.route("/reports/pdf", methods=["GET"])
@jwt_required()
def download_report():
	scan = _latest_scan_for_user(int(get_jwt_identity()))
	if not scan:
		return (
			jsonify({
				"success": False,
				"message": "Complete a scan before downloading a report.",
			}),
			404,
		)

	pdf = build_pdf_report(scan)
	filename = f"cloudshield-security-report-scan-{scan.id}.pdf"
	return send_file(
		pdf,
		mimetype="application/pdf",
		as_attachment=True,
		download_name=filename,
		max_age=0,
	)
