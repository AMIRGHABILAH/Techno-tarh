# Stage 1: Build
FROM python:3.11-slim AS builder

WORKDIR /app

# نصب وابستگی‌های سیستمی برای build
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# کپی و نصب پکیج‌های پایتون
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Final
FROM python:3.11-slim

WORKDIR /app

# نصب وابستگی‌های اجرایی (شامل netcat)
RUN apt-get update && apt-get install -y \
    libjpeg62-turbo \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# کپی پکیج‌های نصب شده از stage قبلی
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# تنظیم mirror
RUN pip config set global.index https://mirror-pypi.runflare.com/simple && \
    pip config set global.index-url https://mirror-pypi.runflare.com/simple && \
    pip config set global.trusted-host mirror-pypi.runflare.com

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
