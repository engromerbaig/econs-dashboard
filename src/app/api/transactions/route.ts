// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('econs');
    const collection = db.collection('transactions');

    const transaction = await req.json();

    const result = await collection.insertOne(transaction);
    return NextResponse.json({ status: 'success', insertedId: result.insertedId });
  } catch (error) {
    console.error('Insert error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to add transaction' },
      { status: 500 }
    );
  }
}



export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('econs');
    const collection = db.collection('transactions');

    const transactions = await collection.find({}).sort({ date: -1 }).toArray();

    return NextResponse.json({ status: 'success', transactions });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch transactions' }, { status: 500 });
  }
}
