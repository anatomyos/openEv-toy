import { getServerSession } from 'next-auth';
import SearchInterface from './components/SearchInterface';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-8">Medical Research Search Platform</h1>
        <p className="text-xl mb-8">Please sign in to access the search platform.</p>
        <Link
          href="/auth/signin"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Medical Research Search Platform</h1>
        <p className="text-gray-600">
          Search through medical research articles and get AI-powered summaries
        </p>
      </header>
      <main className="flex-1">
        <SearchInterface />
      </main>
    </div>
  );
}
