import os
from google.oauth2 import id_token
from google.auth.transport import requests

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "870630654060-p427495s5r1fub6v54qsk8hfl8lphg7c.apps.googleusercontent.com"
)

def verify_google_token(token_id):
    """
    Verifies the integrity and authenticity of a Google ID Token.
    Validates audience, issuer, and expiration using Google's official library.
    """
    try:
        # Verify OAuth ID Token
        id_info = id_token.verify_oauth2_token(
            token_id, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Verify Issuer is Google
        if id_info.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValueError("Invalid issuer.")
            
        return id_info
    except Exception as e:
        print(f"Google Token Verification Failed: {e}")
        return None
