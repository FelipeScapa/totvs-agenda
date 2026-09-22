CREATE POLICY "anexos agenda read" ON storage.objects
  FOR SELECT USING (bucket_id = 'anexos-agenda');
CREATE POLICY "anexos agenda insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'anexos-agenda');
CREATE POLICY "anexos agenda update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'anexos-agenda') WITH CHECK (bucket_id = 'anexos-agenda');
CREATE POLICY "anexos agenda delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'anexos-agenda');