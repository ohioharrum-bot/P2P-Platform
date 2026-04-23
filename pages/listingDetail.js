import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ListingDetail() {
  const router = useRouter();

  useEffect(() => {
    // Keep backward compatibility if this route is visited directly.
    // Redirect to the proper dynamic listing route if possible.
    const id = router.query.id || router.query.listingId;
    if (id) router.replace(`/Listing/${id}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <p className="text-sm text-gray-600">Redirecting to listing details...</p>
    </div>
  );
}
