-- FAQ counters RPCs
-- Run this in your Supabase/Postgres database

-- Optional: ensure required extension for gen_random_uuid if needed
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Increment views
CREATE OR REPLACE FUNCTION public.increment_faq_view(faq_id uuid)
RETURNS TABLE (out_id uuid, out_views integer, out_updated_at timestamptz) AS $$
BEGIN
  UPDATE public.faqs f
  SET views = COALESCE(views, 0) + 1,
      updated_at = NOW()
  WHERE f.id = increment_faq_view.faq_id
  RETURNING f.id, f.views, f.updated_at
  INTO out_id, out_views, out_updated_at;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment helpful
CREATE OR REPLACE FUNCTION public.increment_faq_helpful(faq_id uuid)
RETURNS TABLE (out_id uuid, out_helpful integer, out_updated_at timestamptz) AS $$
BEGIN
  UPDATE public.faqs f
  SET helpful = COALESCE(helpful, 0) + 1,
      updated_at = NOW()
  WHERE f.id = increment_faq_helpful.faq_id
  RETURNING f.id, f.helpful, f.updated_at
  INTO out_id, out_helpful, out_updated_at;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment not helpful
CREATE OR REPLACE FUNCTION public.increment_faq_not_helpful(faq_id uuid)
RETURNS TABLE (out_id uuid, out_not_helpful integer, out_updated_at timestamptz) AS $$
BEGIN
  UPDATE public.faqs f
  SET not_helpful = COALESCE(not_helpful, 0) + 1,
      updated_at = NOW()
  WHERE f.id = increment_faq_not_helpful.faq_id
  RETURNING f.id, f.not_helpful, f.updated_at
  INTO out_id, out_not_helpful, out_updated_at;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Optionally grant execute to roles used by your API (adjust as needed)
-- GRANT EXECUTE ON FUNCTION public.increment_faq_view(uuid) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.increment_faq_helpful(uuid) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.increment_faq_not_helpful(uuid) TO anon, authenticated;

-- =============================================
-- One-per-user feedback enforcement (toggle)
-- =============================================

-- Table to store per-user FAQ feedback
CREATE TABLE IF NOT EXISTS public.faq_feedbacks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  faq_id uuid NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_helpful boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (faq_id, user_id)
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_faq_feedbacks_set_timestamp'
  ) THEN
    CREATE TRIGGER tr_faq_feedbacks_set_timestamp
    BEFORE UPDATE ON public.faq_feedbacks
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
  END IF;
END $$;

-- Toggle feedback and maintain aggregate counters atomically
-- Behavior:
-- - If no feedback exists: insert with p_is_helpful, increment matching counter
-- - If exists with same value: delete feedback, decrement that counter (remove vote)
-- - If exists with different value: update value, decrement old counter, increment new
-- Returns updated helpful/not_helpful counts and the user's current feedback state
CREATE OR REPLACE FUNCTION public.toggle_faq_feedback(
  faq_id uuid,
  p_user_id uuid,
  p_is_helpful boolean
)
RETURNS TABLE (
  out_id uuid,
  out_helpful integer,
  out_not_helpful integer,
  out_user_feedback boolean
) AS $$
DECLARE
  existing public.faq_feedbacks%ROWTYPE;
BEGIN
  SELECT * INTO existing
  FROM public.faq_feedbacks ff
  WHERE ff.faq_id = toggle_faq_feedback.faq_id AND ff.user_id = p_user_id;

  IF NOT FOUND THEN
    -- create new feedback
    INSERT INTO public.faq_feedbacks (faq_id, user_id, is_helpful)
    VALUES (toggle_faq_feedback.faq_id, p_user_id, p_is_helpful);

    IF p_is_helpful THEN
      UPDATE public.faqs f SET helpful = COALESCE(f.helpful, 0) + 1, updated_at = now()
      WHERE f.id = toggle_faq_feedback.faq_id;
    ELSE
      UPDATE public.faqs f SET not_helpful = COALESCE(f.not_helpful, 0) + 1, updated_at = now()
      WHERE f.id = toggle_faq_feedback.faq_id;
    END IF;

    out_user_feedback := p_is_helpful;
  ELSE
    -- feedback exists
    IF existing.is_helpful = p_is_helpful THEN
      -- same value: remove feedback and decrement
      DELETE FROM public.faq_feedbacks WHERE id = existing.id;
      IF p_is_helpful THEN
        UPDATE public.faqs f SET helpful = GREATEST(COALESCE(f.helpful, 0) - 1, 0), updated_at = now()
        WHERE f.id = toggle_faq_feedback.faq_id;
      ELSE
        UPDATE public.faqs f SET not_helpful = GREATEST(COALESCE(f.not_helpful, 0) - 1, 0), updated_at = now()
        WHERE f.id = toggle_faq_feedback.faq_id;
      END IF;
      out_user_feedback := NULL; -- no current feedback
    ELSE
      -- different value: switch and adjust both counters
      UPDATE public.faq_feedbacks SET is_helpful = p_is_helpful WHERE id = existing.id;
      IF p_is_helpful THEN
        UPDATE public.faqs f SET helpful = COALESCE(f.helpful, 0) + 1, not_helpful = GREATEST(COALESCE(f.not_helpful, 0) - 1, 0), updated_at = now()
        WHERE f.id = toggle_faq_feedback.faq_id;
      ELSE
        UPDATE public.faqs f SET not_helpful = COALESCE(f.not_helpful, 0) + 1, helpful = GREATEST(COALESCE(f.helpful, 0) - 1, 0), updated_at = now()
        WHERE f.id = toggle_faq_feedback.faq_id;
      END IF;
      out_user_feedback := p_is_helpful;
    END IF;
  END IF;

  SELECT f.id, f.helpful, f.not_helpful
  INTO out_id, out_helpful, out_not_helpful
  FROM public.faqs f
  WHERE f.id = toggle_faq_feedback.faq_id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Suggested grants (adjust to your policy)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_feedbacks TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.toggle_faq_feedback(uuid, uuid, boolean) TO authenticated;
