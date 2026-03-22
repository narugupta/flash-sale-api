import pika
import json
import os
from app.core.config import RABBITMQ_URL, RABBITMQ_HOST

def get_connection():
    if RABBITMQ_URL:
        params = pika.URLParameters(RABBITMQ_URL)
        params.socket_timeout = 5
        return pika.BlockingConnection(params)
    else:
        return pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST)
        )

def start_consumer(queue_name, callback):
    connection = get_connection()
    channel = connection.channel()
    channel.queue_declare(queue=queue_name, durable=True)

    def wrapper(ch, method, properties, body):
        message = json.loads(body)
        try:
            callback(message)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print(f"Error processing message: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=wrapper, auto_ack=False)
    print(f"Waiting for messages in {queue_name}...")
    channel.start_consuming()