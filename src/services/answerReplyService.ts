import { supabase } from '../lib/supabase';
import { AnswerReply } from '../types';
import { notificationService } from './notificationService';

export interface CreateAnswerReplyData {
  answerId: string;
  content: string;
  isAnonymous: boolean;
}

export interface AnswerReplyWithAuthor extends AnswerReply {
  authorName?: string;
  isModerated?: boolean;
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

      const reply = {
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

      // Create notification for the answer author (if not replying to their own answer)
      try {
        if (authorId) {
          // Get answer details to find the author and topic
          const { data: answerData } = await supabase
            .from('answers')
            .select(`
              tutor_id,
              question:questions(
                title,
                topic:topics(title)
              )
            `)
            .eq('id', replyData.answerId)
            .single();

          if (answerData && answerData.tutor_id !== authorId) {
            // Get replier's name
            const { data: replierData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', authorId)
              .single();

            if (replierData && answerData.question?.topic?.title) {
              const replierName = replyData.isAnonymous ? 'Anonymous' : `${replierData.first_name} ${replierData.last_name}`;
              await notificationService.notifyTopicReply(
                answerData.tutor_id, 
                replierName, 
                answerData.question.topic.title, 
                replyData.answerId
              );
            }
          }
        }
      } catch (notificationError) {
        console.error('Error creating topic reply notification:', notificationError);
        // Don't fail the reply creation if notification fails
      }

      return reply;
    } catch (error) {
      console.error('Error in createAnswerReply:', error);
      throw error;
    }
  },

  // Toggle vote for an answer reply (like/unlike)
  async toggleReplyVote(replyId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('toggle_vote', {
        p_table_name: 'answer_replies',
        p_entity_id: replyId,
        p_user_id: userId,
        p_vote_type: 'upvote'
      });

      if (error) {
        console.error('Error toggling answer reply vote:', error);
        throw error;
      }

      return {
        voteCount: data.vote_count,
        hasVoted: data.has_voted
      };
    } catch (error) {
      console.error('Error in toggleReplyVote:', error);
      throw error;
    }
  },

  // Get vote info for an answer reply
  async getReplyVoteInfo(replyId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('get_vote_info', {
        p_table_name: 'answer_replies',
        p_entity_id: replyId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting answer reply vote info:', error);
        throw error;
      }

      return {
        voteCount: data.vote_count,
        hasVoted: data.has_voted
      };
    } catch (error) {
      console.error('Error in getReplyVoteInfo:', error);
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
  },

  // Get all answer replies for moderation (including moderated ones)
  async getAllAnswerRepliesForModeration(): Promise<AnswerReplyWithAuthor[]> {
    try {
      const { data, error } = await supabase
        .from('answer_replies')
        .select(`
          *,
          author:users(first_name, last_name),
          answer:answers(
            id,
            content,
            question:questions(
              id,
              title,
              topic:topics(
                id,
                title,
                module_code
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching answer replies for moderation:', error);
        throw error;
      }

      return (data || []).map(reply => ({
        id: reply.id,
        answerId: reply.answer_id,
        content: reply.content,
        authorId: reply.author_id,
        isAnonymous: reply.is_anonymous,
        upvotes: reply.upvotes || 0,
        isModerated: reply.is_moderated || false,
        createdAt: new Date(reply.created_at),
        updatedAt: new Date(reply.updated_at),
        authorName: reply.author ? 
          `${reply.author.first_name} ${reply.author.last_name}` : 
          'Anonymous'
      }));
    } catch (error) {
      console.error('Error in getAllAnswerRepliesForModeration:', error);
      throw error;
    }
  }
};
