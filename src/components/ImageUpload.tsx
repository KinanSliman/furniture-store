'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageData {
  id?: string;
  url: string;
  publicId: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

interface ImageUploadProps {
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload image');
        }

        const data = await response.json();
        return {
          url: data.image.url,
          publicId: data.image.publicId,
          altText: '',
          isPrimary: images.length === 0, // First image is primary
          displayOrder: images.length,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedImages]);
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const imageToDelete = images[index];

    try {
      // Delete from Cloudinary
      const response = await fetch(`/api/admin/upload?publicId=${encodeURIComponent(imageToDelete.publicId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Remove from state
      const newImages = images.filter((_, i) => i !== index);

      // If deleted image was primary, make first image primary
      if (imageToDelete.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }

      // Update display order
      newImages.forEach((img, i) => {
        img.displayOrder = i;
      });

      onImagesChange(newImages);
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onImagesChange(newImages);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-50'
            : 'border-slate-300 hover:border-slate-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {isUploading ? (
            <>
              <Loader2 size={48} className="text-purple-600 animate-spin" />
              <p className="text-slate-600 font-medium">Uploading images...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload size={32} className="text-purple-600" />
              </div>
              <div className="text-center">
                <p className="text-slate-900 font-medium mb-1">
                  Drag and drop images here, or click to browse
                </p>
                <p className="text-sm text-slate-500">
                  PNG, JPG or WebP (max 5MB per image, up to {maxImages} images)
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={isUploading}
                />
                <div className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                  Choose Files
                </div>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                image.isPrimary ? 'border-purple-500' : 'border-slate-200'
              }`}
            >
              <img
                src={image.url}
                alt={image.altText || `Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="px-3 py-1 bg-white text-slate-900 text-sm rounded-lg font-medium hover:bg-slate-100 transition-colors"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded">
                  Primary
                </div>
              )}

              {/* Display Order */}
              <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isUploading && (
        <div className="text-center py-8">
          <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
