-- Add admin policies for the idiom table

CREATE POLICY "Allow admin to insert idiom"
ON "public"."idiom"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  ((auth.jwt() ->> 'email'::text) = 'admin@mindflow.com'::text)
);

CREATE POLICY "Allow admin to update idiom"
ON "public"."idiom"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  ((auth.jwt() ->> 'email'::text) = 'admin@mindflow.com'::text)
)
WITH CHECK (
  ((auth.jwt() ->> 'email'::text) = 'admin@mindflow.com'::text)
);

CREATE POLICY "Allow admin to delete idiom"
ON "public"."idiom"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  ((auth.jwt() ->> 'email'::text) = 'admin@mindflow.com'::text)
);
