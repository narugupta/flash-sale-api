from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session  
from app.database.session import SessionLocal
from app.models.order import Order  

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()