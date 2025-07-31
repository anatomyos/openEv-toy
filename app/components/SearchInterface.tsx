'use client';

import { useState, useEffect } from 'react';

interface Citation {
  id: string;
  title: string;
  url?: string;
}

interface SearchResult {
  query?: string;
  articles: Citation[];
  aiSummary?: string;
  keywords: string[];
  rawArticleContent?: string | null;
}

interface Ad {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

const ADS: Ad[] = [
  {
    id: 'cf',
    title: 'Breakthroughs in Cystic Fibrosis',
    content: 'Learn about the latest treatments for cystic fibrosis.',
    tags: ['cystic fibrosis'],
  },
  {
    id: 'generic',
    title: 'Affordable Generic Drugs',
    content: 'Discover how generics can save you money.',
    tags: ['generic drugs'],
  },
];

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchResult[]>([]);
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setHistory(data.searches || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!results) return;
    if (results.keywords) {
      const match = ADS.find((a) =>
        results.keywords.some((k: string) =>
          a.tags.some((t) => k.toLowerCase().includes(t.toLowerCase()))
        )
      );
      setAd(match || ADS.find((a) => a.id === 'generic') || null);
    } else {
      setAd(ADS.find((a) => a.id === 'generic') || null);
    }
  }, [results]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Search failed');
      }

      const data = await response.json();
      setResults({ ...data, query });
      // refresh history
      fetch('/api/history')
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setHistory(data.searches || []))
        .catch(() => {});
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medical articles..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {history.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Recent Searches</h3>
          <ul className="list-disc list-inside space-y-1">
            {history.map((h, idx) => (
              <li key={idx} className="cursor-pointer text-blue-600 hover:underline" onClick={() => setResults(h)}>
                {h.query}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mb-4 text-red-600" role="alert">
          {error}
        </p>
      )}

      {results && (
        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            {results.aiSummary && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
                <p className="text-gray-700">{results.aiSummary}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">Search Results</h3>
              {results.articles.length > 0 ? (
                <ol className="list-decimal list-inside space-y-2">
                  {results.articles.map((article, idx) => (
                    <li key={article.id}>
                      {article.url ? (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {article.title}
                        </a>
                      ) : (
                        article.title
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                results.aiSummary || results.rawArticleContent ? (
                  <p className="text-gray-500 whitespace-pre-line">
                    {results.rawArticleContent || results.aiSummary}
                  </p>
                ) : (
                  <p className="text-gray-500">No public articles</p>
                )
              )}
            </div>
          </div>
          {ad && (
            <aside className="w-64 shrink-0">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Sponsored</h4>
                <p className="font-medium">{ad.title}</p>
                <p className="text-sm text-gray-700">{ad.content}</p>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
} 