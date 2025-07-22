'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';

// Predefined users with hashed passwords (hashed with bcrypt)
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Input validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      setError('Invalid email or password');
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      setError('Invalid email or password');
      return;
    }

    // Store user session in localStorage
    const sessionData = { email: user.email, role: user.role, loggedInAt: Date.now() };
    localStorage.setItem('userSession', JSON.stringify(sessionData));

    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value.trim())}
            className="w-full border px-3 py-2 rounded-lg outline-none focus:ring focus:border-blue-400"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg outline-none focus:ring focus:border-blue-400"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Login
        </button>
      </div>
    </main>
  );
}