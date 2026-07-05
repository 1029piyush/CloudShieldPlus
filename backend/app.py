from flask import Flask
from flask_cors import CORS

# Import Blueprints
from routes.auth import auth_bp
from routes.scan import scan_bp

# Create Flask App
app = Flask(__name__)

# Enable CORS for React Frontend
CORS(app)

# Register API Routes
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(scan_bp, url_prefix="/api")

# Home Route
@app.route("/")
def home():
    return {
        "success": True,
        "message": "CloudShield+ Backend Running",
        "version": "1.0"
    }

# Health Check Route
@app.route("/health")
def health():
    return {
        "status": "Healthy"
    }

# Run Server
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )