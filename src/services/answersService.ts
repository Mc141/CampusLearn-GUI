import { supabase } from '../lib/supabase';
import { Answer } from '../types';
import { tutorTopicAssignmentService } from './tutorTopicAssignmentService';

export interface CreateAnswerData {
  content: string;
}

export interface AnswerWithDetails extends Answer {
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const answersService = {
  // Get all answers for a question
  async getAnswersByQuestion(questionId: string): Promise<AnswerWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('answers')
        .select(`
          *,
          tutor:users!answers_tutor_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching answers:', error);
        throw error;
      }

      return data.map(answer => ({
        id: answer.id,
        questionId: answer.question_id,
        tutorId: answer.tutor_id,
        content: answer.content,
        isAccepted: answer.is_accepted,
        upvotes: answer.upvotes,
        createdAt: new Date(answer.created_at),
        updatedAt: new Date(answer.updated_at),
        tutor: {
          id: answer.tutor.id,
          firstName: answer.tutor.first_name,
          lastName: answer.tutor.last_name,
          email: answer.tutor.email,
        },
        replies: [] // Initialize empty replies array
      }));
    } catch (error) {
      console.error('Error in getAnswersByQuestion:', error);
      throw error;
    }
  },

  // Create a new answer
  async createAnswer(questionId: string, tutorId: string, answerData: CreateAnswerData): Promise<Answer> {
    try {
      // First get the question to find the topic
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('topic_id')
        .eq('id', questionId)
        .single();

      if (questionError) {
        console.error('Error fetching question:', questionError);
        throw questionError;
      }

      // Check if tutor is assigned to this topic
      const canAnswer = await tutorTopicAssignmentService.canTutorAnswerForTopic(question.topic_id, tutorId);
      if (!canAnswer) {
        throw new Error('You are not assigned to this topic and cannot answer questions for it');
      }

      const { data, error } = await supabase
        .from('answers')
        .insert([
          {
            question_id: questionId,
            tutor_id: tutorId,
            content: answerData.content,
            is_accepted: false,
            upvotes: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating answer:', error);
        throw error;
      }

      // Update question status to 'answered' if it was 'open'
      await supabase
        .from('questions')
        .update({ 
          status: 'answered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId)
        .eq('status', 'open');

      return {
        id: data.id,
        questionId: data.question_id,
        tutorId: data.tutor_id,
        content: data.content,
        isAccepted: data.is_accepted,
        upvotes: data.upvotes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in createAnswer:', error);
      throw error;
    }
  },

  // Accept an answer
  async acceptAnswer(answerId: string, questionId: string): Promise<void> {
    try {
      // First, unaccept all other answers for this question
      await supabase
        .from('answers')
        .update({ 
          is_accepted: false,
          updated_at: new Date().toISOString(),
        })
        .eq('question_id', questionId);

      // Then accept the selected answer
      const { error } = await supabase
        .from('answers')
        .update({ 
          is_accepted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', answerId);

      if (error) {
        console.error('Error accepting answer:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in acceptAnswer:', error);
      throw error;
    }
  },

  // Toggle vote for an answer (like/unlike)
  async toggleAnswerVote(answerId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('toggle_vote', {
        p_table_name: 'answers',
        p_entity_id: answerId,
        p_user_id: userId,
        p_vote_type: 'upvote'
      });

      if (error) {
        console.error('Error toggling answer vote:', error);
        throw error;
      }

      return {
        voteCount: data.vote_count,
        hasVoted: data.has_voted
      };
    } catch (error) {
      console.error('Error in toggleAnswerVote:', error);
      throw error;
    }
  },

  // Get vote info for an answer
  async getAnswerVoteInfo(answerId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('get_vote_info', {
        p_table_name: 'answers',
        p_entity_id: answerId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting answer vote info:', error);
        throw error;
      }

      return {
        voteCount: data.vote_count,
        hasVoted: data.has_voted
      };
    } catch (error) {
      console.error('Error in getAnswerVoteInfo:', error);
      throw error;
    }
  },

  // Update an answer
  async updateAnswer(answerId: string, content: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('answers')
        .update({ 
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', answerId);

      if (error) {
        console.error('Error updating answer:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateAnswer:', error);
      throw error;
    }
  },

  // Delete an answer
  async deleteAnswer(answerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('answers')
        .delete()
        .eq('id', answerId);

      if (error) {
        console.error('Error deleting answer:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteAnswer:', error);
      throw error;
    }
  },
};
