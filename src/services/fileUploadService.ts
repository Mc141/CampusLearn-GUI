import { createClient } from '../lib/supabase-client';
import type { Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'link';
  url: string;
  size: number;
  uploadedAt: Date;
}

export class FileUploadService {
  private supabase = createClient();
  private bucketName = 'CampusLearn Resources';

  /**
   * Upload a file to Supabase Storage (direct upload)
   */
  async uploadFile(
    file: File,
    folder: string = 'chat-attachments',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    try {
      // Generate unique file name to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Validate file type and size
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Start upload progress
      const fileId = uuidv4(); // Generate proper UUID
      onProgress?.({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });

      console.log('Starting upload for:', file.name, 'to path:', filePath);

      // Upload file directly to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);

      // Complete progress
      onProgress?.({
        fileId,
        fileName: file.name,
        progress: 100,
        status: 'completed'
      });

      // Return uploaded file info
      return {
        id: fileId,
        name: file.name,
        type: this.getFileType(file.name),
        url: urlData.publicUrl,
        filePath: filePath,
        size: file.size,
        uploadedAt: new Date()
      };

    } catch (error) {
      console.error('Upload error:', error);
      const fileId = uuidv4(); // Generate proper UUID for error case too
      onProgress?.({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      });
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    folder: string = 'chat-attachments',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, folder, onProgress)
    );
    
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get file type from filename
   */
  private getFileType(fileName: string): 'pdf' | 'video' | 'audio' | 'image' | 'link' {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) return 'audio';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
    
    return 'link';
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (50MB max as per requirements)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 50MB' };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/avi', 'video/mov', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not supported' };
    }

    return { isValid: true };
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(type: string) {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'image':
        return '🖼️';
      default:
        return '📎';
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();
