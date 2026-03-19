from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.services.purchase_service import purchase_product
from app.api.schemas.purchase import PurchaseRequest
from fastapi import Header
from app.services.idempotency import check_idempotency, save_idempotency
from app.services.rate_limiter import is_rate_limited
from fastapi import HTTPException

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/purchase")
def purchase(request: PurchaseRequest, db: Session = Depends(get_db), idempotency_key: str = Header(None, alias="Idempotency-Key")):
        # Step 1: Rate limit FIRST
    if is_rate_limited(request.user_id):
        # raise Exception("Rate limit exceeded. Please try again later.")
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")
       # Step 2: Idempotency check
    if idempotency_key:
        existing = check_idempotency(idempotency_key)
        if existing:
            return {"order_id": existing, "message": "Purchase successful (idempotent response)"}
        
        # Step 3: Process purchase
    order = purchase_product(
        db,
        user_id=request.user_id,
        product_id=request.product_id
    )

        # Step 4: Save idempotency
    if idempotency_key:
        save_idempotency(idempotency_key, order.id)

    return {"order_id": order.id, "message": "Purchase successful"}