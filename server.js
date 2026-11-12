// cs5610_bonus8_pokemon_api_cookies
// Author: April Yang
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { HTTPException } from 'hono/http-exception';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { db } from './db.js';
import { createPokemon, listPokemon, findPokemon, deletePokemon } from './models/pokemon.js';

const app = new Hono();

// in-memory user store (assignment: "create a new array for user data")
const users = [];

// returns the logged-in username, or throws 401 if there's no cookie
function requireUser(c) {
  const username = getCookie(c, 'username');
  if (!username) {
    throw new HTTPException(401, { message: 'not logged in' });
  }
  return username;
}

app.get('/api/pokemon', async (c) => {
  const username = requireUser(c);          // 401 if no cookie
  const all = await listPokemon(username);  // reuse your owner-filtering model
  return c.json(all);
});


app.post('/api/pokemon', async (c) => {
  const username = requireUser(c);          // 401 if no cookie
  const body = await c.req.json();

  // species still required; owner now comes from the cookie, not the body
  if (!body.species) {
    throw new HTTPException(400, { message: 'species is required' });
  }
  if (body.id !== undefined || body._id !== undefined) {
    throw new HTTPException(400, { message: 'do not include an id' });
  }

  const pokemon = {
    name: body.name || body.species,
    species: body.species,
    owner: username,  // owner is the logged-in user
    health: Math.floor(Math.random() * 100) + 1,   // (use your existing ranges)
    level: Math.floor(Math.random() * 50) + 1,
  };

  const created = await createPokemon(pokemon);
  return c.json(created, 201);
});


app.delete('/api/pokemon/:id', async (c) => {
  const username = requireUser(c);          // 401 if no cookie
  const id = c.req.param('id');

  const existing = await findPokemon(id);
  if (!existing) {
    throw new HTTPException(404, { message: 'Pokemon not found' });
  }
  // authorization: you can only delete YOUR pokemon
  if ( existing.owner !== username) {
    throw new HTTPException(403, { message: 'not your pokemon' });
  }

  await deletePokemon(id);
  return c.body(null, 204);
});


app.get('/', (c) => c.text('Pokemon API is running'));

// REGISTER: create a user and log them in via a cookie
app.post('/user/register', async (c) => {
  const body = await c.req.json();

  if (!body.username || !body.password) {
    throw new HTTPException(400, { message: 'username and password are required' });
  }
  // reject if the username is already taken
  if (users.some((u) => u.username === body.username)) {
    throw new HTTPException(409, { message: 'username already taken' });
  }

  const user = { username: body.username, password: body.password, createdAt: new Date() };
  users.push(user);

  setCookie(c, 'username', user.username, {
    path: '/', httpOnly: true, sameSite: 'Lax', maxAge: 60 * 60 * 24,
  });
  return c.json({ username: user.username, createdAt: user.createdAt }, 201);
});

// LOGIN: check credentials, set the cookie on success
app.post('/user/login', async (c) => {
  const body = await c.req.json();

  if (!body.username || !body.password) {
    throw new HTTPException(400, { message: 'username and password are required' });
  }
  const user = users.find((u) => u.username === body.username);

  // valid only if the user exists AND the password matches
  if (!user || user.password !== body.password) {
    throw new HTTPException(401, { message: 'invalid username or password' });
  }

  setCookie(c, 'username', user.username, {
    path: '/', httpOnly: true, sameSite: 'Lax', maxAge: 60 * 60 * 24,
  });
  return c.json({ username: user.username }, 200);
});

// LOGOUT: clear the cookies
app.post('/user/logout', (c) => {
  deleteCookie(c, 'username', { path: '/' });
  return c.json({ ok: true }, 200);
});



// central error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error(err);
  return c.json({ error: 'Internal error' }, 500);
});

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3000 });
console.log('http://localhost:3000');