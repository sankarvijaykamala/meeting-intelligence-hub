import { useState } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [question, setQuestion] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('search');

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/search`, { query });
      setSearchResults(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question) return;
    setLoading(true);
    setAnswer('');
    setSources([]);
    try {
      const res = await axios.post(`${BASE_URL}/api/ask`, { question });
      setAnswer(res.data.answer);
      setSources(res.data.sources);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Meetings</h1>
      <p className="text-gray-500 mb-8">Semantic search powered by AI — finds meaning, not just keywords</p>

      {/* Mode Toggle */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setMode('search')}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition ${mode === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          🔍 Semantic Search
        </button>
        <button
          onClick={() => setMode('ask')}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition ${mode === 'ask' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          🤖 Ask AI (RAG)
        </button>
      </div>

      {mode === 'search' ? (
        <div>
          <div className="flex gap-3 mb-6">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search across all meetings..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {/* Results count */}
          {searchResults.length > 0 && (
            <p className="text-xs text-gray-400 mb-3">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</p>
          )}

          <div className="space-y-3">
            {searchResults.length === 0 && !loading && query && (
              <div className="text-center py-10 text-gray-400">
                <p>No relevant results found. Try a different query.</p>
              </div>
            )}
            {searchResults.map((r, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-blue-600">{r.title}</span>
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{r.type}</span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      {Math.round((1 - r.distance) * 100)}% match
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-6">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Ask anything about your meetings..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAsk}
              disabled={loading}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-purple-300 transition"
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {answer && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Answer</h3>
              <p className="text-gray-700 leading-relaxed">{answer}</p>
              {sources.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-400 mb-2">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((s, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}