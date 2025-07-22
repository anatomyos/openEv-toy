'use client';

import { useState } from 'react';

interface MedicalArticle {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  publishDate: Date;
  source: string;
  url?: string;
}

interface SearchResult {
  articles: MedicalArticle[];
  aiSummary?: string;
}

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
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

      {results && (
        <div className="space-y-6">
          {results.aiSummary && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
              <p className="text-gray-700">{results.aiSummary}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-4">Search Results</h3>
            {results.articles.length > 0 ? (
              <div className="space-y-4">
                {results.articles.map((article) => (
                  <div
                    key={article.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h4 className="text-lg font-medium mb-2">{article.title}</h4>
                    <p className="text-gray-600 mb-2">{article.abstract}</p>
                    <div className="flex flex-wrap gap-2">
                      {article.keywords.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-sm rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span>Published: {new Date(article.publishDate).toLocaleDateString()}</span>
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 text-blue-600 hover:underline"
                        >
                          View Source
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 