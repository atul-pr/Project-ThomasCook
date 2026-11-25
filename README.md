# StayAtlas — Hotel Booking Portal

A full-stack **Hotel Booking Portal** built as a **Scalable Modular Monolith** using **Java 21, Spring Boot 3, Spring Data JPA, Flyway, MySQL, and Angular 19**.

---

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.2.5, Spring Data JPA, Bean Validation, Flyway 9.22.3, HikariCP, Maven
- **Database:** MySQL / MariaDB (InnoDB) for runtime persistence; H2 (MySQL compatibility mode) for fast isolated automated tests
- **Frontend:** Angular 19 (Standalone Components, Lazy-Loaded Feature Routes, TypeScript, SCSS)
- **Testing:** JUnit 5, Mockito, Spring MockMvc, Multi-threaded Concurrency Integration Test

---

## Project Structure

```text
hotel-booking-portal/
├── backend/                  # Spring Boot modular monolith
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/hotelportal/
│       │   ├── common/       # CORS config, ApiError, PageResponse, GlobalExceptionHandler, exceptions
│       │   ├── hotel/        # Hotel entity, repository, search & detail service/controller
│       │   ├── room/         # RoomType entity, repository, room listing service/controller
│       │   ├── availability/ # Date validation, overlap checks, Smart Alternative Dates
│       │   ├── pricing/      # Backend-only pricing & tax calculation
│       │   └── booking/      # Booking entity, pessimistic-lock reservation, lookup & cancellation
│       ├── main/resources/
│       │   ├── application.yml
│       │   └── db/migration/
│       │       ├── V1__create_schema.sql
│       │       └── V2__seed_sample_hotels.sql
│       └── test/             # Unit, integration, Flyway, and concurrency tests
├── frontend/                 # Angular 19 SPA (lazy-loaded routes)
│   └── src/app/
│       ├── core/             # Models, HTTP API services, date & error utilities
│       ├── shared/           # Navbar, ErrorBanner, PriceSummary
│       └── features/         # HotelSearch, HotelDetail (+ Smart Alternative Dates), ManageBooking
├── DESIGN.md                 # Architecture, schema, indexing, and concurrency design
└── README.md
```

---

## Prerequisites

- **Java:** JDK 21+
- **Maven:** 3.9+
- **Node.js:** 20+ (tested on v24.12.0) and **npm**
- **Database:** MySQL 8.x or MariaDB 10.4+ running on port `3306`

---

## Configuration (Environment Variables)

All sensitive/environment-specific settings in `backend/src/main/resources/application.yml` support environment overrides:

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | Backend HTTP port |
| `DB_URL` | `jdbc:mysql://localhost:3306/hotel_booking_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | MySQL JDBC URL |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | *(empty)* | Database password |
| `HIKARI_MAX_POOL_SIZE` | `20` | HikariCP maximum connections |
| `HIKARI_MIN_IDLE` | `5` | HikariCP minimum idle connections |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Allowed Angular origin(s) |
| `APP_TAX_RATE` | `0.12` | Backend tax rate (12%) |
| `APP_MAX_STAY_NIGHTS` | `30` | Maximum nights per booking |

---

## Running Locally

### 1. Start MySQL
Ensure MySQL/MariaDB is listening on `localhost:3306` (e.g., via XAMPP MySQL or system MySQL service). Flyway automatically creates tables (`V1__create_schema.sql`) and seeds **5 sample hotels** and **11 room types** (`V2__seed_sample_hotels.sql`) on startup.

### 2. Run the Spring Boot Backend
```bash
cd hotel-booking-portal/backend
mvn spring-boot:run
```
Or build and run the JAR:
```bash
cd hotel-booking-portal/backend
mvn clean package
java -jar target/hotel-booking-portal-0.0.1-SNAPSHOT.jar
```
Backend API base URL: `http://localhost:8080/api/v1`

### 3. Run the Angular Frontend
```bash
cd hotel-booking-portal/frontend
npm install
npm start
```
Open `http://localhost:4200` in your browser.

---

## REST API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/hotels` | Paginated & sorted hotel search (`city`, `checkIn`, `checkOut`, `guests`, `page`, `size`, `sortBy`, `direction`) |
| `GET` | `/api/v1/hotels/cities` | List distinct available cities |
| `GET` | `/api/v1/hotels/{hotelId}` | Get hotel details |
| `GET` | `/api/v1/hotels/{hotelId}/rooms` | List room types with live availability, backend price breakdown, and Smart Alternative Dates when sold out |
| `GET` | `/api/v1/availability` | Check availability & price quote for a specific `roomTypeId` |
| `GET` | `/api/v1/availability/alternatives` | Suggest up to 3 alternative date ranges within the next 7 days |
| `POST` | `/api/v1/bookings` | Create booking (`PESSIMISTIC_WRITE` lock, backend pricing snapshot, unique `HTL-XXXXXXXX` reference) |
| `GET` | `/api/v1/bookings/lookup` | Retrieve booking by `reference` and `email` |
| `POST` | `/api/v1/bookings/{reference}/cancel` | Cancel booking (verifies `email`) and immediately release room availability |

---

## Running Automated Tests

### Backend Tests (JUnit 5, Mockito, MockMvc, Concurrency Stress Test)
```bash
cd hotel-booking-portal/backend
mvn test
```

### Frontend Build & Tests
```bash
cd hotel-booking-portal/frontend
npm run build
```
