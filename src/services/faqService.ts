import { supabase } from '../lib/supabase';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFAQData {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  isPublished?: boolean;
}

export interface UpdateFAQData {
  question?: string;
  answer?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface FAQStats {
  totalFAQs: number;
  publishedFAQs: number;
  totalViews: number;
  categories: string[];
}

export type FAQUserFeedback = 'helpful' | 'not_helpful' | null;

class FAQService {
  // Get all FAQs with optional filtering
  async getFAQs(options?: {
    publishedOnly?: boolean;
    category?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<FAQ[]> {
    try {
      let query = supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.publishedOnly) {
        query = query.eq('is_published', true);
      }

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.searchTerm) {
        query = query.or(`question.ilike.%${options.searchTerm}%,answer.ilike.%${options.searchTerm}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching FAQs:', error);
        throw error;
      }

      return data?.map(this.mapFAQ) || [];
    } catch (error) {
      console.error('Error in getFAQs:', error);
      throw error;
    }
  }

  // Get a single FAQ by ID
  async getFAQById(id: string): Promise<FAQ | null> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching FAQ by ID:', error);
        throw error;
      }

      return data ? this.mapFAQ(data) : null;
    } catch (error) {
      console.error('Error in getFAQById:', error);
      throw error;
    }
  }

  // Create a new FAQ
  async createFAQ(faqData: CreateFAQData): Promise<FAQ> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert({
          question: faqData.question,
          answer: faqData.answer,
          category: faqData.category,
          tags: faqData.tags,
          is_published: faqData.isPublished ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating FAQ:', error);
        throw error;
      }

      return this.mapFAQ(data);
    } catch (error) {
      console.error('Error in createFAQ:', error);
      throw error;
    }
  }

  // Update an existing FAQ
  async updateFAQ(id: string, updateData: UpdateFAQData): Promise<FAQ> {
    try {
      const updateFields: any = {};
      
      if (updateData.question !== undefined) updateFields.question = updateData.question;
      if (updateData.answer !== undefined) updateFields.answer = updateData.answer;
      if (updateData.category !== undefined) updateFields.category = updateData.category;
      if (updateData.tags !== undefined) updateFields.tags = updateData.tags;
      if (updateData.isPublished !== undefined) updateFields.is_published = updateData.isPublished;

      const { data, error } = await supabase
        .from('faqs')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating FAQ:', error);
        throw error;
      }

      return this.mapFAQ(data);
    } catch (error) {
      console.error('Error in updateFAQ:', error);
      throw error;
    }
  }

  // Delete an FAQ
  async deleteFAQ(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting FAQ:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteFAQ:', error);
      throw error;
    }
  }

  // Toggle FAQ publish status
  async togglePublishStatus(id: string): Promise<FAQ> {
    try {
      // First get the current FAQ to toggle the status
      const currentFAQ = await this.getFAQById(id);
      if (!currentFAQ) {
        throw new Error('FAQ not found');
      }

      return await this.updateFAQ(id, { isPublished: !currentFAQ.isPublished });
    } catch (error) {
      console.error('Error in togglePublishStatus:', error);
      throw error;
    }
  }

  // Increment view count
  async incrementViews(id: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('increment_faq_view', { faq_id: id });
      // Debug: DB commit status for view increment
      // eslint-disable-next-line no-console
      console.log('📈 increment_faq_view result:', { faqId: id, data, error });

      if (error) {
        console.error('Error incrementing views:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in incrementViews:', error);
      throw error;
    }
  }

  // Increment helpful count
  async incrementHelpful(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_faq_helpful', { faq_id: id });

      if (error) {
        console.error('Error incrementing helpful:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in incrementHelpful:', error);
      throw error;
    }
  }

  // Increment not helpful count
  async incrementNotHelpful(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_faq_not_helpful', { faq_id: id });

      if (error) {
        console.error('Error incrementing not helpful:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in incrementNotHelpful:', error);
      throw error;
    }
  }

  // Toggle user feedback (one per user) and return updated counts + user feedback
  async submitFeedback(faqId: string, userId: string, isHelpful: boolean): Promise<{ helpful: number; notHelpful: number; userFeedback: FAQUserFeedback; }> {
    const { data, error } = await supabase.rpc('toggle_faq_feedback', {
      faq_id: faqId,
      p_user_id: userId,
      p_is_helpful: isHelpful,
    });
    // Debug: DB commit status for feedback toggle
    // eslint-disable-next-line no-console
    console.log('📝 toggle_faq_feedback result:', { faqId, userId, isHelpful, data, error });
    if (error) {
      console.error('Error submitting FAQ feedback:', error);
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    const helpful = (row?.out_helpful ?? row?.helpful ?? 0) as number;
    const notHelpful = (row?.out_not_helpful ?? row?.not_helpful ?? 0) as number;
    const userFeedbackBool = (row?.out_user_feedback ?? row?.user_feedback) as boolean | null | undefined;
    const userFeedback: FAQUserFeedback = typeof userFeedbackBool === 'boolean'
      ? (userFeedbackBool ? 'helpful' : 'not_helpful')
      : null;
    return { helpful, notHelpful, userFeedback };
  }

  // Get FAQ statistics
  async getFAQStats(): Promise<FAQStats> {
    try {
      const { data: faqs, error } = await supabase
        .from('faqs')
        .select('is_published, views, category');

      if (error) {
        console.error('Error fetching FAQ stats:', error);
        throw error;
      }

      const totalFAQs = faqs?.length || 0;
      const publishedFAQs = faqs?.filter(faq => faq.is_published).length || 0;
      const totalViews = faqs?.reduce((sum, faq) => sum + (faq.views || 0), 0) || 0;
      const categories = [...new Set(faqs?.map(faq => faq.category) || [])];

      return {
        totalFAQs,
        publishedFAQs,
        totalViews,
        categories,
      };
    } catch (error) {
      console.error('Error in getFAQStats:', error);
      throw error;
    }
  }

  // Get unique categories
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('category')
        .eq('is_published', true);

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return [...new Set(data?.map(item => item.category) || [])];
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  }

  // Get current user's feedback for a set of FAQs
  async getUserFeedbackForFaqs(faqIds: string[], userId: string): Promise<Record<string, FAQUserFeedback>> {
    if (faqIds.length === 0) return {};
    const { data, error } = await supabase
      .from('faq_feedbacks')
      .select('faq_id, is_helpful')
      .eq('user_id', userId)
      .in('faq_id', faqIds);
    if (error) {
      console.error('Error fetching user FAQ feedback:', error);
      throw error;
    }
    const map: Record<string, FAQUserFeedback> = {};
    (data || []).forEach((row: any) => {
      map[row.faq_id] = row.is_helpful ? 'helpful' : 'not_helpful';
    });
    return map;
  }

  // Map database FAQ to interface
  private mapFAQ(data: any): FAQ {
    return {
      id: data.id,
      question: data.question,
      answer: data.answer,
      category: data.category,
      tags: data.tags || [],
      isPublished: data.is_published,
      views: data.views || 0,
      helpful: data.helpful || 0,
      notHelpful: data.not_helpful || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const faqService = new FAQService();
