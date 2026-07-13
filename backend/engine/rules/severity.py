# Rule Profiles
# ----------------------------

RULE_PROFILES = {

    # ================= IAM =================

    "IAM001": {
        "business_impact": 10,
        "exploitability": 9,
        "exposure": 6,
        "confidence": 10
    },

    "IAM002": {
        "business_impact": 9,
        "exploitability": 8,
        "exposure": 7,
        "confidence": 10
    },

    "IAM003": {
        "business_impact": 8,
        "exploitability": 8,
        "exposure": 6,
        "confidence": 10
    },

    "IAM004": {
        "business_impact": 7,
        "exploitability": 6,
        "exposure": 5,
        "confidence": 9
    },

    "IAM005": {
        "business_impact": 7,
        "exploitability": 5,
        "exposure": 5,
        "confidence": 10
    },

    # ================= S3 =================

    "S3001": {
        "business_impact": 10,
        "exploitability": 10,
        "exposure": 10,
        "confidence": 10
    },

    "S3002": {
        "business_impact": 6,
        "exploitability": 3,
        "exposure": 2,
        "confidence": 10
    },

    "S3003": {
        "business_impact": 8,
        "exploitability": 7,
        "exposure": 6,
        "confidence": 10
    },

    # ================= EC2 =================

    "EC2001": {
        "business_impact": 9,
        "exploitability": 8,
        "exposure": 9,
        "confidence": 10
    },

    "EC2002": {
        "business_impact": 8,
        "exploitability": 7,
        "exposure": 7,
        "confidence": 10
    },

    # ================= Security Groups =================

    "SG001": {
        "business_impact": 10,
        "exploitability": 10,
        "exposure": 10,
        "confidence": 10
    },

    "SG002": {
        "business_impact": 9,
        "exploitability": 9,
        "exposure": 9,
        "confidence": 10
    },

    # ================= CloudTrail =================

    "CT001": {
        "business_impact": 10,
        "exploitability": 8,
        "exposure": 8,
        "confidence": 10
    },

    "CT002": {
        "business_impact": 8,
        "exploitability": 5,
        "exposure": 4,
        "confidence": 10
    },

    # ================= Password Policy =================

    "PP001": {
        "business_impact": 8,
        "exploitability": 7,
        "exposure": 6,
        "confidence": 10
    }

}


# ----------------------------
# Severity Calculator
# ----------------------------

def calculate_severity(

    business_impact,

    exploitability,

    exposure,

    confidence

):

    score = (

        business_impact * 0.35 +

        exploitability * 0.30 +

        exposure * 0.20 +

        confidence * 0.15

    )

    if score >= 8.5:
        return "Critical"

    elif score >= 6.5:
        return "High"

    elif score >= 4.5:
        return "Medium"

    return "Low"


# ----------------------------
# Rule Lookup
# ----------------------------

def severity_for_rule(rule_id):

    profile = RULE_PROFILES.get(rule_id)

    if profile is None:
        return "Medium"

    return calculate_severity(

        profile["business_impact"],

        profile["exploitability"],

        profile["exposure"],

        profile["confidence"]

    )


# ----------------------------
# Profile Lookup
# ----------------------------

def get_rule_profile(rule_id):

    return RULE_PROFILES.get(rule_id, {})