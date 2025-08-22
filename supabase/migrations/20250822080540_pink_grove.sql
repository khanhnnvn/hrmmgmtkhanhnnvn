/*
  # Enable anonymous candidate applications

  1. Security
    - Allow anonymous users to insert candidate applications
    - Maintain existing policies for authenticated users
*/

-- Allow anonymous users to insert candidates (public job applications)
CREATE POLICY "Allow public insert for candidates" 
  ON public.candidates 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);