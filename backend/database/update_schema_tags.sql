CREATE TABLE IF NOT EXISTS merchant_tag_votes (
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (merchant_id, tag_name, user_id)
);

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS homepage_url TEXT;

-- RLS setup
ALTER TABLE merchant_tag_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON merchant_tag_votes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON merchant_tag_votes
    FOR INSERT WITH CHECK (true);
