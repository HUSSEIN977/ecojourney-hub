-- Create rewards/vouchers table for redeemable items
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL DEFAULT 100,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'voucher',
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Everyone can view active rewards
CREATE POLICY "Anyone can view active rewards"
ON public.rewards
FOR SELECT
USING (is_active = true);

-- Create user_rewards table for redeemed rewards
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.rewards(id),
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  redemption_code TEXT
);

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own redeemed rewards
CREATE POLICY "Users can view their own redeemed rewards"
ON public.user_rewards
FOR SELECT
USING (auth.uid() = user_id);

-- Users can redeem rewards
CREATE POLICY "Users can redeem rewards"
ON public.user_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create points_history table to track points transactions
CREATE TABLE public.points_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'earned' or 'spent'
  source TEXT NOT NULL, -- 'challenge', 'activity', 'achievement', 'redemption'
  source_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own points history
CREATE POLICY "Users can view their own points history"
ON public.points_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own points history
CREATE POLICY "Users can insert their own points history"
ON public.points_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add streak tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Insert some sample rewards
INSERT INTO public.rewards (name, description, points_cost, category) VALUES
('$5 Coffee Voucher', 'Redeem at any participating coffee shop', 500, 'food'),
('Plant a Tree', 'We will plant a tree in your name', 1000, 'eco'),
('$10 Store Credit', 'Use at eco-friendly stores', 1500, 'shopping'),
('Carbon Offset 1 Ton', 'Offset 1 ton of carbon emissions', 2000, 'eco'),
('$25 Gift Card', 'Redeemable at partner stores', 3000, 'shopping');