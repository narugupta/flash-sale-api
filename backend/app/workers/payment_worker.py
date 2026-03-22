import random, pika, time, threading, requests
from app.messaging.consumer import start_consumer
from app.database.session import SessionLocal
from app.models.order import Order
from app.models.inventory import Inventory
from app.models.product import Product
from prometheus_client import start_http_server
from app.monitoring.metrics import ORDER_PROCESSED_TOTAL, ORDER_PAYMENT_SUCCESS_TOTAL, ORDER_PAYMENT_FAILURE_TOTAL, QUEUE_DEPTH

def get_queue_depth():
    url = "http://guest:guest@rabbitmq:15672/api/queues/%2F/order_Created"

    try:
        res = requests.get(url)
        data = res.json()

        ready = data["messages_ready"]
        unacked = data["messages_unacknowledged"]

        return ready + unacked  # 🔥 TOTAL LOAD

    except Exception as e:
        print("Queue depth error:", e)
        return 0
    
def update_queue_depth():
    while True:
        depth = get_queue_depth()
        QUEUE_DEPTH.set(depth)
        # time.sleep(5)

def process_payment(message):
    db = SessionLocal() 
    order_id = message.get("order_id")
    order = db.query(Order).filter(Order.id ==order_id).first()
    if not order:
        print(f"Order {order_id} not found")
        db.close()
        return
    
    # time.sleep(5)
    # Simulate payment Success/Failure
    success = random.choice([True, False])
    print(f"Payment result for order {order_id}: {success}")

    if success:
        order.status = "CONFIRMED"
        print(f"Order {order_id} payment successful")
        ORDER_PAYMENT_SUCCESS_TOTAL.inc()
    else: 
        order.status = "FAILED"
        inventory = db.query(Inventory).filter(Inventory.product_id == order.product_id).first()
        ORDER_PAYMENT_FAILURE_TOTAL.inc()
        if inventory:
            inventory.quantity += 1
            print(f"Order {order_id} payment failed, inventory rolled back")


    # depth = get_queue_depth()
    # QUEUE_DEPTH.set(depth)  # Simulate queue depth for monitoring
    db.commit()
    ORDER_PROCESSED_TOTAL.inc()
    db.close()


start_http_server(8001)

if __name__ == "__main__":
    print("🚀 Worker started")
    print("📊 Metrics → http://localhost:8001")

    # 🔥 Start background queue monitor
    threading.Thread(target=update_queue_depth, daemon=True).start()
    start_consumer("order_Created", process_payment)