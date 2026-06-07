import { useState, useEffect } from 'react';
import { getMeetings } from '../api/api';
import MeetingCard from '../components/MeetingCard';

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeetings()
      .then(res => setMeetings(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading meetings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">{meetings.length} meetings recorded</p>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🎙️</p>
          <p className="text-lg">No meetings yet. Upload your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {meetings.map(meeting => (
            <MeetingCard key={meeting.id} meeting={meeting} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}