
-- Table: line_users
CREATE TABLE public.line_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_sub text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.line_users ENABLE ROW LEVEL SECURITY;

-- Table: line_sessions
CREATE TABLE public.line_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES public.line_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.line_sessions ENABLE ROW LEVEL SECURITY;

-- Table: auth_states (temporary CSRF store)
CREATE TABLE public.auth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text UNIQUE NOT NULL,
  nonce text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_states ENABLE ROW LEVEL SECURITY;

-- No anon policies - only service_role (edge functions) can access these tables
