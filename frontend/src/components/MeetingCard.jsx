import { Link } from 'react-router-dom';
import { deleteMeeting } from '../api/api';

export default function MeetingCard({ meeting, onDelete }) {
  const handleDelete = async () => {
    if (window.confirm('Delete this meeting?')) {
      await deleteMeeting(meeting.id);
      onDelete(meeting.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{meeting.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{meeting.date}</p>
        </div>
        <button
          onClick={handleDelete}
          className="text-red-400 hover:text-red-600 text-sm"
        >
          Delete
        </button>
      </div>
      {meeting.summary && (
        <p className="text-gray-600 text-sm mt-3 line-clamp-2">{meeting.summary}</p>
      )}
      <Link
        to={`/meeting/${meeting.id}`}
        className="mt-4 inline-block text-blue-600 hover:underline text-sm font-medium"
      >
        View Details →
      </Link>
    </div>
  );
}