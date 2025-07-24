
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { MongoClient, Db } from 'mongodb';

interface AttendanceRecord {
  employee: string;
  date: string;
  status: 'present' | 'absent';
}

async function getDb(): Promise<Db> {
  const client: MongoClient = await clientPromise;
  const db = client.db('econs'); // Replace 'econs' with your database name
  // Ensure unique index on employee and date
  await db.collection('attendance').createIndex({ employee: 1, date: 1 }, { unique: true });
  return db;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Expected format: YYYY-MM-DD
    const employee = searchParams.get('employee');
    const month = searchParams.get('month'); // Expected format: YYYY-MM

    // Handle requests for a specific date
    if (date) {
      const db = await getDb();
      const records = await db
        .collection('attendance')
        .find({ date })
        .toArray();

      return NextResponse.json({
        status: 'success',
        records: records.map((record) => ({
          employee: record.employee,
          date: record.date,
          status: record.status,
        })),
      });
    }

    // Handle requests for an employee (with or without month)
    if (employee) {
      const db = await getDb();
      const query = month ? { employee, date: { $regex: `^${month}` } } : { employee };
      const records = await db
        .collection('attendance')
        .find(query)
        .toArray();

      return NextResponse.json({
        status: 'success',
        records: records.map((record) => ({
          employee: record.employee,
          date: record.date,
          status: record.status,
        })),
      });
    }

    return NextResponse.json(
      {
        status: 'error',
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Missing parameters',
        detail: 'Either date or employee query parameter is required.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in GET /api/attendance:', error);
    return NextResponse.json(
      {
        status: 'error',
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Internal server error',
        detail: error instanceof Error ? error.message : 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records }: { records: AttendanceRecord[] } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
          title: 'Invalid request body',
          detail: 'Records must be a non-empty array.',
        },
        { status: 400 }
      );
    }

    // Validate records
    for (const record of records) {
      if (!record.employee || !record.date || !['present', 'absent'].includes(record.status)) {
        return NextResponse.json(
          {
            status: 'error',
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
            title: 'Invalid record',
            detail: 'Each record must have employee, date, and status (present or absent).',
          },
          { status: 400 }
        );
      }
    }

    const db = await getDb();
    const result = await db.collection('attendance').insertMany(records, { ordered: false });

    return NextResponse.json({
      status: 'success',
      insertedCount: result.insertedCount,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error (employee + date)
      return NextResponse.json(
        {
          status: 'error',
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
          title: 'Duplicate record',
          detail: 'Attendance record already exists for one or more employees on the specified date.',
        },
        { status: 409 }
      );
    }
    console.error('Error in POST /api/attendance:', error);
    return NextResponse.json(
      {
        status: 'error',
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Internal server error',
        detail: error.message || 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}
