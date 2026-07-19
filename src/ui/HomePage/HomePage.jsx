import "./HomePage.css";

const featureCards = [
  { title: "AWS Resource Discovery", description: "Map your cloud footprint and identify critical AWS assets across accounts and regions." },
  { title: "Automated Security Assessment", description: "Run structured scans using AWS APIs and ScoutSuite to detect vulnerabilities and misconfigurations." },
  { title: "Cloud Misconfiguration Detection", description: "Highlight insecure S3 buckets, open security groups, weak IAM policies, and exposed services." },
  { title: "Risk Assessment", description: "Prioritize issues by severity so teams can focus on the most important risks first." },
  { title: "Compliance Checking", description: "Evaluate posture against common security and compliance benchmarks with actionable insight." },
  { title: "Interactive Security Dashboard", description: "View trends, scores, alerts, and findings in one centralized experience." },
  { title: "Security Score Calculation", description: "Quantify your posture with a clear score that evolves as your environment changes." },
  { title: "Detailed Recommendations", description: "Turn findings into practical remediation steps that are easy to understand and execute." },
  { title: "Scheduled Monitoring", description: "Set recurring scans to keep track of security posture over time without manual effort." },
  { title: "Report Generation", description: "Create polished reports that summarize findings, risks, and recommended actions." },
  { title: "Historical Scan Tracking", description: "Compare scan results over time to monitor improvements and regressions." },
];

const workflowSteps = [
  "Connect AWS Account",
  "Validate Read-Only Credentials",
  "Discover Cloud Resources",
  "Perform Security Scan",
  "Analyze Risks",
  "Calculate Security Score",
  "Check Compliance",
  "Generate Recommendations",
  "Create Reports",
  "Configure Scheduled Monitoring",
];

const supportedServices = [
  { name: "S3", detail: "Reviews bucket permissions, public access, and encryption posture." },
  { name: "IAM", detail: "Detects privilege misuse, risky policies, and weak identity controls." },
  { name: "CloudTrail", detail: "Validates logging coverage and audit trail readiness." },
  { name: "CloudWatch", detail: "Checks monitoring visibility and alerting posture." },
  { name: "EC2", detail: "Analyzes instance exposure, hardening, and access configuration." },
];

const faqs = [
  { question: "Why are read-only AWS credentials required?", answer: "They allow CloudIntercept to inspect your environment safely without changing any resources." },
  { question: "Does CloudIntercept modify AWS resources?", answer: "No. The platform uses read-only access to assess security posture and generate recommendations." },
  { question: "Is continuous monitoring supported?", answer: "Yes. Scheduled scans can be configured to run automatically at regular intervals." },
  { question: "What reports can be generated?", answer: "You can generate security summaries, vulnerability reports, and remediation-focused compliance views." },
  { question: "Which AWS services are analyzed?", answer: "CloudIntercept evaluates the main AWS services that affect posture, access, network security, and logging." },
  { question: "How often can scheduled scans be configured?", answer: "Scan frequency can be adapted to your workflow, from frequent checks to periodic reviews." },
];

