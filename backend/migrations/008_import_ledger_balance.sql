-- Persiste o LEDGERBAL do OFX no preview para o commit aplicar mesmo se o client não reenviar.
alter table fluxo_imports
  add column if not exists ledger_balance numeric(14, 2);
