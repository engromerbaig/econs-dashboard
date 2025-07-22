import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('econs');
    const collection = db.collection('users');

    const user = await collection.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User not found' },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { status: 'error', message: 'No password set for user' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { status: 'error', message: 'Incorrect password' },
        { status: 401 }
      );
    }

    const cookieStore = cookies();
    const cookie = (await cookieStore).set({
      name: 'user_token',
      value: JSON.stringify({
        email: user.email,
        role: user.role || 'user',
      }),
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({ status: 'success', message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}