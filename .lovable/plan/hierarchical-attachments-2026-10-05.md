# Hierarchical Attachments

## Build
- Extend file metadata so an attachment can target one day hierarchy entity: a block, section, or task.
- Give sections and tasks stable IDs so files stay attached after reordering or deleting neighboring items.
- Replace the bottom day-level attachment panel with compact attachment controls in every block, section, and task.
- Show each entity's files directly beneath that entity, with upload, download, delete, limits, and upgrade behavior preserved.
- Keep note attachments working as they do today.

## Data and safety
- Add nullable hierarchy columns to the existing private file metadata table through an additive migration.
- Keep owner-only row and storage access policies unchanged.
- Mark the old day-wide scope as deprecated while retaining it for compatibility with existing records.

## Verification
- Check the updated day view at desktop and narrow widths.
- Verify uploading, listing, downloading, deleting, and free-plan limits against each hierarchy level.
- Confirm the current build remains healthy.

## Technical details
- Attachment identity will use the day key plus stable `block_id`, `section_id`, or `task_id`; only the matching hierarchy level is populated.
- Legacy sections/tasks receive IDs during hydration without changing existing completion and note keys.
