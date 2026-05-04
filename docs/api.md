# API Documentation

## Overview

This API is built using ASP.NET Core and provides endpoints for managing:

* Authentication
* Households
* Inventory (Varelager)
* Products (Varer)
* Recipes (Oppskrifter)
* Shopping Lists (Handleliste)
* Consumption tracking (Forbruk)



```

```



## Authentication

### POST `/auth/login`

Login user

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**

```json
{
  "token": "jwt-token",
  "userId": 1
}
```

---

## Household (Husholdning)

### GET `/husholdning`

Get all households for user

### POST `/husholdning`

Create new household

### PUT `/husholdning/{id}`

Update household

### DELETE `/husholdning/{id}`

Delete household

---

## Products (Varer)

### GET `/varer`

Get all products

### GET `/varer/{id}`

Get product by ID

### POST `/varer`

Create product

### PUT `/varer/{id}`

Update product

### DELETE `/varer/{id}`

Delete product

---

## Inventory (Varelager)

### GET `/varelager`

Get inventory items

### POST `/varelager`

Add item to inventory

### PUT `/varelager/{id}`

Update inventory item

### DELETE `/varelager/{id}`

Remove item

---

## Recipes (Oppskrifter)

### GET `/oppskrifter`

Get all recipes

### GET `/oppskrifter/{id}`

Get recipe by ID

### POST `/oppskrifter`

Create recipe

### PUT `/oppskrifter/{id}`

Update recipe

### DELETE `/oppskrifter/{id}`

Delete recipe

---

## Shopping List (Handleliste)

### GET `/handleliste`

Get shopping list

### POST `/handleliste`

Add item

### DELETE `/handleliste/{id}`

Remove item

---

## Consumption (Forbruk)

### GET `/forbruk`

Get consumption history

### POST `/forbruk`

Add consumption entry

---

## Units (Maaleenheter)

### GET `/maaleenheter`

Get all measurement units

---

## Error Handling

All endpoints return standard HTTP status codes:

* `200 OK` – Success
* `201 Created` – Resource created
* `400 Bad Request` – Invalid input
* `401 Unauthorized` – Not authenticated
* `404 Not Found` – Resource not found
* `500 Internal Server Error` – Server issue

---

## Notes

* Authentication is required for most endpoints.
* JSON is used for all request and response bodies.
* DTOs are used to structure API communication.
