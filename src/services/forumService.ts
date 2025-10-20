import { supabase } from '../lib/supabase';
import { ForumPost, ForumReply } from '../types';
import { notificationService } from './notificationService';

export interface CreateForumPostData {
  title: string;
  content: string;
  isAnonymous: boolean;
  tags?: string[];
}

export interface CreateForumReplyData {
  postId: string;
  content: string;
  isAnonymous: boolean;
  parentReplyId?: string;
}

export interface ForumPostWithAuthor extends ForumPost {
  authorName?: string;
  replyCount: number;
}

export interface ForumReplyWithAuthor extends ForumReply {
  authorName?: string;
}

export const forumService = {
  // Get all forum posts with pagination and sorting
  async getForumPosts(
    page: number = 1,
    limit: number = 20,
    sortBy: 'newest' | 'oldest' | 'most_voted' | 'trending' = 'newest'
  ): Promise<ForumPostWithAuthor[]> {
    try {
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          author:users(first_name, last_name),
          replies:forum_replies(count)
        `)
        .eq('is_moderated', false); // Only show non-moderated posts

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most_voted':
          query = query.order('upvotes', { ascending: false });
          break;
        case 'trending':
          // Trending: combination of upvotes and recent activity
          query = query.order('upvotes', { ascending: false });
          break;
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching forum posts:', error);
        throw error;
      }

      return data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        isAnonymous: post.is_anonymous,
        createdAt: new Date(post.created_at),
        upvotes: post.upvotes || 0,
        tags: post.tags || [],
        isModerated: post.is_moderated,
        authorName: post.is_anonymous 
          ? 'Anonymous' 
          : post.author 
            ? `${post.author.first_name} ${post.author.last_name}`
            : 'Unknown',
        replyCount: post.replies?.[0]?.count || 0,
        replies: [] // Will be loaded separately if needed
      }));
    } catch (error) {
      console.error('Error in getForumPosts:', error);
      throw error;
    }
  },

  // Get trending posts (most upvoted in last 7 days)
  async getTrendingPosts(limit: number = 10): Promise<ForumPostWithAuthor[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:users(first_name, last_name),
          replies:forum_replies(count)
        `)
        .eq('is_moderated', false)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('upvotes', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching trending posts:', error);
        throw error;
      }

      return data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        isAnonymous: post.is_anonymous,
        createdAt: new Date(post.created_at),
        upvotes: post.upvotes || 0,
        tags: post.tags || [],
        isModerated: post.is_moderated,
        authorName: post.is_anonymous 
          ? 'Anonymous' 
          : post.author 
            ? `${post.author.first_name} ${post.author.last_name}`
            : 'Unknown',
        replyCount: post.replies?.[0]?.count || 0,
        replies: []
      }));
    } catch (error) {
      console.error('Error in getTrendingPosts:', error);
      throw error;
    }
  },

  // Get a single forum post with replies
  async getForumPost(postId: string): Promise<ForumPostWithAuthor | null> {
    try {
      // Get the post
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching forum post:', postError);
        throw postError;
      }

      if (!postData) return null;

      // Get replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .eq('post_id', postId)
        .eq('is_moderated', false)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.error('Error fetching forum replies:', repliesError);
        throw repliesError;
      }

      const replies: ForumReplyWithAuthor[] = repliesData.map(reply => ({
        id: reply.id,
        postId: reply.post_id,
        content: reply.content,
        authorId: reply.author_id,
        isAnonymous: reply.is_anonymous,
        createdAt: new Date(reply.created_at),
        upvotes: reply.upvotes || 0,
        isModerated: reply.is_moderated,
        authorName: reply.is_anonymous 
          ? 'Anonymous' 
          : reply.author 
            ? `${reply.author.first_name} ${reply.author.last_name}`
            : 'Unknown'
      }));

      return {
        id: postData.id,
        title: postData.title,
        content: postData.content,
        authorId: postData.author_id,
        isAnonymous: postData.is_anonymous,
        createdAt: new Date(postData.created_at),
        upvotes: postData.upvotes || 0,
        tags: postData.tags || [],
        isModerated: postData.is_moderated,
        authorName: postData.is_anonymous 
          ? 'Anonymous' 
          : postData.author 
            ? `${postData.author.first_name} ${postData.author.last_name}`
            : 'Unknown',
        replyCount: replies.length,
        replies
      };
    } catch (error) {
      console.error('Error in getForumPost:', error);
      throw error;
    }
  },

  // Create a new forum post
  async createForumPost(
    postData: CreateForumPostData,
    authorId?: string
  ): Promise<ForumPost> {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([{
          title: postData.title,
          content: postData.content,
          author_id: authorId,
          is_anonymous: postData.isAnonymous,
          tags: postData.tags || [],
          upvotes: 0,
          is_moderated: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating forum post:', error);
        throw error;
      }

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        authorId: data.author_id,
        isAnonymous: data.is_anonymous,
        createdAt: new Date(data.created_at),
        upvotes: data.upvotes || 0,
        tags: data.tags || [],
        isModerated: data.is_moderated,
        replies: []
      };
    } catch (error) {
      console.error('Error in createForumPost:', error);
      throw error;
    }
  },

  // Create a reply to a forum post
  async createForumReply(
    replyData: CreateForumReplyData,
    authorId?: string
  ): Promise<ForumReply> {
    try {
      const { data, error } = await supabase
        .from('forum_replies')
        .insert([{
          post_id: replyData.postId,
          content: replyData.content,
          author_id: authorId,
          is_anonymous: replyData.isAnonymous,
          upvotes: 0,
          is_moderated: false,
          parent_reply_id: replyData.parentReplyId || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating forum reply:', error);
        throw error;
      }

      const reply = {
        id: data.id,
        postId: data.post_id,
        content: data.content,
        authorId: data.author_id,
        isAnonymous: data.is_anonymous,
        createdAt: new Date(data.created_at),
        upvotes: data.upvotes || 0,
        isModerated: data.is_moderated,
        parentReplyId: data.parent_reply_id,
        depth: data.depth,
        threadPath: data.thread_path
      };

      // Create notification for the post author (if not replying to their own post)
      try {
        if (authorId) {
          // Get post details to find the author
          const { data: postData } = await supabase
            .from('forum_posts')
            .select('author_id, title')
            .eq('id', replyData.postId)
            .single();

          if (postData && postData.author_id !== authorId) {
            // Get replier's name
            const { data: replierData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', authorId)
              .single();

            if (replierData) {
              const replierName = replyData.isAnonymous ? 'Anonymous' : `${replierData.first_name} ${replierData.last_name}`;
              await notificationService.notifyForumReply(postData.author_id, replierName, postData.title, replyData.postId);
            }
          }
        }
      } catch (notificationError) {
        console.error('Error creating forum reply notification:', notificationError);
        // Don't fail the reply creation if notification fails
      }

      return reply;
    } catch (error) {
      console.error('Error in createForumReply:', error);
      throw error;
    }
  },

  // Toggle vote for a forum post (like/unlike)
  async togglePostVote(postId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('toggle_vote', {
        p_table_name: 'forum_posts',
        p_entity_id: postId,
        p_user_id: userId,
        p_vote_type: 'upvote'
      });

      if (error) {
        console.error('Error toggling post vote:', error);
        throw error;
      }

      return {
        voteCount: data.vote_count,
        hasVoted: data.has_voted
      };
    } catch (error) {
      console.error('Error in togglePostVote:', error);
      throw error;
    }
  },

  // Toggle vote for a forum reply (like/unlike)
  async toggleReplyVote(replyId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('toggle_vote', {
        p_table_name: 'forum_replies',
        p_entity_id: replyId,
        p_user_id: userId,
        p_vote_type: 'upvote'
      });

      if (error) {
        console.error('Error toggling reply vote:', error);
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

  // Get vote info for a forum post
  async getPostVoteInfo(postId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('get_vote_info', {
        p_table_name: 'forum_posts',
        p_entity_id: postId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting post vote info:', error);
        throw error;
      }

      return {
        voteCount: data.vote_count,
        hasVoted: data.has_voted
      };
    } catch (error) {
      console.error('Error in getPostVoteInfo:', error);
      throw error;
    }
  },

  // Get vote info for a forum reply
  async getReplyVoteInfo(replyId: string, userId: string): Promise<{ voteCount: number; hasVoted: boolean }> {
    try {
      const { data, error } = await supabase.rpc('get_vote_info', {
        p_table_name: 'forum_replies',
        p_entity_id: replyId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting reply vote info:', error);
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

  // Search forum posts
  async searchForumPosts(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ForumPostWithAuthor[]> {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:users(first_name, last_name),
          replies:forum_replies(count)
        `)
        .eq('is_moderated', false)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error searching forum posts:', error);
        throw error;
      }

      return data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        isAnonymous: post.is_anonymous,
        createdAt: new Date(post.created_at),
        upvotes: post.upvotes || 0,
        tags: post.tags || [],
        isModerated: post.is_moderated,
        authorName: post.is_anonymous 
          ? 'Anonymous' 
          : post.author 
            ? `${post.author.first_name} ${post.author.last_name}`
            : 'Unknown',
        replyCount: post.replies?.[0]?.count || 0,
        replies: []
      }));
    } catch (error) {
      console.error('Error in searchForumPosts:', error);
      throw error;
    }
  },

  // Get posts by tag
  async getPostsByTag(
    tag: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ForumPostWithAuthor[]> {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:users(first_name, last_name),
          replies:forum_replies(count)
        `)
        .eq('is_moderated', false)
        .contains('tags', [tag])
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error fetching posts by tag:', error);
        throw error;
      }

      return data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        isAnonymous: post.is_anonymous,
        createdAt: new Date(post.created_at),
        upvotes: post.upvotes || 0,
        tags: post.tags || [],
        isModerated: post.is_moderated,
        authorName: post.is_anonymous 
          ? 'Anonymous' 
          : post.author 
            ? `${post.author.first_name} ${post.author.last_name}`
            : 'Unknown',
        replyCount: post.replies?.[0]?.count || 0,
        replies: []
      }));
    } catch (error) {
      console.error('Error in getPostsByTag:', error);
      throw error;
    }
  },

  // Admin: Moderate a post (hide it)
  async moderatePost(postId: string, isModerated: boolean = true): Promise<void> {
    try {
      const { error } = await supabase
        .from('forum_posts')
        .update({ is_moderated: isModerated })
        .eq('id', postId);

      if (error) {
        console.error('Error moderating post:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in moderatePost:', error);
      throw error;
    }
  },

  // Admin: Moderate a reply (hide it)
  async moderateReply(replyId: string, isModerated: boolean = true): Promise<void> {
    try {
      const { error } = await supabase
        .from('forum_replies')
        .update({ is_moderated: isModerated })
        .eq('id', replyId);

      if (error) {
        console.error('Error moderating reply:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in moderateReply:', error);
      throw error;
    }
  },

  // Get replies for a post in hierarchical structure (Reddit-style)
  async getForumRepliesHierarchical(postId: string): Promise<ForumReply[]> {
    try {
      const { data, error } = await supabase
        .from('forum_replies')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .eq('post_id', postId)
        .eq('is_moderated', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching forum replies:', error);
        throw error;
      }

      // Convert to ForumReply format
      const replies: ForumReply[] = (data || []).map(reply => ({
        id: reply.id,
        postId: reply.post_id,
        content: reply.content,
        authorId: reply.author_id,
        isAnonymous: reply.is_anonymous,
        createdAt: new Date(reply.created_at),
        upvotes: reply.upvotes || 0,
        isModerated: reply.is_moderated,
        parentReplyId: reply.parent_reply_id,
        depth: reply.depth,
        threadPath: reply.thread_path,
        authorName: reply.author ? 
          `${reply.author.first_name} ${reply.author.last_name}` : 
          'Anonymous'
      }));

      // Build hierarchical structure
      return this.buildReplyHierarchy(replies);
    } catch (error) {
      console.error('Error in getForumRepliesHierarchical:', error);
      throw error;
    }
  },

  // Helper function to build hierarchical reply structure
  buildReplyHierarchy(replies: ForumReply[]): ForumReply[] {
    const replyMap = new Map<string, ForumReply>();
    const rootReplies: ForumReply[] = [];

    // First pass: create map of all replies
    replies.forEach(reply => {
      replyMap.set(reply.id, { ...reply, replies: [] });
    });

    // Second pass: build hierarchy
    replies.forEach(reply => {
      const replyWithChildren = replyMap.get(reply.id)!;
      
      if (reply.parentReplyId) {
        // This is a nested reply
        const parent = replyMap.get(reply.parentReplyId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(replyWithChildren);
        }
      } else {
        // This is a root-level reply
        rootReplies.push(replyWithChildren);
      }
    });

    return rootReplies;
  }
};
