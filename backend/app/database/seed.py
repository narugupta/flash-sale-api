from app.database.session import SessionLocal
from app.models.product import Product
from app.models.inventory import Inventory

db = SessionLocal()

products = [
    {"name": "iPhone 15", "price": 80000, "quantity": 100000},
    {"name": "Samsung S23", "price": 70000, "quantity": 8},
    {"name": "OnePlus 12", "price": 60000, "quantity": 12},
    {"name": "MacBook Air", "price": 120000, "quantity": 5},
    {"name": "Dell XPS 13", "price": 110000, "quantity": 6},
    {"name": "iPad Pro", "price": 90000, "quantity": 7},
    {"name": "Sony Headphones", "price": 20000, "quantity": 15},
    {"name": "Apple Watch", "price": 35000, "quantity": 9},
]

try:
    for p in products:
        # 🔍 Check if product exists
        product = db.query(Product).filter_by(name=p["name"]).first()

        if product:
            # ✅ UPDATE product
            product.price = p["price"]

            # 🔍 Check inventory
            inventory = db.query(Inventory).filter_by(product_id=product.id).first()

            if inventory:
                # ✅ OVERWRITE quantity
                inventory.quantity = p["quantity"]
            else:
                # ✅ CREATE inventory if missing
                inventory = Inventory(
                    product_id=product.id,
                    quantity=p["quantity"]
                )
                db.add(inventory)

            print(f"♻️ Updated {p['name']}")

        else:
            # ✅ CREATE product
            product = Product(name=p["name"], price=p["price"])
            db.add(product)
            db.flush()  # get product.id

            # ✅ CREATE inventory
            inventory = Inventory(
                product_id=product.id,
                quantity=p["quantity"]
            )
            db.add(inventory)

            print(f"✅ Created {p['name']}")

    db.commit()
    print("🎉 Seeding completed (overwrite mode)")

except Exception as e:
    db.rollback()
    print("Error:", e)

finally:
    db.close()