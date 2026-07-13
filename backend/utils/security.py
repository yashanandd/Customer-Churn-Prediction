import hashlib
import secrets
import base64
import hmac
import datetime
import os
from typing import Optional

SECRET_KEY = os.environ.get("JWT_SECRET", "churn_prediction_secret_key_1234567890")

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-SHA256 with a random salt."""
    salt = secrets.token_hex(16)
    hash_val = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000  # 100k iterations
    )
    hash_base64 = base64.b64encode(hash_val).decode('utf-8')
    return f"pbkdf2_sha256:100000${salt}${hash_base64}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password hash."""
    try:
        parts = hashed_password.split('$')
        if len(parts) != 3:
            return False
        algo_iter, salt, hash_base64 = parts
        iterations = int(algo_iter.split(':')[1]) if ':' in algo_iter else 100000
        
        hash_val = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        expected_base64 = base64.b64encode(hash_val).decode('utf-8')
        return hmac.compare_digest(hash_base64, expected_base64)
    except Exception:
        return False

def generate_token(user_id: int, expires_in_days: int = 7) -> str:
    """Generate a signed secure base64 token containing user_id and expiry timestamp."""
    expiry = (datetime.datetime.utcnow() + datetime.timedelta(days=expires_in_days)).timestamp()
    payload = f"{user_id}:{expiry}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    
    # URL safe base64 encoding without padding
    payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode().rstrip('=')
    return f"{payload_b64}.{sig}"

def verify_token(token: str) -> Optional[int]:
    """Verify token signature and expiry. Returns user_id if valid."""
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        payload_b64, sig = parts
        
        # Restore base64 padding
        rem = len(payload_b64) % 4
        if rem > 0:
            payload_b64 += '=' * (4 - rem)
            
        payload = base64.urlsafe_b64decode(payload_b64.encode()).decode()
        
        # Verify HMAC signature
        expected_sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
            
        user_id_str, expiry_str = payload.split(':')
        expiry = float(expiry_str)
        
        # Check expiry
        if datetime.datetime.utcnow().timestamp() > expiry:
            return None
            
        return int(user_id_str)
    except Exception:
        return None
