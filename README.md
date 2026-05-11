# FlashScale — High-Concurrency Flash Sale System

FlashScale is a distributed high-concurrency platform designed to simulate real-world e-commerce traffic spikes and inventory contention. The system maintains strong consistency under sustained load using PostgreSQL row-level locking, Redis distributed locks, asynchronous order processing via RabbitMQ, and a Saga-inspired transaction workflow.

Tested across multiple load profiles up to 1000 concurrent users, peaking at 136 RPS, with zero inventory overselling. Deployed and verified on AWS EC2.

---

## Why This Problem Is Interesting

High-concurrency reservation and checkout systems share a common set of hard problems: simultaneous competing requests from multiple channels, inventory races, async fulfilment pipelines, and the need for real-time operational visibility.

Flash sale systems and multi-channel booking platforms face structurally identical engineering challenges. The mapping is direct:

| FlashScale Component | Booking Platform Equivalent |
|---|---|
| Redis distributed locks | Preventing double-bookings across concurrent OTA channels |
| RabbitMQ async queue | Unified inbox buffering from multiple inbound sources |
| PostgreSQL row-level locking | Atomic availability updates under concurrent writes |
| Saga-inspired transactions | Multi-step booking → payment → confirmation workflows |
| Idempotent order handling | Duplicate webhook deduplication from external platforms |
| Prometheus + Grafana | Operational dashboards and revenue analytics pipelines |

This project explores one of the core infrastructure challenges in that space — maintaining consistency under concurrent multi-channel activity — and implements a layered architectural response to it.

---

## System Architecture

```
                   +----------------+
                   |    Frontend    |
                   |    Next.js     |
                   +-------+--------+
                           |
                           v
                   +----------------+
                   |   FastAPI API  |
                   +-------+--------+
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
 +-------+--------+
         |
         v
 +----------------+
 | Payment Worker |
 | Order Handling |
 +-------+--------+
         |
         v
 +----------------+
 | Prometheus +   |
 | Grafana        |
 +----------------+
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Distributed Systems | Redis, RabbitMQ 3.13.7 |
| Frontend | Next.js, Axios |
| Observability | Prometheus, Grafana |
| Load Testing | Locust |
| DevOps | Docker, Docker Compose |
| Cloud | AWS EC2 |

---

## Load Testing Results

Load tests were run in two configurations. Local tests used Docker Compose on a single host — FastAPI on port 8000, a single RabbitMQ broker node, single payment worker on port 8001, and default PostgreSQL configuration, with Locust on the same machine. The full stack was also deployed to AWS EC2 and verified under load.

### Test Run 1 — 500 Users / 50 spawn rate

| Metric | Result |
|---|---|
| Concurrent Users | 500 |
| Spawn Rate | 50 users/sec |
| Peak RPS (Grafana) | ~115 |
| Sustained RPS | ~100–115 |
| Median Latency (Locust) | 50 ms |
| p95 Latency (Locust) | 140 ms |
| p99 Latency (Locust) | 2,200 ms |
| API Latency Steady State (Grafana) | ~300–350 ms |
| Total Requests | 6,591 |
| Application-Level Rejections | 5,356 (81%) |
| Successful Orders Processed | ~800 |
| Inventory Oversell | Zero |

### Test Run 2 — 1000 Users / 100 spawn rate

| Metric | Result |
|---|---|
| Concurrent Users | 1000 |
| Spawn Rate | 100 users/sec |
| Peak RPS (Grafana) | ~136 |
| Sustained RPS | ~80–135 (variable — see Engineering Notes) |
| API Latency Steady State (Grafana) | ~790–870 ms |
| Total Requests | ~27,000 |
| Successful Orders Processed | ~660 |
| Inventory Oversell | Zero |

**On the application-level rejection rate:** the majority of Locust "failures" are HTTP 409/400 responses — correct sold-out rejections, not crashes. Under a flash sale model, most concurrent purchase attempts are expected to fail once inventory is exhausted. The system rejected them cleanly and consistently.

---

## Concurrency Control Strategy

### 1. PostgreSQL Row-Level Locking

```sql
SELECT * FROM inventory
WHERE product_id = :id
FOR UPDATE;
```

Ensures only one transaction modifies a given inventory row at a time, preventing silent race conditions at the database level.

### 2. Redis Distributed Locks

Coordinates competing checkout attempts across distributed workers before they reach the database — an outer gate before the inner lock.

### 3. RabbitMQ Queue Buffering

Traffic spikes are buffered asynchronously to reduce request loss and stabilize processing during bursts. In practice across all test runs, queue depth stayed near zero — brief spikes to 1, clearing immediately. The actual bottleneck was at the PostgreSQL lock layer, not the queue.

### 4. Saga-Inspired Transaction Workflow

Multi-step flows — reserve inventory, initiate payment, confirm order, rollback on failure — are handled with explicit compensating transactions. No silent partial commits.

### 5. Idempotent Order Handling

Duplicate events, retried webhooks, and replayed messages are safely deduplicated. The system reaches the same correct state regardless of how many times a given event arrives.

---

## Observability

Real-time Prometheus metrics surfaced through Grafana dashboards:

- Requests per second
- API latency distribution
- Queue depth and backpressure
- Orders processed
- Payment success and failure rates
- Throughput under sustained load

Observability was designed in from the start, not added after the fact. It is the only reliable way to know whether a concurrent system is actually behaving correctly under load.

---

## Engineering Notes

A few things became clear only during actual load testing — not during design:

- **Latency climbed steeply on ramp-up and stayed elevated.** In the 500-user test, API latency settled around 300–350 ms. In the 1000-user test it climbed to ~800 ms and stayed there with considerable variance. The ramp itself was the most expensive moment — concurrent DB lock acquisition spiked latency before the system found a steady state.

- **RPS dropped mid-test at 1000 users, then partially recovered.** After peaking at ~136 RPS, throughput fell to ~75 RPS before recovering to ~95 RPS. As inventory depleted, the request mix shifted. Rejection responses are fast. Buy responses held locks. The ratio changing mid-test created a visible throughput dip in the Grafana data.

- **Queue depth was never the bottleneck.** Across all test runs, RabbitMQ queue depth stayed near zero — brief spikes to 1. The pressure was entirely at the PostgreSQL row-lock layer. This was only visible once Grafana was running during the test.

- **p99 tail latency was significantly worse than p95.** In the 500-user test, p95 was 140 ms and p99 jumped to 2,200 ms. Under high lock contention, a small fraction of requests waited substantially longer — something the median alone would never surface.

- **The 81% failure rate looked alarming until it wasn't.** Initial Locust output was a moment of concern before realising all failures were correct sold-out responses, not crashes. Application-level rejection and system failure look identical in raw Locust stats without inspecting the error codes.

---

## Limitations & Future Work

This system prioritises consistency and correctness over maximum throughput. Several areas would require deeper hardening before production use:

- Worker autoscaling under variable load
- Distributed tracing across services
- Failure recovery orchestration
- Multi-region consistency
- Event replay and dead-letter handling
- Chaos testing
- Rate limiting and abuse protection
- Separating the load generator from the system under test

The project was designed primarily as an exploration of concurrency control, queue-driven architectures, and operational reliability under load — not as a claim to have solved distributed systems at large.

---

## Applicability

These architectural patterns are directly applicable to any platform handling concurrent reservation or fulfilment workflows across multiple external channels. The core problems — consistency under concurrent writes, async message processing, idempotent event handling, and real-time operational visibility — are domain-independent. Booking systems, ticketing platforms, inventory management, and hospitality infrastructure all share the same underlying contention challenges this project addresses.

---

## AWS EC2 Deployment

The full stack is deployed on AWS EC2. To replicate:

**1. Launch an EC2 instance**

Recommended: `t3.medium` or above, Ubuntu 22.04 LTS, ports 22, 80, 3000, 8000, 8089, 9090, 3001, 15672 open in Security Group.

**2. SSH into the instance and install dependencies**

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip

sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu
newgrp docker
```

