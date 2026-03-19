from fastapi import FastAPI
from app.database.base import Base
from app.database.session import engine
from app.api.routes.purchase import router as purchase_router

from app.models.product import Product
from app.models.inventory import Inventory  
from app.models.order import Order

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Flash Sale API running"}

app.include_router(purchase_router)