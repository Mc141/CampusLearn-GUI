import { supabase } from '../lib/supabase';

export interface ForumAttachment {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'link' | 'document' | 'presentation' | 'spreadsheet' | 'text';
  url: string;
  file_name: string;
  file_path: string;
  post_id?: string;
  reply_id?: string;
  uploaded_by: string;
  size?: number;
  downloads: number;
  tags: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  uploaded_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const forumAttachmentService = {
  // Get attachments for a specific post
  async getAttachmentsForPost(postId: string): Promise<ForumAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('forum_attachments')
        .select(`
          *,
          uploaded_by_user:users(id, first_name, last_name, profile_picture)
        `)
        .eq('post_id', postId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapAttachmentToForumAttachment);
    } catch (error) {
      console.error('Error fetching post attachments:', error);
      throw error;
    }
  },

  // Get attachments for a specific reply
  async getAttachmentsForReply(replyId: string): Promise<ForumAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('forum_attachments')
        .select(`
          *,
          uploaded_by_user:users(id, first_name, last_name, profile_picture)
        `)
        .eq('reply_id', replyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapAttachmentToForumAttachment);
    } catch (error) {
      console.error('Error fetching reply attachments:', error);
      throw error;
    }
  },

  // Get attachments by user
  async getAttachmentsByUser(userId: string): Promise<ForumAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('forum_attachments')
        .select(`
          *,
          uploaded_by_user:users(id, first_name, last_name, profile_picture)
        `)
        .eq('uploaded_by', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapAttachmentToForumAttachment);
    } catch (error) {
      console.error('Error fetching user attachments:', error);
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
    post_id?: string;
    reply_id?: string;
    uploaded_by: string;
    size?: number;
    tags?: string[];
  }): Promise<ForumAttachment> {
    try {
      // Ensure at least one of post_id or reply_id is provided
      if (!attachmentData.post_id && !attachmentData.reply_id) {
        throw new Error('Either post_id or reply_id must be provided');
      }

      const { data, error } = await supabase
        .from('forum_attachments')
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
      return this.mapAttachmentToForumAttachment(data);
    } catch (error) {
      console.error('Error creating attachment:', error);
      throw error;
    }
  },

  // Update an attachment
  async updateAttachment(attachmentId: string, updates: Partial<ForumAttachment>): Promise<ForumAttachment> {
    try {
      const { data, error } = await supabase
        .from('forum_attachments')
        .update(updates)
        .eq('id', attachmentId)
        .select(`
          *,
          uploaded_by_user:users(id, first_name, last_name, profile_picture)
        `)
        .single();

      if (error) throw error;
      if (!data || !data.id) {
        throw new Error('No data returned from database update');
      }
      return this.mapAttachmentToForumAttachment(data);
    } catch (error) {
      console.error('Error updating attachment:', error);
      throw error;
    }
  },

  // Delete an attachment (soft delete)
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('forum_attachments')
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
      // First get the current download count
      const { data: currentAttachment, error: fetchError } = await supabase
        .from('forum_attachments')
        .select('downloads')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      // Then update with the incremented count
      const { error } = await supabase
        .from('forum_attachments')
        .update({ downloads: (currentAttachment?.downloads || 0) + 1 })
        .eq('id', attachmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      throw error;
    }
  },

  // Upload files to a post
  async uploadFilesToPost(
    postId: string,
    files: File[],
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ForumAttachment[]> {
    const uploadedAttachments: ForumAttachment[] = [];

    for (const file of files) {
      try {
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        onProgress?.({
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        });

        // Upload file to Supabase Storage
        const filePath = `forum-attachments/${postId}/${fileId}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('CampusLearn Resources')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('CampusLearn Resources')
          .getPublicUrl(filePath);

        onProgress?.({
          fileId,
          fileName: file.name,
          progress: 50,
          status: 'uploading'
        });

        // Create attachment record
        const attachment = await this.createAttachment({
          title: file.name,
          description: `Uploaded file: ${file.name}`,
          type: this.getFileType(file.type),
          url: urlData.publicUrl,
          file_name: file.name,
          file_path: filePath,
          post_id: postId,
          uploaded_by: userId,
          size: file.size,
          tags: []
        });

        uploadedAttachments.push(attachment);

        onProgress?.({
          fileId,
          fileName: file.name,
          progress: 100,
          status: 'completed'
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        onProgress?.({
          fileId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    return uploadedAttachments;
  },

  // Upload files to a reply
  async uploadFilesToReply(
    replyId: string,
    files: File[],
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ForumAttachment[]> {
    const uploadedAttachments: ForumAttachment[] = [];

    for (const file of files) {
      try {
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        onProgress?.({
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        });

        // Upload file to Supabase Storage
        const filePath = `forum-attachments/replies/${replyId}/${fileId}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('CampusLearn Resources')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('CampusLearn Resources')
          .getPublicUrl(filePath);

        onProgress?.({
          fileId,
          fileName: file.name,
          progress: 50,
          status: 'uploading'
        });

        // Create attachment record
        const attachment = await this.createAttachment({
          title: file.name,
          description: `Uploaded file: ${file.name}`,
          type: this.getFileType(file.type),
          url: urlData.publicUrl,
          file_name: file.name,
          file_path: filePath,
          reply_id: replyId,
          uploaded_by: userId,
          size: file.size,
          tags: []
        });

        uploadedAttachments.push(attachment);

        onProgress?.({
          fileId,
          fileName: file.name,
          progress: 100,
          status: 'completed'
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        onProgress?.({
          fileId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    return uploadedAttachments;
  },

  // Helper method to determine file type from MIME type
  getFileType(mimeType: string): 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'presentation' | 'spreadsheet' | 'text' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.startsWith('text/')) return 'text';
    return 'document';
  },

  // Helper method to map database data to ForumAttachment interface
  mapAttachmentToForumAttachment(data: any): ForumAttachment {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type || 'document',
      url: data.url,
      file_name: data.file_name,
      file_path: data.file_path,
      post_id: data.post_id,
      reply_id: data.reply_id,
      uploaded_by: data.uploaded_by,
      size: data.size,
      downloads: data.downloads || 0,
      tags: data.tags || [],
      is_active: data.is_active,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      uploaded_by_user: data.uploaded_by_user ? {
        id: data.uploaded_by_user.id,
        first_name: data.uploaded_by_user.first_name,
        last_name: data.uploaded_by_user.last_name,
        profile_picture: data.uploaded_by_user.profile_picture,
      } : undefined,
    };
  },
};
