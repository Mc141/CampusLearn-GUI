import { supabase } from '../lib/supabase';

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer?: number | boolean | string[]; // Index for multiple choice, boolean for true/false, array for fill blank
  explanation?: string;
}

export interface TopicQuiz {
  id: string;
  topic_id: string;
  created_by: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  time_limit?: number;
  passing_score: number;
  is_active: boolean;
  is_moderated: boolean;
  created_at: Date;
  updated_at: Date;
  created_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateQuizData {
  title: string;
  description?: string;
  questions: QuizQuestion[];
  time_limit?: number;
  passing_score?: number;
}

export interface QuizResult {
  score: number;
  percentage: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  answers: { questionId: string; userAnswer: any; correct: boolean }[];
}

export const quizService = {
  // Get all quizzes for a topic
  async getQuizzesForTopic(topicId: string): Promise<TopicQuiz[]> {
    try {
      const { data, error } = await supabase
        .from('topic_quizzes')
        .select(`
          *,
          created_by_user:users!topic_quizzes_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .eq('is_moderated', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(quizService.mapQuizToTopicQuiz);
    } catch (error) {
      console.error('Error fetching topic quizzes:', error);
      throw error;
    }
  },

  // Get all quizzes for moderation (admin only)
  async getQuizzesForModeration(): Promise<TopicQuiz[]> {
    try {
      const { data, error } = await supabase
        .from('topic_quizzes')
        .select(`
          *,
          created_by_user:users!topic_quizzes_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          topic:topics(
            id,
            title,
            module_code
          )
        `)
        .eq('is_moderated', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(quizService.mapQuizToTopicQuiz);
    } catch (error) {
      console.error('Error fetching quizzes for moderation:', error);
      throw error;
    }
  },

  // Get quiz by ID
  async getQuizById(quizId: string): Promise<TopicQuiz | null> {
    try {
      const { data, error } = await supabase
        .from('topic_quizzes')
        .select(`
          *,
          created_by_user:users!topic_quizzes_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', quizId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return quizService.mapQuizToTopicQuiz(data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  },

  // Create a new quiz
  async createQuiz(
    topicId: string,
    quizData: CreateQuizData,
    userId: string
  ): Promise<TopicQuiz> {
    try {
      const { data, error } = await supabase
        .from('topic_quizzes')
        .insert([{
          topic_id: topicId,
          created_by: userId,
          title: quizData.title,
          description: quizData.description,
          questions: quizData.questions,
          time_limit: quizData.time_limit,
          passing_score: quizData.passing_score || 70,
          is_active: true,
          is_moderated: false
        }])
        .select(`
          *,
          created_by_user:users!topic_quizzes_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      return quizService.mapQuizToTopicQuiz(data);
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  // Update a quiz
  async updateQuiz(
    quizId: string,
    updates: Partial<CreateQuizData>
  ): Promise<TopicQuiz> {
    try {
      const { data, error } = await supabase
        .from('topic_quizzes')
        .update({
          title: updates.title,
          description: updates.description,
          questions: updates.questions,
          time_limit: updates.time_limit,
          passing_score: updates.passing_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId)
        .select(`
          *,
          created_by_user:users!topic_quizzes_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      return quizService.mapQuizToTopicQuiz(data);
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },

  // Delete a quiz
  async deleteQuiz(quizId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('topic_quizzes')
        .update({ is_active: false })
        .eq('id', quizId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  // Moderate a quiz (admin only)
  async moderateQuiz(quizId: string, moderated: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('topic_quizzes')
        .update({ is_moderated: moderated })
        .eq('id', quizId);

      if (error) throw error;
    } catch (error) {
      console.error('Error moderating quiz:', error);
      throw error;
    }
  },

  // Check if tutor can create quiz for topic
  async canTutorCreateQuiz(topicId: string, tutorId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('topic_tutors')
        .select('id')
        .eq('topic_id', topicId)
        .eq('tutor_id', tutorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;
    } catch (error) {
      console.error('Error checking tutor quiz permissions:', error);
      return false;
    }
  },

  // Grade a quiz submission
  gradeQuiz(quiz: TopicQuiz, answers: { [questionId: string]: any }): QuizResult {
    let correctAnswers = 0;
    const gradedAnswers: { questionId: string; userAnswer: any; correct: boolean }[] = [];

    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      switch (question.type) {
        case 'multiple_choice':
          isCorrect = userAnswer === question.correctAnswer;
          break;
        case 'true_false':
          isCorrect = userAnswer === question.correctAnswer;
          break;
        case 'fill_blank':
          const correctAnswers = Array.isArray(question.correctAnswer) 
            ? question.correctAnswer 
            : [question.correctAnswer];
          isCorrect = correctAnswers.some(correct => 
            userAnswer?.toString().toLowerCase().trim() === correct.toString().toLowerCase().trim()
          );
          break;
      }

      if (isCorrect) correctAnswers++;

      gradedAnswers.push({
        questionId: question.id,
        userAnswer,
        correct: isCorrect
      });
    });

    const percentage = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = percentage >= quiz.passing_score;

    return {
      score: correctAnswers,
      percentage,
      passed,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      answers: gradedAnswers
    };
  },

  // Helper method to map database result to TopicQuiz
  mapQuizToTopicQuiz(data: any): TopicQuiz {
    return {
      id: data.id,
      topic_id: data.topic_id,
      created_by: data.created_by,
      title: data.title,
      description: data.description,
      questions: data.questions || [],
      time_limit: data.time_limit,
      passing_score: data.passing_score || 70,
      is_active: data.is_active !== false,
      is_moderated: data.is_moderated === true,
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
      created_by_user: data.created_by_user ? {
        id: data.created_by_user.id,
        first_name: data.created_by_user.first_name,
        last_name: data.created_by_user.last_name,
        email: data.created_by_user.email
      } : undefined
    };
  }
};
