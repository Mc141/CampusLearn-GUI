-- Optional meta columns for admin controls. Run if you want richer moderation.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_by uuid REFERENCES public.users(id);

-- Helper function to ban/unban with audit metadata
CREATE OR REPLACE FUNCTION public.set_user_ban_state(
  p_user_id uuid,
  p_is_active boolean,
  p_banned_by uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF p_is_active THEN
    UPDATE public.users
      SET is_active = true,
          banned_at = NULL,
          banned_reason = NULL,
          banned_by = NULL
    WHERE id = p_user_id;
  ELSE
    UPDATE public.users
      SET is_active = false,
          banned_at = now(),
          banned_reason = COALESCE(p_reason, banned_reason),
          banned_by = COALESCE(p_banned_by, banned_by)
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


