import pika
import json
import os

def start_consumer(queue_name, callback):
    connection = pika.BlockingConnection(pika.ConnectionParameters(os.getenv("RABBITMQ_HOST", "rabbitmq")))
    channel = connection.channel()
    channel.queue_declare(queue=queue_name)

    def wrapper(ch, method, properties, body):
        message = json.loads(body)
        try:
            callback(message)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print(f"Error processing message: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    channel.basic_consume(queue=queue_name, on_message_callback=wrapper, auto_ack=False)
    

    print(f"Waiting for messages in {queue_name}...")
    channel.start_consuming()