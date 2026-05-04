# Architecture Documentation

## Overview

This project follows a **full-stack architecture** with:

* Frontend: React (Vite)
* Backend: ASP.NET Core Web API
* Database: SQL (with seed scripts)
* Containerization: Docker

---

## System Architecture

```
[ React Frontend ]
        ↓
[ ASP.NET Core API ]
        ↓
[ SQL Database ]
```

---

## Backend Architecture

The backend follows a layered structure:

### 1. Controllers

Located in:

```
backend/Controllers/
```

Responsibilities:

* Handle HTTP requests
* Call business logic
* Return responses

Examples:

* AuthController
* VarerController
* OppskrifterController

---

### 2. DTOs (Data Transfer Objects)

Located in:

```
backend/DTOs/
```

Responsibilities:

* Define request/response formats
* Prevent overexposing database models

---

### 3. Models (Entities)

Located in:

```
backend/Models/
```

Represents database tables:

Examples:

* Bruker (User)
* Vare (Product)
* Oppskrift (Recipe)
* Husholdning (Household)

---

### 4. Data Layer

```
backend/Data/AppDbContext.cs
```

* Uses Entity Framework Core
* Handles database connection
* Maps models to tables

---

## Frontend Architecture

Located in:

```
client-react/
```

### Structure:

* `src/` → main application code
* `App.jsx` → main component
* `main.jsx` → entry point

### Responsibilities:

* UI rendering
* API communication
* State management

---

## Database

Located in:

```
database/
```

Includes:

* `schema.sql` → database structure
* `*-seed.sql` → test data

---

## Docker Setup

```
docker-compose.yml
```

Used to:

* Run backend
* Run database
* Simplify development setup

---

## Data Flow

1. User interacts with React UI
2. React sends HTTP request to API
3. API processes request via Controller
4. Data is fetched/stored in database
5. API returns response
6. UI updates

---

## Key Design Principles

* Separation of concerns
* Layered architecture
* DTO-based communication
* RESTful API design

---

