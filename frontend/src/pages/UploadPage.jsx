import UploadForm from '../components/UploadForm';

export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Process New Meeting</h1>
      <UploadForm />
    </div>
  );
}