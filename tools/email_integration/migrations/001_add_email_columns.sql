-- =====================================================
-- E-Mail Integration: Schema-Erweiterung
-- Migration: 001_add_email_columns.sql
-- Erstellt: 2026-01-12
-- Projekt: js-fenster-erp (rsmjgdujlpnydbsfuiek)
-- =====================================================

-- HINWEIS: Diese Migration erweitert die bestehende 'documents' Tabelle
-- um E-Mail-spezifische Spalten. Bestehende Daten bleiben erhalten.

-- =====================================================
-- 1. Dokument-Typ zur Unterscheidung der Quelle
-- =====================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS dokument_typ TEXT DEFAULT 'scan';
COMMENT ON COLUMN documents.dokument_typ IS 'Quelle des Dokuments: scan, email, upload';

-- =====================================================
-- 2. E-Mail Identifikation (fuer Deduplizierung)
-- =====================================================

-- Microsoft Graph Message ID (primaerer Identifier)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_message_id TEXT;
COMMENT ON COLUMN documents.email_message_id IS 'Microsoft Graph API Message ID';

-- Conversation ID (fuer Thread-Gruppierung)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_conversation_id TEXT;
COMMENT ON COLUMN documents.email_conversation_id IS 'Conversation ID fuer E-Mail-Threads';

-- Internet Message ID (RFC 5322 Standard)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_internet_message_id TEXT;
COMMENT ON COLUMN documents.email_internet_message_id IS 'Standard Internet Message-ID Header';

-- =====================================================
-- 3. E-Mail Metadaten
-- =====================================================

-- Richtung: eingehend oder ausgehend
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_richtung TEXT;
COMMENT ON COLUMN documents.email_richtung IS 'eingehend oder ausgehend';

-- Postfach das die E-Mail empfangen/gesendet hat
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_postfach TEXT;
COMMENT ON COLUMN documents.email_postfach IS 'E-Mail-Adresse des Postfachs (z.B. info@js-fenster.de)';

-- =====================================================
-- 4. Absender
-- =====================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_von_email TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_von_name TEXT;

-- =====================================================
-- 5. Empfaenger (JSONB Arrays fuer mehrere)
-- =====================================================

-- Format: [{"email": "...", "name": "..."}, ...]
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_an_liste JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_cc_liste JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_bcc_liste JSONB;

-- =====================================================
-- 6. Inhalt
-- =====================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_betreff TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_body_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_body_html TEXT;

-- =====================================================
-- 7. Zeitstempel
-- =====================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_empfangen_am TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_gesendet_am TIMESTAMPTZ;

-- =====================================================
-- 8. Anhaenge
-- =====================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_hat_anhaenge BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_anhaenge_count INTEGER DEFAULT 0;

-- Format: [{"filename": "...", "size": 1234, "content_type": "...", "document_id": "uuid"}, ...]
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_anhaenge_meta JSONB;

-- =====================================================
-- 9. Status
-- =====================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_ist_gelesen BOOLEAN;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_ist_beantwortet BOOLEAN;

-- Wichtigkeit: low, normal, high
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_wichtigkeit TEXT;

-- =====================================================
-- 10. Microsoft-spezifische Felder
-- =====================================================

-- Kategorien die in Outlook gesetzt wurden
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_ms_kategorien JSONB;

-- Flag-Status (geflaggt, abgeschlossen, etc.)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_ms_flag JSONB;

-- =====================================================
-- 11. Tracking-spezifische Felder (fuer Lieferstatus)
-- =====================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS tracking_nummer TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tracking_versender TEXT;
COMMENT ON COLUMN documents.tracking_versender IS 'DHL, DPD, UPS, GLS, Hermes, FedEx, etc.';

ALTER TABLE documents ADD COLUMN IF NOT EXISTS tracking_status TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tracking_lieferdatum DATE;

-- =====================================================
-- 12. Verknuepfung: Anhang → E-Mail
-- =====================================================

-- Wenn ein Dokument aus einem E-Mail-Anhang stammt, hier die E-Mail-ID
ALTER TABLE documents ADD COLUMN IF NOT EXISTS bezug_email_id UUID;

-- Foreign Key Constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_documents_bezug_email'
  ) THEN
    ALTER TABLE documents
    ADD CONSTRAINT fk_documents_bezug_email
    FOREIGN KEY (bezug_email_id) REFERENCES documents(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 13. Constraints
-- =====================================================

-- Unique Constraint fuer E-Mail Message ID (Deduplizierung)
-- Nur wenn email_message_id nicht NULL ist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'unique_email_message_id'
  ) THEN
    CREATE UNIQUE INDEX unique_email_message_id
    ON documents(email_message_id)
    WHERE email_message_id IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 14. Indizes fuer Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_documents_dokument_typ ON documents(dokument_typ);
CREATE INDEX IF NOT EXISTS idx_documents_email_postfach ON documents(email_postfach);
CREATE INDEX IF NOT EXISTS idx_documents_email_richtung ON documents(email_richtung);
CREATE INDEX IF NOT EXISTS idx_documents_email_von ON documents(email_von_email);
CREATE INDEX IF NOT EXISTS idx_documents_email_empfangen ON documents(email_empfangen_am DESC);
CREATE INDEX IF NOT EXISTS idx_documents_email_gesendet ON documents(email_gesendet_am DESC);
CREATE INDEX IF NOT EXISTS idx_documents_email_conversation ON documents(email_conversation_id);
CREATE INDEX IF NOT EXISTS idx_documents_bezug_email ON documents(bezug_email_id);
CREATE INDEX IF NOT EXISTS idx_documents_tracking_nummer ON documents(tracking_nummer);

-- Kombinierter Index fuer haeufige Abfragen
CREATE INDEX IF NOT EXISTS idx_documents_email_postfach_richtung
ON documents(email_postfach, email_richtung, email_empfangen_am DESC)
WHERE dokument_typ = 'email';

-- =====================================================
-- 15. Bestehende Daten: dokument_typ setzen
-- =====================================================

-- Alle bestehenden Datensaetze ohne dokument_typ auf 'scan' setzen
UPDATE documents
SET dokument_typ = 'scan'
WHERE dokument_typ IS NULL;

-- =====================================================
-- Migration abgeschlossen
-- =====================================================

-- Hinweis: Nach Ausfuehrung dieser Migration koennen E-Mails
-- in der documents-Tabelle mit dokument_typ = 'email' gespeichert werden.
