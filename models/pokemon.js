// All MongoDB access for pokemon
import { db } from '../db.js';
import { ObjectId } from 'mongodb'; 

const collection = db.collection('pokemon');

// safely turn a string into an ObjectId, or return null if it's not valid
function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// insert a new pokemon document; returns the created document
export async function createPokemon(data) {
  const result = await collection.insertOne(data);
  return { _id: result.insertedId, ...data };
}

// return all pokemon, or only those with a given owner
export async function listPokemon(owner) {
  const query = owner ? { owner } : {};   // filter by owner if provided, else match all
  return await collection.find(query).toArray();
}

// find one pokemon by its id string, or null if not found
export async function findPokemon(id) {
  const _id = toObjectId(id);
  if (!_id) return null; 
  return await collection.findOne({ _id});
}

// update only the provided fields of one pokemon; returns the updated document
export async function updatePokemon(id, fields) {
  const _id = toObjectId(id);
  if (!_id) return null; 
  await collection.updateOne(
    { _id},
    { $set: fields }
  );
  
  return await findPokemon(id);
}

// delete one pokemon by id; returns true if something was deleted
export async function deletePokemon(id) {
  const _id = toObjectId(id);
  if (!_id) return false; 
  const result = await collection.deleteOne({ _id});
  return result.deletedCount === 1;
}