// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      console.log('Sending login request:', { email });
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('API response status:', res.status);
      const data = await res.json();
      console.log('API response:', data);

      if (data.status !== 'success') {
        setError(data.message || 'Login failed');
        return;
      }

      console.log('Redirecting to /dashboard');
      router.push('/dashboard');
    } catch (err) {
      console.error('Login request error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
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
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}