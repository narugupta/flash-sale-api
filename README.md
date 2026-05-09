# FlashScale — High-Concurrency Flash Sale System

FlashScale is a distributed high-concurrency flash-sale platform designed to simulate real-world e-commerce traffic spikes and inventory contention scenarios. The system ensures strong consistency under heavy load using PostgreSQL row-level locking, Redis distributed locks, asynchronous order processing with RabbitMQ, and Saga-inspired transaction handling.

The project was stress-tested with up to **1000 concurrent users**, sustaining approximately **130 RPS** while preventing inventory overselling.

---

# Features

* High-concurrency flash-sale architecture
* PostgreSQL row-level locking (`SELECT ... FOR UPDATE`)
* Redis distributed locking
* RabbitMQ asynchronous order processing
* Saga-inspired transaction workflow
* Idempotent checkout handling
* Prometheus metrics collection
* Grafana monitoring dashboards
* Locust load testing
* Fully Dockerized microservice-style setup
* Next.js frontend dashboard

---

# System Architecture

```text
                        +----------------+
                        |    Frontend    |
                        |    Next.js     |
                        +--------+-------+
                                 |
                                 v
                        +----------------+
                        |   FastAPI API  |
                        +--------+-------+
                                 |
                +----------------+----------------+
                |                                 |
                v                                 v
       +----------------+               +----------------+
       | PostgreSQL DB  |               |     Redis      |
       | Inventory Data |               | Distributed    |
       | Row Locking    |               | Locks          |
       +----------------+               +----------------+
                                 |
                                 v
                        +----------------+
                        |   RabbitMQ     |
                        | Async Queue    |
                        +--------+-------+
                                 |
                                 v
                        +----------------+
                        | Payment Worker |
                        | Order Handling |
                        +----------------+
                                 |
                                 v
                        +----------------+
                        | Prometheus     |
                        | Metrics        |
                        +--------+-------+
                                 |
                                 v
                        +----------------+
                        | Grafana        |
                        | Dashboards     |
                        +----------------+
```

---

# Tech Stack

## Backend

* Python
* FastAPI
* SQLAlchemy

## Database

* PostgreSQL

## Distributed Systems

* Redis
* RabbitMQ

## Frontend

* Next.js
* Axios

## Observability

* Prometheus
* Grafana

## Load Testing

* Locust

## DevOps

* Docker
* Docker Compose

---

# Load Testing Results

The system was stress-tested using Locust with concurrent traffic spikes.

| Metric             | Result                       |
| ------------------ | ---------------------------- |
| Concurrent Users   | 1000+                        |
| Peak Throughput    | ~130 RPS                     |
| Median Latency     | ~120–300 ms                  |
| Architecture       | Queue-Based Async Processing |
| Inventory Oversell | Prevented                    |

---

# Concurrency Control Strategy

FlashScale prevents overselling using a layered concurrency strategy:

## 1. PostgreSQL Row-Level Locking

```sql
SELECT * FROM inventory
WHERE product_id = :id
FOR UPDATE;
```

Ensures only one transaction modifies inventory at a time.

---

## 2. Redis Distributed Locks

Prevents concurrent checkout races across distributed workers.

---

## 3. RabbitMQ Queue Buffering

Incoming requests are buffered asynchronously during traffic spikes.

---

## 4. Idempotent Order Handling

Duplicate payment/order processing is safely ignored.

---

# Monitoring & Observability

The platform includes real-time monitoring dashboards using Prometheus and Grafana.

## Tracked Metrics

* Requests per second (RPS)
* API latency
* Queue depth
* Orders processed
* Payment success/failure
* Throughput under load

---

# Load Testing

Run Locust:

```bash
locust -f locustfile.py
```

Open:

```text
http://localhost:8089
```

Example stress test:

```text
Users: 1000
Spawn Rate: 100/sec
```

---

# Dockerized Deployment

The entire stack is containerized using Docker Compose.

## Services

* FastAPI Backend
* RabbitMQ Worker
* PostgreSQL
* Redis
* RabbitMQ
* Prometheus
* Grafana
* Next.js Frontend

---

# Quick Start

## 1. Clone Repository

```bash
git clone https://github.com/narugupta/flash-sale-api.git
cd flash-sale-api
```

---

## 2. Start Containers

```bash
docker compose up --build
```

---

## 3. Seed Database

```bash
docker exec -it flashsale_backend python -m app.database.seed
```

---

# Service URLs

| Service            | URL                                                      |
| ------------------ | -------------------------------------------------------- |
| Frontend           | [http://localhost:3000](http://localhost:3000)           |
| Backend API        | [http://localhost:8000](http://localhost:8000)           |
| Swagger Docs       | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Prometheus         | [http://localhost:9090](http://localhost:9090)           |
| Grafana            | [http://localhost:3001](http://localhost:3001)           |
| RabbitMQ Dashboard | [http://localhost:15672](http://localhost:15672)         |
| Locust             | [http://localhost:8089](http://localhost:8089)           |

---

# Project Structure

```text
flash-sale-api/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── database/
│   │   ├── messaging/
│   │   ├── models/
│   │   ├── services/
│   │   ├── workers/
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── prometheus.yml
└── README.md
```

---

# Engineering Challenges Solved

## High Inventory Contention

Handled concurrent purchase attempts using database row locking and distributed locking.

## Queue Backpressure

Buffered bursts of traffic using RabbitMQ asynchronous queues.

## Consistency vs Latency Tradeoff

Prioritized strong consistency under extreme concurrency to avoid inventory overselling.

## Observability

Implemented real-time monitoring to analyze throughput, latency, and queue behavior.

---

# Future Improvements

* Kubernetes deployment
* CI/CD pipeline
* Auto-scaling workers
* WebSocket-based real-time updates
* Rate limiting
* Distributed tracing
* NGINX reverse proxy

---

# Author

Narendra Kumar Gupta

* GitHub: [https://github.com/narugupta](https://github.com/narugupta)
* LinkedIn: [https://www.linkedin.com](https://www.linkedin.com)

---

# Highlights

* Distributed systems architecture
* High-concurrency engineering
* Queue-based asynchronous processing
* Production-style observability
* Dockerized deployment
* Real-world load testing
