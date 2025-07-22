// src/app/api/login/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const users = [
  {
    email: 'omer@econs.com',
    password: '$2a$12$ZKOdnIWbTE/KcPTFVxjumuGupWgIjivuWCU70QIrjOj5XxJCdbSKu', // Password: admin
    role: 'superadmin',
  },
  {
    email: 'admin@econs.com',
    password: '$2a$12$XBRS//CcksHHTwlTjdPmpu18mvsCsngKft0d8SrUEjhgMaAyl70p.', // Password: harisadmin
    role: 'admin',
  },
];

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = users.find(u => u.email === email);
  if (!user) {
    return NextResponse.json({ status: 'error', message: 'Invalid credentials' }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ status: 'error', message: 'Invalid credentials' }, { status: 401 });
  }

  // Only send public data back
  return NextResponse.json({
    status: 'success',
    user: { email: user.email, role: user.role },
  });
}
