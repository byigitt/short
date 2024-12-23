import { UrlShortenerForm } from '../components/ui/url-shortener-form';
import { ThemeToggle } from '../components/theme-toggle';
import { Toaster } from '../components/ui/toaster';

export default function Home() {
  return (
    <main className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      {/* Background decoration - optimized for performance */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <div
          className="absolute top-0 -left-4 w-72 h-72 bg-purple-300/50 dark:bg-purple-700/50 rounded-full mix-blend-multiply will-change-transform"
          style={{
            filter: 'blur(64px)',
            animation: 'blob 7s infinite',
            transform: 'translate(0px, 0px) scale(1)',
          }}
        />
        <div
          className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300/50 dark:bg-yellow-700/50 rounded-full mix-blend-multiply will-change-transform"
          style={{
            filter: 'blur(64px)',
            animation: 'blob 7s infinite 2s',
            transform: 'translate(0px, 0px) scale(1)',
          }}
        />
        <div
          className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300/50 dark:bg-pink-700/50 rounded-full mix-blend-multiply will-change-transform"
          style={{
            filter: 'blur(64px)',
            animation: 'blob 7s infinite 4s',
            transform: 'translate(0px, 0px) scale(1)',
          }}
        />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center gap-8">
        <ThemeToggle />

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl tracking-tighter font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            URL Shortener
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your long URLs into short, shareable links. Perfect for social media,
            marketing campaigns, or any time you need a cleaner link.
          </p>
        </div>

        <UrlShortenerForm />
      </div>

      <Toaster />
    </main>
  );
}
