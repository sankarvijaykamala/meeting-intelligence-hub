import { useState } from 'react';
import { processMeeting } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function UploadForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    transcript_text: ''
  });
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'audio'

  const handleSubmit = async () => {
    if (!formData.title || !formData.date) {
      setError('Title and date are required.');
      return;
    }
    if (inputMode === 'text' && !formData.transcript_text) {
      setError('Please paste a transcript.');
      return;
    }
    if (inputMode === 'audio' && !audioFile) {
      setError('Please select an audio file.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('date', formData.date);
      if (inputMode === 'text') {
        data.append('transcript_text', formData.transcript_text);
      } else {
        data.append('audio', audioFile);
      }

      const response = await processMeeting(data);
      navigate(`/meeting/${response.data.meeting_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Meeting</h2>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="e.g. Q2 Planning Standup"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Input Type</label>
          <div className="flex gap-3">
            <button
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Paste Transcript
            </button>
            <button
              onClick={() => setInputMode('audio')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                inputMode === 'audio' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Upload Audio
            </button>
          </div>
        </div>

        {inputMode === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transcript</label>
            <textarea
              value={formData.transcript_text}
              onChange={e => setFormData({...formData, transcript_text: e.target.value})}
              placeholder="Paste your meeting transcript here..."
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audio File</label>
            <input
              type="file"
              accept="audio/*"
              onChange={e => setAudioFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Supported: mp3, wav, m4a, mp4</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-medium transition"
        >
          {loading ? '⏳ Processing with AI...' : '🚀 Process Meeting'}
        </button>
      </div>
    </div>
  );
}