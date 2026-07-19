CloudIntercept

«Open-source AWS Cloud Security Risk Assessment and Monitoring Platform»

CloudIntercept is an open-source cloud security platform designed to help organizations assess their AWS security posture through automated resource discovery, rule-based security analysis, and actionable remediation recommendations.

The platform collects security metadata from AWS services, evaluates resources against security best practices, identifies misconfigurations, classifies findings by severity, and presents results through a centralized dashboard.

CloudIntercept is built with scalability in mind, allowing new cloud services and security rules to be integrated with minimal changes to the overall architecture.

---

Overview

Modern cloud environments are dynamic and continuously evolving, making manual security assessments inefficient and error-prone. Misconfigured IAM permissions, missing MFA, excessive privileges, and improperly secured resources can significantly increase an organization's attack surface.

CloudShield+ automates cloud security assessments by combining AWS resource discovery, modular security scanners, a rule evaluation engine, and centralized reporting into a single platform.

---

Key Features

Current Features

- IAM User Discovery
- MFA Status Detection
- Attached Policy Analysis
- Inactive User Detection
- Rule-Based Risk Assessment
- Risk Classification
- Flask REST API
- PostgreSQL Integration

Planned Features

- S3 Security Assessment
- EC2 Security Assessment
- Security Group Analysis
- VPC Assessment
- CloudTrail Analysis
- Compliance Frameworks
- Continuous Monitoring
- Report Generation
- Security Score
- Multi-Cloud Support

---

System Architecture

                        ┌───────────────────────────────┐
                        │        AWS Account            │
                        │───────────────────────────────│
                        │ IAM │ S3 │ EC2 │ SG │ VPC ... │
                        └──────────────┬────────────────┘
                                       │
                              AWS SDK (Boto3)
                                       │
        ┌──────────────────────────────▼──────────────────────────────┐
        │                  CloudShield+ Backend                       │
        │                                                             │
        │  Session Manager                                             │
        │         │                                                    │
        │         ▼                                                    │
        │  Resource Discovery Engine                                   │
        │         │                                                    │
        │         ▼                                                    │
        │  Security Scanner Modules                                    │
        │   • IAM Scanner                                              │
        │   • S3 Scanner (Planned)                                     │
        │   • EC2 Scanner (Planned)                                    │
        │   • Security Groups (Planned)                                │
        │   • CloudTrail (Planned)                                     │
        │                                                             │
        │         ▼                                                    │
        │      Rule Engine                                             │
        │         │                                                    │
        │         ▼                                                    │
        │  Risk Classification Engine                                  │
        │         │                                                    │
        │         ▼                                                    │
        │ Recommendation Generator                                     │
        └──────────────────────┬───────────────────────────────────────┘
                               │
                     PostgreSQL Database
                               │
                               ▼
                    Flask REST API
                               │
                               ▼
                     React Dashboard

---

Security Assessment Workflow

AWS Credentials
        │
        ▼
Create AWS Session
        │
        ▼
Discover AWS Resources
        │
        ▼
Collect Security Metadata
        │
        ▼
Execute Security Rules
        │
        ▼
Generate Findings
        │
        ▼
Assign Risk Severity
        │
        ▼
Generate Recommendations
        │
        ▼
Store Scan Results
        │
        ▼
Display Dashboard

---

Core Components

Component| Description
Session Manager| Creates authenticated AWS sessions using Boto3
Resource Discovery Engine| Discovers supported AWS resources
Scanner Engine| Collects security metadata from AWS
Rule Engine| Evaluates resources against predefined security rules
Risk Classification Engine| Assigns severity to security findings
Recommendation Engine| Generates remediation recommendations
REST API| Exposes backend services to the frontend
PostgreSQL| Stores scan history, findings, and reports
React Dashboard| Displays security posture and findings

---

Technology Stack

Backend

- Python
- Flask
- Boto3
- SQLAlchemy

Frontend

- React
- JavaScript
- HTML5
- CSS3

Database

- PostgreSQL

Cloud Platform

- Amazon Web Services (AWS)

---

Repository Structure

CloudShieldPlus/
│
├── backend/
│   ├── engine/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── reports/
│   ├── app.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── README.md
└── LICENSE

---

Installation

Clone the repository

git clone https://github.com/1029piyush/CloudShieldPlus.git
cd CloudShieldPlus

Create a virtual environment

python -m venv venv

Activate the environment

Windows

venv\Scripts\activate

Linux / macOS

source venv/bin/activate

Install dependencies

pip install -r requirements.txt

---

Running the Backend

python app.py

---

Running the Frontend

cd frontend

npm install

npm start

---

AWS Configuration

CloudShield+ uses AWS credentials configured through the AWS CLI.

Configure credentials using:

aws configure

or export the following environment variables:

AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION

---

Project Roadmap

Phase| Status
IAM Security Assessment| Completed
Rule Engine| Completed
REST API| Completed
PostgreSQL Integration| Completed
React Dashboard| In Progress
Report Generation| Planned
Scheduled Monitoring| Planned
S3 Scanner| Planned
EC2 Scanner| Planned
Security Group Scanner| Planned
CloudTrail Scanner| Planned
Compliance Frameworks| Planned
Multi-Cloud Support| Future

---

Contributing

Contributions are welcome from developers, cloud engineers, and security researchers.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

License

This project is licensed under the MIT License.

---

Author

Piyush Raghorte

GitHub: https://github.com/1029piyush

Repository: https://github.com/1029piyush/CloudShieldPlus
