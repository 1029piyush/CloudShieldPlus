# backend/services/session_manager.py

aws_session = None


def set_session(session):
    global aws_session
    aws_session = session


def get_session():
    return aws_session


def clear_session():
    global aws_session
    aws_session = None