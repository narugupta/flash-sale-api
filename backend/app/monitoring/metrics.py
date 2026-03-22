from prometheus_client import Counter, Histogram, Gauge

# Define Prometheus metrics
#Counter(name, description)
REQUEST_COUNT = Counter("http_requests_total", "Total number of HTTP requests" )

#Histogram(name, description)
REQUEST_LATENCY = Histogram("http_request_latency_seconds", "Latency of HTTP requests in seconds")

ORDER_PROCESSED_TOTAL = Counter("orders_processed_total", "Total number of orders processed")

ORDER_PAYMENT_SUCCESS_TOTAL = Counter("order_payment_success_total", "Total number of successful order payments")   

ORDER_PAYMENT_FAILURE_TOTAL = Counter("order_payment_failure_total", "Total number of failed order payments")  

QUEUE_DEPTH = Gauge("rabbitmq_queue_depth", "Number of messages in RabbitMQ queue")