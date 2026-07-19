import psycopg2
from config import DB_CONFIG
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def get_connection():
    return psycopg2.connect(**DB_CONFIG)