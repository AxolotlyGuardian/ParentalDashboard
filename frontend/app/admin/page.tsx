'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminHomePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/admin/content-reports');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Redirecting to Content Reports...</div>
    </div>
  );
}
