# Polling App API Documentation

This document outlines the RESTful API endpoints for the Polling App.

---

## 🔐 Authentication

### `POST /api/register`

Registers a new user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "string"
}
```

---

### `POST /api/login`

Authenticates a user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "string"
}
```

---

### `GET /api/users/:id`

Fetch a user's details by ID.

**Response:**
```json
{
  "id": 1,
  "username": "string"
}
```

---

## 📊 Polls

### `POST /api/polls`

Create a new poll.

**Request Body:**
```json
{
  "title": "string",
  "options": ["option1", "option2"],
  "deadline": "YYYY-MM-DD"
}
```

**Response:**
```json
{
  "message": "Poll created"
}
```

---

### `GET /api/polls`

Returns all polls.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Poll Title",
    "options": [
      { "text": "Option 1" },
      { "text": "Option 2" }
    ],
    "votes": [],
    "deadline": "2025-07-10"
  }
]
```

---

### `POST /api/polls/:id/vote`

Vote on a poll.

**Request Body:**
```json
{
  "userId": 1,
  "optionIndex": 0
}
```

**Response:**
```json
{
  "message": "Vote recorded"
}
```

---

### `GET /api/polls/:id/results`

Fetch the results for a poll.

**Response:**
```json
[
  {
    "text": "Option 1",
    "votes": 3,
    "voters": ["user1", "user2"]
  },
  {
    "text": "Option 2",
    "votes": 2,
    "voters": ["user3"]
  }
]
```

---

### `DELETE /api/polls/:id`

Deletes a poll.

**Response:**
```json
{
  "message": "Poll deleted"
}
```

---

## 🔁 Misc

### `POST /api/reset`

Reset all votes.

**Response:**
```json
{
  "message": "Votes reset"
}
```