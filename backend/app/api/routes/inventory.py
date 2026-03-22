from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.inventory import Inventory

router = APIRouter()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/inventory")
def get_inventory(product_id: int, db: Session = Depends(get_db)):
    inv = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).first()

    return {"stock": inv.quantity}