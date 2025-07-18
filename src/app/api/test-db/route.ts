// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('econs'); // or 'econs_dashboard' if that’s your DB name
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      status: 'success',
      collections: collections.map((col) => col.name),
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error });
  }
}
