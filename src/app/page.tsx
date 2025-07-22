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
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.status !== 'success') {
      setError(data.message || 'Login failed');
      return;
    }

    localStorage.setItem('userSession', JSON.stringify({
      email: data.user.email,
      role: data.user.role,
      loggedInAt: Date.now(),
    }));

    router.push('/dashboard');
  } catch (err) {
    console.error(err);
    setError('Something went wrong. Please try again.');
  }
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