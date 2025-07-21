// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('econs');
    const collection = db.collection('transactions');

    const { id } = params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

    // Delete the transaction
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Transaction deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}