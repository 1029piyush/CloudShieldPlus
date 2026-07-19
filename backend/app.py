from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from database import db
import config

# Import Blueprints
from routes.auth import auth_bp
from routes.scan import scan_bp

# Create Flask App
app = Flask(__name__)

# Apply Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = config.SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = config.JWT_SECRET_KEY
app.config["SECRET_KEY"] = config.SECRET_KEY

# Enable CORS for React Frontend
CORS(app)

# Initialize Extensions
db.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

# Register API Routes
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(scan_bp, url_prefix="/api")


# Home Route
@app.route("/")
def home():
    return {
        "success": True,
        "message": "CloudIntercept Backend Running",
        "version": "1.0",
    }


# Health Check Route
@app.route("/health")
def health():
    return {"status": "Healthy"}


# Run Server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)