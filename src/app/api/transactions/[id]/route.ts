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

    console.log('Attempting to delete transaction with ID:', id);

    let deleteQuery: any;

    // Try to handle both ObjectId and numeric IDs
    if (ObjectId.isValid(id)) {
      // It's a valid ObjectId string
      deleteQuery = { _id: new ObjectId(id) };
      console.log('Using ObjectId query:', deleteQuery);
    } else if (!isNaN(Number(id))) {
      // It's a numeric ID (for locally created transactions)
      deleteQuery = { id: parseInt(id) };
      console.log('Using numeric ID query:', deleteQuery);
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

    // Try to find the transaction first to provide better error messages
    const existingTransaction = await collection.findOne(deleteQuery);
    if (!existingTransaction) {
      console.log('Transaction not found with query:', deleteQuery);
      return NextResponse.json(
        { status: 'error', message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Delete the transaction
    const result = await collection.deleteOne(deleteQuery);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Transaction not found or already deleted' },
        { status: 404 }
      );
    }

    console.log('Successfully deleted transaction:', id);
    return NextResponse.json({ 
      status: 'success', 
      message: 'Transaction deleted successfully',
      deletedId: id 
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete transaction', error: errorMessage },
      { status: 500 }
    );
  }
}