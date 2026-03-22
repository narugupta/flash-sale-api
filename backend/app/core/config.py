import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin:admin@db:5432/flashsale"
)

REDIS_URL = os.getenv("REDIS_URL", None)
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

RABBITMQ_URL = os.getenv("RABBITMQ_URL", None)
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")