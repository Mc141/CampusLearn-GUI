-- Fix voting system to prevent duplicate votes and enable toggle functionality
-- This script adds unique constraints and updates the voting logic

-- Add unique constraints to prevent duplicate votes
-- Forum post votes
ALTER TABLE public.forum_post_votes 
ADD CONSTRAINT unique_forum_post_vote UNIQUE (post_id, user_id);

-- Forum reply votes  
ALTER TABLE public.forum_reply_votes 
ADD CONSTRAINT unique_forum_reply_vote UNIQUE (reply_id, user_id);

-- Answer votes
ALTER TABLE public.answer_votes 
ADD CONSTRAINT unique_answer_vote UNIQUE (answer_id, user_id);

-- Question votes
ALTER TABLE public.question_votes 
ADD CONSTRAINT unique_question_vote UNIQUE (question_id, user_id);

-- Create a function to toggle votes (like/unlike)
CREATE OR REPLACE FUNCTION toggle_vote(
  p_table_name TEXT,
  p_entity_id UUID,
  p_user_id UUID,
  p_vote_type TEXT DEFAULT 'upvote'
)
RETURNS JSON AS $$
DECLARE
  vote_table TEXT;
  vote_count INTEGER := 0;
  has_voted BOOLEAN := FALSE;
  result JSON;
BEGIN
  -- Determine the correct vote table based on entity type
  CASE p_table_name
    WHEN 'forum_posts' THEN
      vote_table := 'forum_post_votes';
    WHEN 'forum_replies' THEN
      vote_table := 'forum_reply_votes';
    WHEN 'answers' THEN
      vote_table := 'answer_votes';
    WHEN 'questions' THEN
      vote_table := 'question_votes';
    ELSE
      RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END CASE;

  -- Check if user has already voted
  EXECUTE format('
    SELECT EXISTS(
      SELECT 1 FROM %I 
      WHERE %s = $1 AND user_id = $2
    )', vote_table, 
    CASE p_table_name
      WHEN 'forum_posts' THEN 'post_id'
      WHEN 'forum_replies' THEN 'reply_id'
      WHEN 'answers' THEN 'answer_id'
      WHEN 'questions' THEN 'question_id'
    END
  ) INTO has_voted USING p_entity_id, p_user_id;

  IF has_voted THEN
    -- Remove the vote (unlike)
    EXECUTE format('
      DELETE FROM %I 
      WHERE %s = $1 AND user_id = $2
    ', vote_table,
    CASE p_table_name
      WHEN 'forum_posts' THEN 'post_id'
      WHEN 'forum_replies' THEN 'reply_id'
      WHEN 'answers' THEN 'answer_id'
      WHEN 'questions' THEN 'question_id'
    END
    ) USING p_entity_id, p_user_id;
    
    -- Decrement the vote count
    EXECUTE format('
      UPDATE %I 
      SET upvotes = GREATEST(upvotes - 1, 0)
      WHERE id = $1
    ', p_table_name) USING p_entity_id;
    
    -- Get updated vote count
    EXECUTE format('
      SELECT upvotes FROM %I WHERE id = $1
    ', p_table_name) INTO vote_count USING p_entity_id;
    
    result := json_build_object(
      'action', 'removed',
      'vote_count', vote_count,
      'has_voted', false
    );
  ELSE
    -- Add the vote (like)
    EXECUTE format('
      INSERT INTO %I (%s, user_id, vote_type, created_at)
      VALUES ($1, $2, $3, NOW())
    ', vote_table,
    CASE p_table_name
      WHEN 'forum_posts' THEN 'post_id'
      WHEN 'forum_replies' THEN 'reply_id'
      WHEN 'answers' THEN 'answer_id'
      WHEN 'questions' THEN 'question_id'
    END
    ) USING p_entity_id, p_user_id, p_vote_type;
    
    -- Increment the vote count
    EXECUTE format('
      UPDATE %I 
      SET upvotes = upvotes + 1
      WHERE id = $1
    ', p_table_name) USING p_entity_id;
    
    -- Get updated vote count
    EXECUTE format('
      SELECT upvotes FROM %I WHERE id = $1
    ', p_table_name) INTO vote_count USING p_entity_id;
    
    result := json_build_object(
      'action', 'added',
      'vote_count', vote_count,
      'has_voted', true
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a user has voted
CREATE OR REPLACE FUNCTION has_user_voted(
  p_table_name TEXT,
  p_entity_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  vote_table TEXT;
  result BOOLEAN := FALSE;
BEGIN
  -- Determine the correct vote table based on entity type
  CASE p_table_name
    WHEN 'forum_posts' THEN
      vote_table := 'forum_post_votes';
    WHEN 'forum_replies' THEN
      vote_table := 'forum_reply_votes';
    WHEN 'answers' THEN
      vote_table := 'answer_votes';
    WHEN 'questions' THEN
      vote_table := 'question_votes';
    ELSE
      RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END CASE;

  -- Check if user has voted
  EXECUTE format('
    SELECT EXISTS(
      SELECT 1 FROM %I 
      WHERE %s = $1 AND user_id = $2
    )', vote_table, 
    CASE p_table_name
      WHEN 'forum_posts' THEN 'post_id'
      WHEN 'forum_replies' THEN 'reply_id'
      WHEN 'answers' THEN 'answer_id'
      WHEN 'questions' THEN 'question_id'
    END
  ) INTO result USING p_entity_id, p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get vote count and user vote status
CREATE OR REPLACE FUNCTION get_vote_info(
  p_table_name TEXT,
  p_entity_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  vote_count INTEGER := 0;
  has_voted BOOLEAN := FALSE;
  result JSON;
BEGIN
  -- Get vote count
  EXECUTE format('
    SELECT upvotes FROM %I WHERE id = $1
  ', p_table_name) INTO vote_count USING p_entity_id;

  -- Check if user has voted
  SELECT has_user_voted(p_table_name, p_entity_id, p_user_id) INTO has_voted;

  result := json_build_object(
    'vote_count', vote_count,
    'has_voted', has_voted
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;
