-- Create storage buckets for admin assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('admin-assets', 'admin-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for admin-assets
CREATE POLICY "Admin assets are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'admin-assets');

CREATE POLICY "Admins can upload their own assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'admin-assets' AND 
    (auth.uid() = (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Admins can update their own assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'admin-assets' AND 
    (auth.uid() = (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Admins can delete their own assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'admin-assets' AND 
    (auth.uid() = (storage.foldername(name))[1]::uuid)
  );
