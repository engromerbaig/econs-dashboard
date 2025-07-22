'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Email and password are required');
      setIsLoading(false);
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
        setIsLoading(false);
        return;
      }

      console.log('Redirecting to /dashboard');
      router.push('/dashboard');
    } catch (err) {
      console.error('Login request error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Econs Dashboard Logo"
              width={150}
              height={50}
              className="object-contain"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer bg-econs-blue text-white py-2.5 rounded-lg hover:bg-econs-blue/90 transition flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                    ></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side: Placeholder Image */}
      <div className="hidden md:block flex-1 relative">
        <Image
          src="/placeholder.png"
          alt="Placeholder"
          fill
          className="object-cover"
          priority
        />
      </div>
    </main>
  );
}