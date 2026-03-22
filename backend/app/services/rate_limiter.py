from app.core.redis import redis_client


def is_rate_limited(key, limit=10, window=1):
    key = f"rate_limit:{key}"
    current = redis_client.get(key)
    if current and int(current) >= limit:
        return True

    pipe = redis_client.pipeline()
    pipe.incr(key,1)
    pipe.expire(key, window)
    pipe.execute()

    return False