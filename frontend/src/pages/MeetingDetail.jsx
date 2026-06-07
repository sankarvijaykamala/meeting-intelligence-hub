import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMeeting } from '../api/api';

export default function MeetingDetail() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    getMeeting(id)
      .then(res => setMeeting(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Loading...</p></div>;
  if (!meeting) return <div className="text-center py-20 text-gray-400">Meeting not found</div>;

  const tabs = ['summary', 'action_items', 'decisions', 'transcript'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back to Dashboard</Link>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{meeting.title}</h1>
        <p className="text-gray-400 text-sm mt-1">{meeting.date}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow p-6">
        {activeTab === 'summary' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Summary</h2>
            <p className="text-gray-600 leading-relaxed">{meeting.summary || 'No summary available.'}</p>
          </div>
        )}

        {activeTab === 'action_items' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Action Items</h2>
            {meeting.action_items?.length === 0 ? (
              <p className="text-gray-400">No action items found.</p>
            ) : (
              <div className="space-y-3">
                {meeting.action_items?.map((item, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <p className="text-gray-800 text-sm">{item.description}</p>
                    <div className="flex gap-4 mt-2">
                      {item.assignee && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">👤 {item.assignee}</span>}
                      {item.due_date && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">📅 {item.due_date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Decisions Made</h2>
            {meeting.decisions?.length === 0 ? (
              <p className="text-gray-400">No decisions found.</p>
            ) : (
              <ul className="space-y-2">
                {meeting.decisions?.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {d.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Full Transcript</h2>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
              {meeting.transcript || 'No transcript available.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}