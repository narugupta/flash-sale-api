import pika
import json
import os
from app.core.config import RABBITMQ_URL, RABBITMQ_HOST

def get_connection():
    if RABBITMQ_URL:
        # CloudAMQP URL format: amqps://user:pass@host/vhost
        params = pika.URLParameters(RABBITMQ_URL)
        params.socket_timeout = 5
        return pika.BlockingConnection(params)
    else:
        return pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST)
        )

def publish_event(queue_name, message):
    connection = get_connection()
    channel = connection.channel()
    channel.queue_declare(queue=queue_name, durable=True)
    channel.basic_publish(
        exchange='',
        routing_key=queue_name,
        body=json.dumps(message),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    connection.close()