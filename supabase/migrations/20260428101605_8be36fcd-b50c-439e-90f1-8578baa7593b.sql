-- Enable realtime for contract chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_messages;
ALTER TABLE public.marketplace_messages REPLICA IDENTITY FULL;

-- Helpful composite index for chat ordering
CREATE INDEX IF NOT EXISTS idx_messages_contract_recent
  ON public.marketplace_messages (contract_id, created_at DESC);