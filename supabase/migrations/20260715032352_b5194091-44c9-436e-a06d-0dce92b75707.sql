
CREATE POLICY "ai uploads select own" ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai uploads insert own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai-chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai uploads delete own" ON storage.objects FOR DELETE
  USING (bucket_id = 'ai-chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
