'use client';

import { useEffect, useState } from 'react';

interface User {
  email: string;
  role: 'superadmin' | 'admin';
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed: User = JSON.parse(stored);
      setUser(parsed);
    }
  }, []);

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <main className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}</h1>
      <p className="text-lg">
        You are logged in as:{" "}
        <span className="font-semibold text-blue-600">{user.role}</span>
      </p>

      {/* Superadmin-only section */}
      {user.role === 'superadmin' && (
        <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500">
          <h2 className="text-lg font-bold mb-2">Superadmin Tools</h2>
          <p>Only visible to Omer.</p>
        </div>
      )}
    </main>
  );
}
