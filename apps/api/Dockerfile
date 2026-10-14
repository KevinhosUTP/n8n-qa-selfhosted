FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv/app
COPY apps/api/requirements.txt /srv/app/apps/api/requirements.txt
RUN python -m pip install --no-cache-dir -r apps/api/requirements.txt

COPY apps /srv/app/apps
COPY packages /srv/app/packages

RUN useradd --create-home --uid 10001 qaapi
USER qaapi

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)" || exit 1
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