function HomePage({ onLogin, onCreateAccount }) {
  return (
    <div className="home-page">
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="brand-mark">CI</div>
          <div>
            <strong>CloudIntercept</strong>
            <p>Cloud Security Platform</p>
          </div>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#workflow">How It Works</a>
          <a href="#services">Services</a>
          <a href="#faq">FAQ</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <button type="button" className="text-button" onClick={onLogin}>Login</button>
          <button type="button" className="primary-button" onClick={onCreateAccount}>Get Started</button>
        </div>
      </nav>

      <div className="home-shell">
        <section id="home" className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Intelligent Cloud Security Risk Assessment</p>
            <h1>Secure Your AWS Cloud Infrastructure with Intelligent Risk Assessment and Automated Monitoring.</h1>
            <p className="subtitle">
              CloudIntercept helps organizations identify vulnerabilities, misconfigurations, compliance issues, and cloud risks using automated AWS assessments powered by ScoutSuite and AWS APIs.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={onCreateAccount}>Get Started</button>
              <button type="button" className="secondary-button" onClick={onLogin}>Learn More</button>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="orb orb-one"></div>
            <div className="orb orb-two"></div>
            <div className="shield-card">
              <div className="shield-icon">🛡️</div>
              <h3>Cloud Security Overview</h3>
              <p>Continuous visibility for AWS posture and risk.</p>
            </div>
          </div>
        </section>

        <section className="overview-section" id="about">
          <h2>Project Overview</h2>
          <p>
            As organizations increasingly rely on cloud computing, security and compliance have become critical priorities. CloudIntercept automates cloud security assessments, identifies vulnerabilities, evaluates risks, provides actionable recommendations, and generates comprehensive security reports without requiring complex manual analysis.
          </p>
        </section>

        <section className="content-section" id="features">
          <div className="section-heading">
            <p className="eyebrow">Key Features</p>
            <h2>Everything you need to understand and improve your cloud security posture.</h2>
          </div>
          <div className="feature-grid">
            {featureCards.map((feature) => (
              <article key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="workflow">
          <div className="section-heading">
            <p className="eyebrow">How CloudIntercept Works</p>
            <h2>A simple flow from AWS connection to actionable security reporting.</h2>
          </div>
          <div className="workflow-row">
            {workflowSteps.map((step, index) => (
              <div key={step} className="workflow-step">
                <span className="workflow-number">{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section" id="services">
          <div className="section-heading">
            <p className="eyebrow">Supported AWS Services</p>
            <h2>CloudIntercept analyzes the services that most impact your cloud security posture.</h2>
          </div>
          <div className="service-grid">
            {supportedServices.map((service) => (
              <article key={service.name} className="service-card">
                <h3>{service.name}</h3>
                <p>{service.detail}</p>
              </article>
            ))}
          </div>

          <div className="future-scope-box">
            <h3>Future Scope</h3>
            <p>
              The platform will continue expanding to cover more AWS services and deeper security checks as the project grows.
            </p>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">Dashboard Preview</p>
            <h2>See the kind of interface and analytics users get once they are connected.</h2>
          </div>
          <div className="preview-box">
            <div className="preview-panel">
              <h3>Security Score</h3>
              <p>88% posture rating with prioritized findings and compliance insight.</p>
            </div>
            <div className="preview-panel">
              <h3>Risk Distribution</h3>
              <p>Visual summaries make cloud risks easier to understand and act on.</p>
            </div>
            <div className="preview-panel">
              <h3>Scan Timeline</h3>
              <p>Track historical assessments and monitor improvements over time.</p>
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">Why Choose CloudIntercept</p>
            <h2>Reduce manual effort while improving visibility, speed, and confidence.</h2>
          </div>
          <p className="body-text">
            CloudIntercept offers automated assessments, reduced audit time, centralized cloud visibility, simplified compliance evaluation, actionable remediation guidance, scheduled monitoring, and an easy-to-use dashboard for students, researchers, startups, and organizations.
          </p>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">Technology Stack</p>
            <h2>Built with modern tools for accessibility, automation, and scalability.</h2>
          </div>
          <div className="tech-grid">
            {['React.js', 'Python', 'Boto3', 'ScoutSuite', 'PostgreSQL', 'Chart.js', 'Docker'].map((tech) => (
              <div key={tech} className="tech-pill">{tech}</div>
            ))}
          </div>
        </section>

        <section className="content-section" id="faq">
          <div className="section-heading">
            <p className="eyebrow">Frequently Asked Questions</p>
            <h2>Common questions before getting started.</h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question} className="faq-item">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <h2>Start Assessing Your AWS Cloud Security Today</h2>
          <p>Protect your cloud environment with automated assessments, clear reporting, and practical guidance.</p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={onCreateAccount}>Get Started</button>
            <button type="button" className="secondary-button" onClick={onLogin}>Login</button>
          </div>
        </section>
      </div>

      <footer className="footer">
        <div>
          <strong>CloudIntercept</strong>
          <p>Cloud Security Risk Assessment and Scheduled Monitoring Platform</p>
        </div>
        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <a href="#about">About</a>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
