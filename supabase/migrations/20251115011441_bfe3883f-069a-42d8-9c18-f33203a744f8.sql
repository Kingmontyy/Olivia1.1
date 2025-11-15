-- Create SKUs table
CREATE TABLE public.skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sku_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  velocity NUMERIC NOT NULL DEFAULT 0,
  days_remaining NUMERIC,
  cogs NUMERIC NOT NULL DEFAULT 0,
  total_cogs NUMERIC,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create COGS history table for time-based tracking
CREATE TABLE public.cogs_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  cogs NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  total_value NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogs_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skus
CREATE POLICY "Users can view their own skus"
  ON public.skus FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skus"
  ON public.skus FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skus"
  ON public.skus FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skus"
  ON public.skus FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for inventory
CREATE POLICY "Users can view their own inventory"
  ON public.inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory"
  ON public.inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON public.inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory"
  ON public.inventory FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cogs_history
CREATE POLICY "Users can view their own cogs history"
  ON public.cogs_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cogs history"
  ON public.cogs_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on skus
CREATE TRIGGER update_skus_updated_at
  BEFORE UPDATE ON public.skus
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_inventory_sku_id ON public.inventory(sku_id);
CREATE INDEX idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX idx_cogs_history_sku_id ON public.cogs_history(sku_id);
CREATE INDEX idx_cogs_history_recorded_at ON public.cogs_history(recorded_at);