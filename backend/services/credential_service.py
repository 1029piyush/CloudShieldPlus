from cryptography.fernet import Fernet
import config


def _get_fernet():
    # Use the dedicated FERNET_KEY from config
    return Fernet(config.FERNET_KEY.encode("utf-8"))


def encrypt_credentials(access_key, secret_key):
    """Encrypt credentials and return credential_type and credential_reference."""
    f = _get_fernet()
    plaintext = f"{access_key}:{secret_key}".encode("utf-8")
    encrypted = f.encrypt(plaintext).decode("utf-8")
    return "encrypted_keys", encrypted


def decrypt_credentials(credential_type, credential_reference):
    """Decrypt credential_reference based on credential_type."""
    if credential_type != "encrypted_keys":
        raise ValueError(f"Unsupported credential type: {credential_type}")
    f = _get_fernet()
    decrypted = f.decrypt(credential_reference.encode("utf-8")).decode("utf-8")
    access_key, secret_key = decrypted.split(":", 1)
    return access_key, secret_key
