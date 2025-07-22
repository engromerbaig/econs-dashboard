// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const client = await clientPromise;
    const db = client.db(); // default database from the URI
    const collection = db.collection('users');

    const user = await collection.findOne({ email });

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ status: 'error', message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'success',
      user: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
