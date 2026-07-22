# ==========================================
# CloudShieldPlus - Flask Backend Dockerfile
# ==========================================

# 1. Use the official lightweight Python 3.12 slim image as the base
FROM python:3.12-slim

# Install curl for health checking, cleaning up apt cache to keep image small
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Set environment variables to prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory inside the container to /app
WORKDIR /app

# 4. Copy the requirements file first to take full advantage of Docker layer caching
COPY requirements.txt .

# 5. Install dependencies without downloading binary cache files to keep image size small
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of the backend source code files into the container
COPY . .

# 7. Expose port 5000 to allow inbound network traffic to the Flask application
EXPOSE 5000

# 8. Start the WSGI server using Gunicorn in production mode
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
