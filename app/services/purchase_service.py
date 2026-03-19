from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.inventory import Inventory
from app.models.order import Order
import time
from app.core.redis import redis_client

def acquire_lock(lock_key, timeout=5):
    return redis_client.set(lock_key, "locked", nx=True, ex=timeout)

def release_lock(lock_key):
    redis_client.delete(lock_key)

def purchase_product(db: Session, user_id: int, product_id: int):

    lock_key = f"lock:product:{product_id}"

    if not acquire_lock(lock_key):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

    try:
        inventory = (
            db.query(Inventory)
            .filter(Inventory.product_id == product_id)
            .with_for_update()
            .first()
        )

        if not inventory:
            raise HTTPException(status_code=404, detail="Product not found")

        if inventory.quantity <= 0:
            raise HTTPException(status_code=400, detail="Product out of stock")

        inventory.quantity -= 1

        order = Order(
            user_id=user_id,
            product_id=product_id
        )

        db.add(order)
        db.commit()

        return order

    finally:
        release_lock(lock_key)