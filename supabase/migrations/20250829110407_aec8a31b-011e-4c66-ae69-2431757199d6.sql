-- Add show_total_pending column to clients table
ALTER TABLE clients ADD COLUMN show_total_pending BOOLEAN DEFAULT TRUE;

-- Update existing clients to show total pending by default
UPDATE clients SET show_total_pending = TRUE WHERE show_total_pending IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN clients.show_total_pending IS 'Controls if total pending amount should be displayed in client portal';