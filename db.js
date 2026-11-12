// db.js — connect once, reuse everywhere
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
console.log('Connected to MongoDB');

export const db = client.db('pokemon');