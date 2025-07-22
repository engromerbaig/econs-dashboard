// components/ProtectedRoute.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (!session) {
      router.replace('/');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  if (!isVerified) return null;

  return <>{children}</>;
}
