import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function UploadComponent({ seizureId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      id: uuidv4(),
      file,
      description: ''
    }));
    setFiles([...files, ...newFiles]);
  };
  
  const handleDescriptionChange = (id, description) => {
    setFiles(files.map(f => 
      f.id === id ? { ...f, description } : f
    ));
  };
  
  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };
  
  const handleSubmit = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      files.forEach(({ file, description }) => {
        formData.append('files', file);
        formData.append('descriptions', description);
      });
      formData.append('seizureId', seizureId);
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files');
      }
      
      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Documents
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Files to upload</h3>
          <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
            {files.map(({ id, file, description }) => (
              <li key={id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div className="w-0 flex-1 flex items-center">
                  <span className="flex-1 w-0 truncate">
                    {file.name}
                  </span>
                </div>
                <div className="ml-4 flex-shrink-0 flex space-x-4">
                  <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => handleDescriptionChange(id, e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(id)}
                    className="bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus:outline-none"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}
    </div>
  );
}