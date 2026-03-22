from pydantic import BaseModel

class PurchaseRequest(BaseModel):
    user_id: int
    product_id: int