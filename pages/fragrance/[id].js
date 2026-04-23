import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function FragranceLegacyRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      router.replace(`/fragrances/${id}`);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <p className="text-sm text-gray-600">Redirecting to fragrance details...</p>
    </div>
  );
}
