import React, { useState, useEffect } from 'react';
import { Upload, Loader2, X, Plus } from 'lucide-react';
import axios from 'axios';

export default function MultiImageUploader({ onUploadSuccess, label = 'Upload Trek Photos (Max 7)', presetUrls = [], className = '' }) {
  const maxFiles = 7;
  const [images, setImages] = useState(presetUrls);
  const [uploadingFiles, setUploadingFiles] = useState([]); // Array of { id, progress, error }
  const [generalError, setGeneralError] = useState('');

  // Sync state if presetUrls change
  useEffect(() => {
    if (presetUrls && presetUrls.length > 0) {
      setImages(presetUrls);
    }
  }, [presetUrls]);

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setGeneralError('');
    const currentSlotsAvailable = maxFiles - (images.length + uploadingFiles.length);

    if (currentSlotsAvailable <= 0) {
      setGeneralError(`Maximum limit of ${maxFiles} photos reached.`);
      return;
    }

    const filesToUpload = files.slice(0, currentSlotsAvailable);
    if (files.length > currentSlotsAvailable) {
      setGeneralError(`Only the first ${currentSlotsAvailable} selected images will be uploaded (Max 7 total).`);
    }

    // Process file validation and preparation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validFiles = [];

    for (const file of filesToUpload) {
      if (!allowedTypes.includes(file.type)) {
        setGeneralError('Please select only valid images (JPEG, PNG, GIF, or WEBP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setGeneralError('Each image must be smaller than 5MB.');
        return;
      }
      validFiles.push(file);
    }

    // Add files to uploading state
    const newUploads = validFiles.map((file, idx) => ({
      id: `upload-${Date.now()}-${idx}`,
      file,
      loading: true
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    // Concurrently upload files
    await Promise.all(
      newUploads.map(async (uploadItem) => {
        try {
          const formData = new FormData();
          formData.append('image', uploadItem.file);

          const res = await axios.post('http://localhost:5000/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (res.data.status === 'success') {
            const url = res.data.url;
            setImages(prev => {
              const updated = [...prev, url];
              onUploadSuccess(updated);
              return updated;
            });
          } else {
            setGeneralError('One or more uploads failed.');
          }
        } catch (err) {
          setGeneralError(err.response?.data?.message || 'Connection error during one of the uploads.');
        } finally {
          // Remove from uploading list
          setUploadingFiles(prev => prev.filter(item => item.id !== uploadItem.id));
        }
      })
    );
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updated);
    onUploadSuccess(updated);
  };

  // Build grid slots
  const renderSlots = () => {
    const slots = [];
    const totalCurrentCount = images.length + uploadingFiles.length;

    // 1. Render uploaded images
    images.forEach((url, index) => {
      slots.push(
        <div key={`img-${index}`} className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/10 bg-[#121212] flex items-center justify-center flex-shrink-0">
          <img src={url} alt={`Trek Photo ${index + 1}`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => handleRemoveImage(index)}
            className="absolute top-1 right-1 bg-adventure-red text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 shadow-lg"
          >
            <X size={12} />
          </button>
        </div>
      );
    });

    // 2. Render loading slots
    uploadingFiles.forEach((uploadItem) => {
      slots.push(
        <div key={uploadItem.id} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/10 bg-[#121212]/50 flex flex-col items-center justify-center flex-shrink-0">
          <Loader2 className="w-6 h-6 text-adventure-yellow animate-spin" />
          <span className="text-[8px] text-adventure-muted mt-1 uppercase font-bold">Uploading</span>
        </div>
      );
    });

    // 3. Render empty upload slots (up to maxFiles)
    const emptySlotsCount = maxFiles - totalCurrentCount;
    for (let i = 0; i < emptySlotsCount; i++) {
      const isFirstEmpty = i === 0;
      slots.push(
        <label
          key={`empty-${i}`}
          className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-dashed border-white/10 bg-[#121212]/30 flex flex-col items-center justify-center flex-shrink-0 transition-colors ${
            isFirstEmpty && totalCurrentCount < maxFiles
              ? 'hover:border-adventure-yellow/30 hover:bg-[#121212]/50 cursor-pointer text-adventure-muted hover:text-white'
              : 'opacity-40 cursor-not-allowed text-adventure-muted'
          }`}
        >
          <Plus size={18} className={isFirstEmpty && totalCurrentCount < maxFiles ? 'text-adventure-yellow' : ''} />
          {isFirstEmpty && totalCurrentCount < maxFiles && (
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="hidden"
              disabled={totalCurrentCount >= maxFiles}
            />
          )}
        </label>
      );
    }

    return slots;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <label className="text-[10px] uppercase font-bold text-adventure-muted block">{label}</label>
        <span className="text-[10px] font-bold text-adventure-yellow bg-adventure-yellow/10 px-2 py-0.5 rounded-full border border-adventure-yellow/20">
          {images.length} / {maxFiles} Uploaded
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {renderSlots()}
      </div>

      {generalError && <p className="text-[10px] text-adventure-red font-medium">{generalError}</p>}
      {!generalError && (images.length + uploadingFiles.length) < maxFiles && (
        <p className="text-[9px] text-adventure-muted">You can select and upload multiple images (Max 7, JPEG/PNG/WEBP up to 5MB each)</p>
      )}
    </div>
  );
}
