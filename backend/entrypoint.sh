#!/bin/sh

# Exit immediately if any command fails
set -e

echo "=========================================="
# Wait for PostgreSQL to become ready
python -c "
import sys
import time
import psycopg2
import os

db_host = os.getenv('DB_HOST', 'db')
db_port = os.getenv('DB_PORT', '5432')
db_name = os.getenv('DB_NAME', 'cloudshield')
db_user = os.getenv('DB_USER', 'postgres')
db_password = os.getenv('DB_PASSWORD', '')

print('Waiting for PostgreSQL at {}:{}...'.format(db_host, db_port))

for i in range(40):
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password,
            connect_timeout=3
        )
        conn.close()
        print('Connection to PostgreSQL established successfully!')
        sys.exit(0)
    except Exception as e:
        print('Connection attempt {}/40 failed. Retrying...'.format(i + 1))
        time.sleep(2)

print('Timeout: Could not connect to PostgreSQL database.')
sys.exit(1)
"

echo "Running Flask DB upgrade..."
flask db upgrade

echo "Launching application command..."
echo "=========================================="
exec "$@"
