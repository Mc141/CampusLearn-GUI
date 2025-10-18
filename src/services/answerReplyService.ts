import { supabase } from '../lib/supabase';
import { AnswerReply } from '../types';

export interface CreateAnswerReplyData {
  answerId: string;
  content: string;
  isAnonymous: boolean;
}

export interface AnswerReplyWithAuthor extends AnswerReply {
  authorName?: string;
}

export const answerReplyService = {
  // Get all replies for an answer
  async getRepliesByAnswer(answerId: string): Promise<AnswerReplyWithAuthor[]> {
    try {
      const { data, error } = await supabase
        .from('answer_replies')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .eq('answer_id', answerId)
        .eq('is_moderated', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching answer replies:', error);
        throw error;
      }

      return (data || []).map(reply => ({
        id: reply.id,
        answerId: reply.answer_id,
        content: reply.content,
        authorId: reply.author_id,
        isAnonymous: reply.is_anonymous,
        upvotes: reply.upvotes || 0,
        isModerated: reply.is_moderated,
        createdAt: new Date(reply.created_at),
        updatedAt: new Date(reply.updated_at),
        authorName: reply.author ? 
          `${reply.author.first_name} ${reply.author.last_name}` : 
          'Anonymous'
      }));
    } catch (error) {
      console.error('Error in getRepliesByAnswer:', error);
      throw error;
    }
  },

  // Create a reply to an answer
  async createAnswerReply(
    replyData: CreateAnswerReplyData,
    authorId?: string
  ): Promise<AnswerReply> {
    try {
      const { data, error } = await supabase
        .from('answer_replies')
        .insert([{
          answer_id: replyData.answerId,
          content: replyData.content,
          author_id: authorId,
          is_anonymous: replyData.isAnonymous,
          upvotes: 0,
          is_moderated: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating answer reply:', error);
        throw error;
      }

      return {
        id: data.id,
        answerId: data.answer_id,
        content: data.content,
        authorId: data.author_id,
        isAnonymous: data.is_anonymous,
        upvotes: data.upvotes || 0,
        isModerated: data.is_moderated,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in createAnswerReply:', error);
      throw error;
    }
  },

  // Upvote an answer reply
  async upvoteReply(replyId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_upvotes', {
        table_name: 'answer_replies',
        row_id: replyId
      });

      if (error) {
        console.error('Error upvoting answer reply:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in upvoteReply:', error);
      throw error;
    }
  },

  // Delete an answer reply (soft delete)
  async deleteReply(replyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('answer_replies')
        .update({ is_moderated: true })
        .eq('id', replyId);

      if (error) {
        console.error('Error deleting answer reply:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteReply:', error);
      throw error;
    }
  },

  // Moderate an answer reply
  async moderateReply(replyId: string, isModerated: boolean = true): Promise<void> {
    try {
      const { error } = await supabase
        .from('answer_replies')
        .update({ is_moderated: isModerated })
        .eq('id', replyId);

      if (error) {
        console.error('Error moderating answer reply:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in moderateReply:', error);
      throw error;
    }
  }
};
