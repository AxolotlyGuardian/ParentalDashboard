'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api';

interface ScrapeResults {
  success: boolean;
  error?: string;
  tag?: string;
  category?: string;
  total_pages?: number;
  episodes_found?: number;
  episodes_tagged?: number;
  episodes_already_tagged?: number;
  episodes_not_in_db?: number;
  failed_parses?: number;
}

export default function FandomScrapePage() {
  const [wikiName, setWikiName] = useState('');
  const [category, setCategory] = useState('');
  const [confidence, setConfidence] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResults | null>(null);

  const handleScrape = async () => {
    if (!wikiName || !category) {
      alert('Please enter both wiki name and category');
      return;
    }

    try {
      setLoading(true);
      setResults(null);
      
      const response = await adminApi.scrapeFandomCategory({
        wiki_name: wikiName,
        category: category,
        confidence: confidence
      });
      
      setResults(response.data);
    } catch (error: any) {
      console.error('Scrape failed:', error);
      setResults({
        success: false,
        error: error.response?.data?.detail || error.message || 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    { wiki: 'pawpatrol', category: 'Spiders', tag: 'spiders' },
    { wiki: 'pawpatrol', category: 'Snakes', tag: 'snakes' },
    { wiki: 'peppa-pig', category: 'Ghosts', tag: 'ghosts' },
    { wiki: 'peppa-pig', category: 'Darkness', tag: 'darkness' }
  ];

  const loadExample = (wiki: string, cat: string) => {
    setWikiName(wiki);
    setCategory(cat);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fandom Wiki Scraper</h1>
        <p className="text-gray-600 mt-2">Automatically tag episodes using Fandom wiki category pages</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Scrape Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wiki Name
            </label>
            <input
              type="text"
              value={wikiName}
              onChange={(e) => setWikiName(e.target.value)}
              placeholder="pawpatrol"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., "pawpatrol" from pawpatrol.fandom.com</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Spiders"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., "Spiders" from /wiki/Category:Spiders</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confidence Score (0.0 - 1.0)
          </label>
          <input
            type="number"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            min="0"
            max="1"
            step="0.1"
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <p className="text-xs text-gray-500 mt-1">How confident are we in the automated tagging?</p>
        </div>

        <button
          onClick={handleScrape}
          disabled={loading}
          className={`px-6 py-2 rounded-md text-white font-medium ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'
          }`}
        >
          {loading ? 'Scraping...' : 'Start Scrape'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examples.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => loadExample(ex.wiki, ex.category)}
              className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition"
            >
              <div className="font-medium text-gray-900">{ex.wiki}.fandom.com</div>
              <div className="text-sm text-gray-600">Category: {ex.category}</div>
              <div className="text-xs text-gray-500">→ Tag: {ex.tag}</div>
            </button>
          ))}
        </div>
      </div>

      {results && (
        <div className={`rounded-lg shadow p-6 ${results.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <h2 className="text-xl font-semibold mb-4">
            {results.success ? '✅ Scrape Complete' : '❌ Scrape Failed'}
          </h2>

          {results.error && (
            <div className="text-red-700 mb-4">
              <strong>Error:</strong> {results.error}
            </div>
          )}

          {results.success && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Tag Applied</div>
                  <div className="text-lg font-semibold text-gray-900">{results.tag}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="text-lg font-semibold text-gray-900">{results.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Pages</div>
                  <div className="text-lg font-semibold text-gray-900">{results.total_pages}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Episodes Found</div>
                  <div className="text-lg font-semibold text-green-700">{results.episodes_found}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Episodes Tagged</div>
                  <div className="text-lg font-semibold text-blue-700">{results.episodes_tagged}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Already Tagged</div>
                  <div className="text-lg font-semibold text-gray-600">{results.episodes_already_tagged}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Not in Database</div>
                  <div className="text-lg font-semibold text-orange-700">{results.episodes_not_in_db}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Failed Parses</div>
                  <div className="text-lg font-semibold text-red-700">{results.failed_parses}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
