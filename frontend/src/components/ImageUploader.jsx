import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function ImageUploader({ onUploadSuccess, label = 'Upload Image', presetUrl = '', className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(presetUrl);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side file type check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, GIF, or WEBP).');
      return;
    }

    // Size limit check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setError('');
    setSuccess(false);
    setUploading(true);

    // Create local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        const remoteUrl = res.data.url;
        setPreview(remoteUrl);
        setSuccess(true);
        onUploadSuccess(remoteUrl);
      } else {
        setError('Upload failed. Try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-[10px] uppercase font-bold text-adventure-muted block">{label}</label>}
      <div className="flex items-center space-x-4">
        {/* Preview block */}
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-[#121212] flex items-center justify-center flex-shrink-0 relative">
          {preview ? (
            <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="text-adventure-muted w-6 h-6" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-adventure-yellow animate-spin" />
            </div>
          )}
          {success && (
            <div className="absolute top-1 right-1 bg-adventure-green text-white p-0.5 rounded-full">
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="flex-grow">
          <label className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-white/10 hover:border-adventure-yellow/30 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white cursor-pointer transition-all">
            <Upload size={14} className="text-adventure-yellow" />
            <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {error && <p className="text-[10px] text-adventure-red mt-1.5">{error}</p>}
          {!error && !uploading && !success && (
            <p className="text-[9px] text-adventure-muted mt-1.5">JPEG, PNG, WEBP up to 5MB</p>
          )}
          {success && (
            <p className="text-[9px] text-adventure-green mt-1.5 font-bold uppercase tracking-wider">Uploaded successfully!</p>
          )}
        </div>
      </div>
    </div>
  );
}
