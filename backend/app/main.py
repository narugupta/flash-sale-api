from fastapi import FastAPI, requests
import time
from app.database.base import Base
from app.database.session import engine
from app.api.routes.purchase import router as purchase_router
from app.api.routes.product import router as product_router
from app.api.routes.inventory import router as inventory_router
from app.api.routes.order import router as order_router
from app.monitoring.metrics import REQUEST_COUNT, REQUEST_LATENCY
from prometheus_client import generate_latest
from fastapi.responses import Response

from app.models.product import Product
from app.models.inventory import Inventory  
from app.models.order import Order

from fastapi.middleware.cors import CORSMiddleware

# ✅ FIRST create app
app = FastAPI()

# ✅ THEN add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (for dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def metrics_middleware(request: requests.Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    REQUEST_COUNT.inc()
    REQUEST_LATENCY.observe(duration)
    return response

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Flash Sale API running"}

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type="text/plain")

app.include_router(purchase_router)
app.include_router(product_router)
app.include_router(inventory_router)
app.include_router(order_router)