// cs5610_bonus7_pokemon_api — Pokemon API
// Author: April Yang
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { HTTPException } from 'hono/http-exception';
import { db } from './db.js';
import { createPokemon, listPokemon, findPokemon, updatePokemon, deletePokemon } from './models/pokemon.js';

const app = new Hono();

app.get('/', (c) => c.text('Pokemon API is running'));

// LIST all pokemon, optionally filtered by owner
app.get('/api/pokemon', async (c) => {
  const owner = c.req.query('owner');   // 'April' from ?owner=April, or undefined
  const all = await listPokemon(owner);
  return c.json(all);
});

// GET one pokemon by id
app.get('/api/pokemon/:id', async (c) => {
  const id = c.req.param('id');
  const pokemon = await findPokemon(id);

  if (!pokemon) {
    throw new HTTPException(404, { message: 'Pokemon not found' });
  }

  return c.json(pokemon);
});

// CREATE a pokemon
app.post('/api/pokemon', async (c) => {
  const body = await c.req.json();

  // --- validate at the edge (before touching the database) ---
  // species and owner must be present (never falsy)
  if (!body.species || !body.owner) {
    throw new HTTPException(400, { message: 'species and owner are required' });
  }
  // the client must NOT send an id (the server assigns it)
  if (body.id !== undefined || body._id !== undefined) {
    throw new HTTPException(400, { message: 'do not include an id' });
  }

  // --- build the new pokemon ---
  const pokemon = {
    name: body.name || body.species,           // name defaults to species if absent
    species: body.species,
    owner: body.owner,
    health: Math.floor(Math.random() * 100) + 1,  // random health between 1 and 100
    level: Math.floor(Math.random() * 50) + 1,   // random level between 1 and 50
  };

  const created = await createPokemon(pokemon);
  return c.json(created, 201);
});


// PATCH update provided fields
app.patch('/api/pokemon/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  // make sure it exists first
  const existing = await findPokemon(id);
  if (!existing) {
    throw new HTTPException(404, { message: 'Pokemon not found' });
  }

  // --- validate the fields the client is trying to change ---
  // never allow id to be changed
  if (body.id !== undefined || body._id !== undefined) {
    throw new HTTPException(400, { message: 'cannot change id' });
  }
  // if species or owner are provided, they must not be falsy
  if (body.species !== undefined && !body.species) {
    throw new HTTPException(400, { message: 'species cannot be empty' });
  }
  if (body.owner !== undefined && !body.owner) {
    throw new HTTPException(400, { message: 'owner cannot be empty' });
  }
  // if health or level are provided, they must be numbers
  if (body.health !== undefined && typeof body.health !== 'number') {
    throw new HTTPException(400, { message: 'health must be a number' });
  }
  if (body.level !== undefined && typeof body.level !== 'number') {
    throw new HTTPException(400, { message: 'level must be a number' });
  }

  const updated = await updatePokemon(id, body);
  return c.json(updated);
});

// DELETE a pokemon
app.delete('/api/pokemon/:id', async (c) => {
  const id = c.req.param('id');

  const deleted = await deletePokemon(id);
  if (!deleted) {
    throw new HTTPException(404, { message: 'Pokemon not found' });
  }

  return c.body(null, 204);
});



// central error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error(err);
  return c.json({ error: 'Internal error' }, 500);
});

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3000 });
console.log('http://localhost:3000');