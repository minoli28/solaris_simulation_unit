# Use official Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
# If you don't have a requirements.txt, we can install directly or create one
# For this project, we know we need fastapi, uvicorn, requests (if used), etc.
RUN pip install fastapi uvicorn[standard] typing-extensions

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
