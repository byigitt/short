import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The URL you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/">
            <Button>
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 