-- Reemplaza el esquema viejo de whatsapp_escalations por el nuevo
-- (modelo WhatsappEscalation). Se hace DROP + CREATE porque la tabla
-- existente está vacía y la forma cambia por completo.
DROP TABLE IF EXISTS whatsapp_escalations;
DROP TYPE IF EXISTS "EscalationStatus";

CREATE TABLE whatsapp_escalations (
    id          TEXT PRIMARY KEY,
    phone       TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    motivo      TEXT NOT NULL,
    summary     TEXT NOT NULL,
    resolved_at TIMESTAMP NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX whatsapp_escalations_resolved_at_idx ON whatsapp_escalations (resolved_at);
CREATE INDEX whatsapp_escalations_created_at_idx  ON whatsapp_escalations (created_at);
