ALTER TABLE public.user_files
  ADD COLUMN block_id text,
  ADD COLUMN section_id text,
  ADD COLUMN task_id text;

COMMENT ON COLUMN public.user_files.day_key IS 'Day identity for hierarchy-scoped attachments; day-only attachment rows are deprecated.';
COMMENT ON COLUMN public.user_files.block_id IS 'Stable block entity identifier when the file is attached at block level.';
COMMENT ON COLUMN public.user_files.section_id IS 'Stable section entity identifier when the file is attached at section level.';
COMMENT ON COLUMN public.user_files.task_id IS 'Stable task entity identifier when the file is attached at task level.';

CREATE INDEX idx_user_files_hierarchy_scope
  ON public.user_files (user_id, day_key, block_id, section_id, task_id);