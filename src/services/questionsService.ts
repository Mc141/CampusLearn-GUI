import { supabase } from '../lib/supabase';
import { Question, User } from '../types';

export interface CreateQuestionData {
  title: string;
  content: string;
  isAnonymous: boolean;
  tags: string[];
}

export interface QuestionWithDetails extends Question {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  answers: Array<{
    id: string;
    content: string;
    tutor: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    isAccepted: boolean;
    upvotes: number;
    createdAt: Date;
  }>;
  answerCount: number;
  isModerated?: boolean;
}

export const questionsService = {
  // Get all questions for a topic
  async getQuestionsByTopic(topicId: string): Promise<QuestionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          student:users!questions_student_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          answers:answers(
            id,
            content,
            is_accepted,
            upvotes,
            created_at,
            tutor:users!answers_tutor_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }

      return data.map(question => ({
        id: question.id,
        topicId: question.topic_id,
        studentId: question.student_id,
        title: question.title,
        content: question.content,
        isAnonymous: question.is_anonymous,
        status: question.status,
        upvotes: question.upvotes,
        tags: question.tags || [],
        createdAt: new Date(question.created_at),
        updatedAt: new Date(question.updated_at),
        student: {
          id: question.student.id,
          firstName: question.student.first_name,
          lastName: question.student.last_name,
          email: question.student.email,
        },
        answers: question.answers.map(answer => ({
          id: answer.id,
          content: answer.content,
          tutor: {
            id: answer.tutor.id,
            firstName: answer.tutor.first_name,
            lastName: answer.tutor.last_name,
            email: answer.tutor.email,
          },
          isAccepted: answer.is_accepted,
          upvotes: answer.upvotes,
          createdAt: new Date(answer.created_at),
        })),
        answerCount: question.answers.length,
      }));
    } catch (error) {
      console.error('Error in getQuestionsByTopic:', error);
      throw error;
    }
  },

  // Create a new question
  async createQuestion(topicId: string, studentId: string, questionData: CreateQuestionData): Promise<Question> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([
          {
            topic_id: topicId,
            student_id: studentId,
            title: questionData.title,
            content: questionData.content,
            is_anonymous: questionData.isAnonymous,
            tags: questionData.tags,
            status: 'open',
            upvotes: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating question:', error);
        throw error;
      }

      return {
        id: data.id,
        topicId: data.topic_id,
        studentId: data.student_id,
        title: data.title,
        content: data.content,
        isAnonymous: data.is_anonymous,
        status: data.status,
        upvotes: data.upvotes,
        tags: data.tags || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in createQuestion:', error);
      throw error;
    }
  },

  // Update question status
  async updateQuestionStatus(questionId: string, status: 'open' | 'answered' | 'closed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) {
        console.error('Error updating question status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateQuestionStatus:', error);
      throw error;
    }
  },

  // Toggle vote for a question (like/unlike)
  async toggleQuestionVote(questionId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('toggle_vote', {
        p_table_name: 'questions',
        p_entity_id: questionId,
        p_user_id: userId,
        p_vote_type: 'upvote'
      });

      if (error) {
        console.error('Error toggling question vote:', error);
        throw error;
      }

      return {
        voteCount: data.vote_count,
        hasVoted: data.has_voted
      };
    } catch (error) {
      console.error('Error in toggleQuestionVote:', error);
      throw error;
    }
  },

  // Get vote info for a question
  async getQuestionVoteInfo(questionId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('get_vote_info', {
        p_table_name: 'questions',
        p_entity_id: questionId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting question vote info:', error);
        throw error;
      }

      return {
        voteCount: data.vote_count,
        hasVoted: data.has_voted
      };
    } catch (error) {
      console.error('Error in getQuestionVoteInfo:', error);
      throw error;
    }
  },

  // Get question count for a topic
  async getQuestionCount(topicId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId);

      if (error) {
        console.error('Error getting question count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getQuestionCount:', error);
      throw error;
    }
  },

  // Get all questions by a specific student
  async getQuestionsByStudent(studentId: string): Promise<QuestionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          student:users!questions_student_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          answers:answers(
            id,
            content,
            tutor:users!answers_tutor_id_fkey(
              id,
              first_name,
              last_name,
              email
            ),
            is_accepted,
            upvotes,
            created_at
          ),
          topic:topics(
            id,
            title,
            module_code
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching questions by student:', error);
        throw error;
      }

      return data.map(question => ({
        id: question.id,
        title: question.title,
        content: question.content,
        isAnonymous: question.is_anonymous,
        tags: question.tags || [],
        status: question.status,
        topicId: question.topic_id,
        studentId: question.student_id,
        createdAt: new Date(question.created_at),
        updatedAt: question.updated_at ? new Date(question.updated_at) : new Date(question.created_at),
        student: {
          id: question.student.id,
          firstName: question.student.first_name,
          lastName: question.student.last_name,
          email: question.student.email,
        },
        answers: question.answers.map(answer => ({
          id: answer.id,
          content: answer.content,
          tutor: {
            id: answer.tutor.id,
            firstName: answer.tutor.first_name,
            lastName: answer.tutor.last_name,
            email: answer.tutor.email,
          },
          isAccepted: answer.is_accepted,
          upvotes: answer.upvotes,
          createdAt: new Date(answer.created_at),
        })),
        answerCount: question.answers.length,
      }));
    } catch (error) {
      console.error('Error in getQuestionsByStudent:', error);
      throw error;
    }
  },

  // Get all questions (for admin dashboard)
  async getAllQuestions(): Promise<QuestionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          student:users!questions_student_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          answers:answers(
            id,
            content,
            tutor:users!answers_tutor_id_fkey(
              id,
              first_name,
              last_name,
              email
            ),
            is_accepted,
            upvotes,
            created_at
          ),
          topic:topics(
            id,
            title,
            module_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all questions:', error);
        throw error;
      }

      return data.map(question => ({
        id: question.id,
        title: question.title,
        content: question.content,
        isAnonymous: question.is_anonymous,
        tags: question.tags || [],
        status: question.status,
        topicId: question.topic_id,
        studentId: question.student_id,
        createdAt: new Date(question.created_at),
        updatedAt: question.updated_at ? new Date(question.updated_at) : new Date(question.created_at),
        student: {
          id: question.student.id,
          firstName: question.student.first_name,
          lastName: question.student.last_name,
          email: question.student.email,
        },
        answers: question.answers.map(answer => ({
          id: answer.id,
          content: answer.content,
          tutor: {
            id: answer.tutor.id,
            firstName: answer.tutor.first_name,
            lastName: answer.tutor.last_name,
            email: answer.tutor.email,
          },
          isAccepted: answer.is_accepted,
          upvotes: answer.upvotes,
          createdAt: new Date(answer.created_at),
        })),
        answerCount: question.answers.length,
        isModerated: question.is_moderated || false,
      }));
    } catch (error) {
      console.error('Error in getAllQuestions:', error);
      throw error;
    }
  },

  // Moderate a question (hide/show)
  async moderateQuestion(questionId: string, isModerated: boolean = true): Promise<void> {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_moderated: isModerated })
        .eq('id', questionId);

      if (error) {
        console.error('Error moderating question:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in moderateQuestion:', error);
      throw error;
    }
  },

  // Get all questions for moderation (including moderated ones)
  async getAllQuestionsForModeration(): Promise<QuestionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          student:users!questions_student_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          answers:answers(
            id,
            content,
            tutor:users!answers_tutor_id_fkey(
              id,
              first_name,
              last_name,
              email
            ),
            is_accepted,
            upvotes,
            created_at
          ),
          topic:topics(
            id,
            title,
            module_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching questions for moderation:', error);
        throw error;
      }

      return data.map(question => ({
        id: question.id,
        title: question.title,
        content: question.content,
        isAnonymous: question.is_anonymous,
        tags: question.tags || [],
        status: question.status,
        topicId: question.topic_id,
        studentId: question.student_id,
        createdAt: new Date(question.created_at),
        updatedAt: question.updated_at ? new Date(question.updated_at) : new Date(question.created_at),
        student: {
          id: question.student.id,
          firstName: question.student.first_name,
          lastName: question.student.last_name,
          email: question.student.email,
        },
        answers: question.answers.map(answer => ({
          id: answer.id,
          content: answer.content,
          tutor: {
            id: answer.tutor.id,
            firstName: answer.tutor.first_name,
            lastName: answer.tutor.last_name,
            email: answer.tutor.email,
          },
          isAccepted: answer.is_accepted,
          upvotes: answer.upvotes,
          createdAt: new Date(answer.created_at),
        })),
        answerCount: question.answers.length,
        isModerated: question.is_moderated || false,
      }));
    } catch (error) {
      console.error('Error in getAllQuestionsForModeration:', error);
      throw error;
    }
  },
};
