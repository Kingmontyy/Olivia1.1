-- Add core file type column to uploaded_files table
ALTER TABLE uploaded_files 
ADD COLUMN is_core_file BOOLEAN DEFAULT false,
ADD COLUMN core_file_type TEXT;

-- Add check constraint for core_file_type values
ALTER TABLE uploaded_files
ADD CONSTRAINT valid_core_file_type 
CHECK (core_file_type IS NULL OR core_file_type IN ('proforma', 'inventory_logistics', 'cashflow'));

-- Create index for efficient core file queries
CREATE INDEX idx_uploaded_files_core ON uploaded_files(user_id, is_core_file, core_file_type) WHERE is_core_file = true;