import redis
import os
from app.core.config import REDIS_URL, REDIS_HOST, REDIS_PORT
 
if REDIS_URL:
    # Upstash / Railway Redis URL format
    redis_client = redis.from_url(
        REDIS_URL,
        decode_responses=True,
        ssl=REDIS_URL.startswith("rediss://")
    )
else:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=0,
        decode_responses=True
    )