import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
      <Link to="/" className="text-xl font-bold text-blue-400">
        🧠 Meeting Intelligence Hub
      </Link>
      <div className="flex gap-4 items-center">
        <Link to="/search" className="text-sm text-gray-300 hover:text-white transition">
          🔍 Search
        </Link>
        <Link
          to="/upload"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + New Meeting
        </Link>
      </div>
    </nav>
  );
}