**3. Clone and start**

```bash
git clone https://github.com/narugupta/flash-sale-api.git
cd flash-sale-api
docker compose up --build -d
docker exec -it flashsale_backend python -m app.database.seed
```

**4. Access services via your EC2 public IP**

| Service | URL |
|---|---|
| Frontend | http://\<ec2-ip\>:3000 |
| Backend API | http://\<ec2-ip\>:8000 |
| Swagger Docs | http://\<ec2-ip\>:8000/docs |
| Prometheus | http://\<ec2-ip\>:9090 |
| Grafana | http://\<ec2-ip\>:3001 |
| RabbitMQ Dashboard | http://\<ec2-ip\>:15672 |
| Locust | http://\<ec2-ip\>:8089 |

---

## Local Quick Start

**1. Clone the repository**

```bash
git clone https://github.com/narugupta/flash-sale-api.git
cd flash-sale-api
```

**2. Start all containers**

```bash
docker compose up --build
```

**3. Seed the database**

```bash
docker exec -it flashsale_backend python -m app.database.seed
```

---

## Load Testing

```bash
locust -f locustfile.py
```

Open `http://localhost:8089` (or your EC2 IP) and configure:

- **Users:** 500 or 1000
- **Spawn rate:** 50 or 100/sec

---

## Project Structure

```
flash-sale-api/
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
├── frontend/
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── prometheus.yml
└── README.md
```

---

## Author

**Narendra Kumar Gupta**

- GitHub: [narugupta](https://github.com/narugupta)
- LinkedIn: [linkedin.com/in/narugupta](https://www.linkedin.com/in/narugupta)
