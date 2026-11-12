# Pokemon API with Cookies

A small RESTful API for a Pokemon collection with simple cookie-based login,
built with [Hono](https://hono.dev/) and MongoDB. Created for CS5610
(Bonus Assignment 8).

**Author:** April Yang

## What it does

Users can register, log in, and log out. A `username` cookie identifies the
logged-in user, and the Pokemon routes use that cookie so each user only sees
and controls their own Pokemon.

- Pokemon are stored in MongoDB.
- Users are stored in an in-memory array (passwords are stored in plain text,
  as this assignment is for practice only).
- Login state is a plain `username` cookie (no sessions, tokens, or hashing).

## Requirements

- Node.js 22.17+
- A MongoDB connection string (e.g. a free MongoDB Atlas cluster)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root with your MongoDB connection string:
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pokemon

   `.env` is gitignored and must never be committed.
3. Run the server:
   ```bash
   npm run dev
   ```
   It starts on http://localhost:3000.

## Authentication

Login is tracked with a cookie named `username`. `register` and `login` set the
cookie; `logout` clears it. A tool that keeps cookies between requests (such as
Bruno or a browser) will stay "logged in" automatically.

## Endpoints

### User routes

| Method | Path | Description | Success |
|---|---|---|---|
| POST | `/user/register` | Create a user (`username`, `password`) and set the `username` cookie. | 201 |
| POST | `/user/login` | Log in with `username` and `password`; sets the `username` cookie. | 200 |
| POST | `/user/logout` | Clear the `username` cookie. | 200 |

### Pokemon routes (require login)

| Method | Path | Description | Success |
|---|---|---|---|
| GET | `/api/pokemon` | List only the Pokemon owned by the logged-in user. | 200 |
| POST | `/api/pokemon` | Create a Pokemon. The `owner` is set from the cookie; any `owner` in the body is ignored. | 201 |
| DELETE | `/api/pokemon/:id` | Delete a Pokemon, only if it belongs to the logged-in user. | 204 |

A Pokemon has: `_id`, `name`, `species`, `health`, `level`, and `owner`.
On create, `health` and `level` are random, and `name` defaults to `species`.

## Status codes

- `200` success, `201` created, `204` deleted (no content).
- `400` missing or invalid fields (e.g. no `username`/`password`, no `species`).
- `401` not logged in, or wrong username/password on login.
- `403` logged in, but trying to delete another user's Pokemon.
- `404` no Pokemon with that id.
- `409` username already taken on register.

## Example flow (curl)

```bash
# Register (saves the username cookie to a cookie jar file)
curl -c cookies.txt -X POST http://localhost:3000/user/register \
  -H "Content-Type: application/json" \
  -d '{"username":"april","password":"pw"}'

# Create a Pokemon as the logged-in user (owner comes from the cookie)
curl -b cookies.txt -X POST http://localhost:3000/api/pokemon \
  -H "Content-Type: application/json" \
  -d '{"species":"Pikachu"}'

# List only your Pokemon
curl -b cookies.txt http://localhost:3000/api/pokemon

# Log out (clears the cookie)
curl -b cookies.txt -X POST http://localhost:3000/user/logout
```

(With Bruno, cookies are kept automatically, so you do not need the cookie-jar
flags.)

## Project structure
.
├── server.js # Hono server: user routes + pokemon routes
├── db.js # MongoDB connection
├── models/
│ └── pokemon.js # database access for pokemon
├── .env # MONGODB_URI (gitignored)
└── .gitignore


## Built with

- [Hono](https://hono.dev/), `@hono/node-server`, and `hono/cookie`
- MongoDB (Node driver)

