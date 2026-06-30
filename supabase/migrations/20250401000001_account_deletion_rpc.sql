-- Create an RPC to safely mark an account for deletion (bypassing RLS on profiles)
CREATE OR REPLACE FUNCTION request_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET status = 'pending_deletion',
        delete_requested_at = NOW()
    WHERE id = auth.uid();
END;
$$;

-- Create an RPC to safely restore an account (bypassing RLS on profiles)
CREATE OR REPLACE FUNCTION restore_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET status = 'active',
        delete_requested_at = NULL
    WHERE id = auth.uid();
END;
$$;
