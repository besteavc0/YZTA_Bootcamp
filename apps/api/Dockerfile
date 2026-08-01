FROM python:3.12-slim

WORKDIR /app

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir --default-timeout=120 --retries 10 -r requirements.txt

COPY apps/api/app /app/app
COPY connectors /app/connectors
COPY workers /app/workers

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]