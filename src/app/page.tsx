'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // For now, accept any credentials and save a fake user role
    const role = email === 'omer@econs.com' ? 'superadmin' : 'admin';
    localStorage.setItem('user', JSON.stringify({ email, role }));

    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Login</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg outline-none focus:ring focus:border-blue-400"
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
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Login
        </button>
      </form>
    </main>
  );
}
