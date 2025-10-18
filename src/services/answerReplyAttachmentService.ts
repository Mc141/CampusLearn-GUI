import { supabase } from '../lib/supabase';
import { AnswerReplyAttachment } from '../types';
import { fileUploadService } from './fileUploadService';

export interface CreateAnswerReplyAttachmentData {
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'link' | 'document';
  url: string;
  fileName: string;
  filePath: string;
  replyId: string;
  uploadedBy?: string;
  size: number;
  tags?: Record<string, any>;
}

export const answerReplyAttachmentService = {
  // Get all attachments for an answer reply
  async getAttachmentsForReply(replyId: string): Promise<AnswerReplyAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('answer_reply_attachments')
        .select('*')
        .eq('reply_id', replyId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching answer reply attachments:', error);
        throw error;
      }

      return (data || []).map(attachment => this.mapAttachmentToAnswerReplyAttachment(attachment));
    } catch (error) {
      console.error('Error in getAttachmentsForReply:', error);
      throw error;
    }
  },

  // Create a new attachment for an answer reply
  async createAttachment(attachmentData: CreateAnswerReplyAttachmentData): Promise<AnswerReplyAttachment> {
    try {
      const { data, error } = await supabase
        .from('answer_reply_attachments')
        .insert([{
          title: attachmentData.title,
          description: attachmentData.description,
          type: attachmentData.type,
          url: attachmentData.url,
          file_name: attachmentData.fileName,
          file_path: attachmentData.filePath,
          reply_id: attachmentData.replyId,
          uploaded_by: attachmentData.uploadedBy,
          size: attachmentData.size,
          downloads: 0,
          tags: attachmentData.tags || {},
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating answer reply attachment:', error);
        throw error;
      }

      if (!data || !data.id) {
        throw new Error('No data returned from database insert');
      }

      return this.mapAttachmentToAnswerReplyAttachment(data);
    } catch (error) {
      console.error('Error in createAttachment:', error);
      throw error;
    }
  },

  // Update an attachment
  async updateAttachment(attachmentId: string, updates: Partial<CreateAnswerReplyAttachmentData>): Promise<AnswerReplyAttachment> {
    try {
      const { data, error } = await supabase
        .from('answer_reply_attachments')
        .update({
          title: updates.title,
          description: updates.description,
          type: updates.type,
          url: updates.url,
          file_name: updates.fileName,
          file_path: updates.filePath,
          size: updates.size,
          tags: updates.tags
        })
        .eq('id', attachmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating answer reply attachment:', error);
        throw error;
      }

      return this.mapAttachmentToAnswerReplyAttachment(data);
    } catch (error) {
      console.error('Error in updateAttachment:', error);
      throw error;
    }
  },

  // Delete an attachment (soft delete)
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('answer_reply_attachments')
        .update({ is_active: false })
        .eq('id', attachmentId);

      if (error) {
        console.error('Error deleting answer reply attachment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteAttachment:', error);
      throw error;
    }
  },

  // Increment download count
  async incrementDownloadCount(attachmentId: string): Promise<void> {
    try {
      // First get the current download count
      const { data: currentData, error: fetchError } = await supabase
        .from('answer_reply_attachments')
        .select('downloads')
        .eq('id', attachmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching current download count:', fetchError);
        throw fetchError;
      }

      const currentDownloads = currentData?.downloads || 0;

      // Then update with incremented count
      const { error } = await supabase
        .from('answer_reply_attachments')
        .update({ downloads: currentDownloads + 1 })
        .eq('id', attachmentId);

      if (error) {
        console.error('Error incrementing download count:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in incrementDownloadCount:', error);
      throw error;
    }
  },

  // Upload files to an answer reply
  async uploadFilesToReply(
    replyId: string,
    files: File[],
    userId: string,
    onProgress?: (progress: { fileName: string; progress: number; status: 'uploading' | 'completed' | 'error' }) => void
  ): Promise<AnswerReplyAttachment[]> {
    const uploadedAttachments: AnswerReplyAttachment[] = [];

    for (const file of files) {
      try {
        onProgress?.({ fileName: file.name, progress: 0, status: 'uploading' });

        // Upload file to storage
        const uploadResult = await fileUploadService.uploadFile(file, userId);
        
        onProgress?.({ fileName: file.name, progress: 50, status: 'uploading' });

        // Create attachment record
        const attachmentData: CreateAnswerReplyAttachmentData = {
          title: file.name,
          description: `Uploaded file: ${file.name}`,
          type: this.getFileType(file),
          url: uploadResult.url,
          fileName: file.name,
          filePath: uploadResult.filePath,
          replyId: replyId,
          uploadedBy: userId,
          size: file.size,
          tags: {}
        };

        const attachment = await this.createAttachment(attachmentData);
        uploadedAttachments.push(attachment);

        onProgress?.({ fileName: file.name, progress: 100, status: 'completed' });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        onProgress?.({ fileName: file.name, progress: 0, status: 'error' });
        throw error;
      }
    }

    return uploadedAttachments;
  },

  // Helper function to determine file type
  getFileType(file: File): 'pdf' | 'video' | 'audio' | 'image' | 'link' | 'document' {
    const type = file.type.toLowerCase();
    
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('video')) return 'video';
    if (type.includes('audio')) return 'audio';
    if (type.includes('image')) return 'image';
    
    // Check file extension for common document types
    const extension = file.name.toLowerCase().split('.').pop();
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) return 'document';
    
    return 'document'; // Default fallback
  },

  // Helper function to map database attachment to AnswerReplyAttachment
  mapAttachmentToAnswerReplyAttachment(attachment: any): AnswerReplyAttachment {
    return {
      id: attachment.id,
      title: attachment.title,
      description: attachment.description,
      type: attachment.type || 'document',
      url: attachment.url,
      fileName: attachment.file_name,
      filePath: attachment.file_path,
      replyId: attachment.reply_id,
      uploadedBy: attachment.uploaded_by,
      size: attachment.size || 0,
      downloads: attachment.downloads || 0,
      tags: attachment.tags || {},
      isActive: attachment.is_active,
      createdAt: new Date(attachment.created_at),
      updatedAt: new Date(attachment.updated_at)
    };
  }
};
