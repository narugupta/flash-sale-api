from app.core.redis import redis_client

def check_idempotency(key):
    return redis_client.get(key)

def save_idempotency(key, value):
    redis_client.set(key, value, ex=300)  # Set expiration time to 5 minutes

