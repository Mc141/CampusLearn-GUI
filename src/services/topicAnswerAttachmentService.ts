import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface TopicAnswerAttachment {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'presentation' | 'spreadsheet' | 'text' | 'link';
  url: string;
  file_name: string;
  file_path: string;
  answer_id: string;
  uploaded_by: string;
  uploaded_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  size?: number;
  downloads: number;
  tags: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const topicAnswerAttachmentService = {
  // Get attachments for a specific answer
  async getAttachmentsForAnswer(answerId: string): Promise<TopicAnswerAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('topic_resources')
        .select(`
          *,
          uploaded_by_user:users(id, first_name, last_name, profile_picture)
        `)
        .eq('answer_id', answerId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.mapResourceToTopicAnswerAttachment);
    } catch (error) {
      console.error('Error fetching answer attachments:', error);
      throw error;
    }
  },

  // Create a new attachment
  async createAttachment(attachmentData: {
    title: string;
    description?: string;
    type: string;
    url: string;
    file_name: string;
    file_path: string;
    answer_id: string;
    uploaded_by: string;
    size?: number;
    tags?: string[];
  }): Promise<TopicAnswerAttachment> {
    try {
      const { data, error } = await supabase
        .from('topic_resources')
        .insert(attachmentData)
        .select(`
          *,
          uploaded_by_user:users(id, first_name, last_name, profile_picture)
        `)
        .single();

      if (error) throw error;
      if (!data || !data.id) {
        throw new Error('No data returned from database insert');
      }
      return this.mapResourceToTopicAnswerAttachment(data);
    } catch (error) {
      console.error('Error creating attachment:', error);
      throw error;
    }
  },

  // Update an attachment
  async updateAttachment(attachmentId: string, updates: Partial<TopicAnswerAttachment>): Promise<TopicAnswerAttachment> {
    try {
      const { data, error } = await supabase
        .from('topic_resources')
        .update(updates)
        .eq('id', attachmentId)
        .select(`
          *,
          uploaded_by_user:users(id, first_name, last_name, profile_picture)
        `)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Attachment not found or update failed');
      return this.mapResourceToTopicAnswerAttachment(data);
    } catch (error) {
      console.error('Error updating attachment:', error);
      throw error;
    }
  },

  // Delete an attachment (soft delete)
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('topic_resources')
        .update({ is_active: false })
        .eq('id', attachmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  },

  // Increment download count
  async incrementDownloadCount(attachmentId: string): Promise<void> {
    try {
      const { data: currentAttachment, error: fetchError } = await supabase
        .from('topic_resources')
        .select('downloads')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('topic_resources')
        .update({ downloads: (currentAttachment?.downloads || 0) + 1 })
        .eq('id', attachmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      throw error;
    }
  },

  // Upload files to Supabase Storage and create attachment records for an answer
  async uploadFilesToAnswer(
    answerId: string,
    files: File[],
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<TopicAnswerAttachment[]> {
    const uploadedAttachments: TopicAnswerAttachment[] = [];
    for (const file of files) {
      const fileId = uuidv4();
      const sanitizedFileName = this.sanitizeFileName(file.name);
      const filePath = `topic-answer-attachments/${answerId}/${fileId}-${sanitizedFileName}`;

      onProgress?.({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });

      try {
        const { data, error: uploadError } = await supabase.storage
          .from('CampusLearn Resources')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
            onUploadProgress: (event) => {
              if (event.total > 0) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress?.({
                  fileId,
                  fileName: file.name,
                  progress,
                  status: 'uploading'
                });
              }
            },
          });

        if (uploadError) throw uploadError;

        const publicUrl = supabase.storage
          .from('CampusLearn Resources')
          .getPublicUrl(filePath).data.publicUrl;

        const attachment = await this.createAttachment({
          title: file.name,
          description: `Uploaded file: ${file.name}`,
          type: this.getFileType(file.type),
          url: publicUrl,
          file_name: file.name,
          file_path: filePath,
          answer_id: answerId,
          uploaded_by: userId,
          size: file.size,
        });
        uploadedAttachments.push(attachment);

        onProgress?.({
          fileId,
          fileName: file.name,
          progress: 100,
          status: 'success'
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        onProgress?.({
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        // Continue with other files even if one fails
      }
    }
    return uploadedAttachments;
  },

  // Helper method to sanitize filename for Supabase Storage
  sanitizeFileName(fileName: string): string {
    // Replace spaces with underscores and remove special characters
    return fileName
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/[^\w\-_.]/g, '')       // Remove special characters except word chars, hyphens, underscores, dots
      .replace(/_{2,}/g, '_')         // Replace multiple underscores with single underscore
      .replace(/^_|_$/g, '');         // Remove leading/trailing underscores
  },

  // Helper method to determine file type from MIME type
  getFileType(mimeType: string): 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'presentation' | 'spreadsheet' | 'text' | 'link' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('text/plain')) return 'text';
    return 'document'; // Default to document
  },

  mapResourceToTopicAnswerAttachment(data: any): TopicAnswerAttachment {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type || 'document', // Default to 'document' if type is undefined
      url: data.url,
      file_name: data.file_name,
      file_path: data.file_path,
      answer_id: data.answer_id,
      uploaded_by: data.uploaded_by,
      uploaded_by_user: data.uploaded_by_user ? {
        id: data.uploaded_by_user.id,
        first_name: data.uploaded_by_user.first_name,
        last_name: data.uploaded_by_user.last_name,
        profile_picture: data.uploaded_by_user.profile_picture,
      } : undefined,
      size: data.size,
      downloads: data.downloads,
      tags: data.tags || [],
      is_active: data.is_active,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  },
};
