import uuid
from locust import HttpUser, task, between
import random


class FlashSaleUser(HttpUser):
    host = "http://localhost:8000"
    wait_time = between(1, 2)

    @task
    def buy_product(self):
        self.client.post(
            "/purchase",
            json={
                "user_id": random.randint(1, 10000),
                "product_id": 1
            },
            headers={
                "Idempotency-Key": str(uuid.uuid4())  # 🔥 unique key
            }
        )