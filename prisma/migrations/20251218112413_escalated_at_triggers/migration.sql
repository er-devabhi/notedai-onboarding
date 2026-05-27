-- Extend existing trigger function to support escalated_at
CREATE OR REPLACE FUNCTION set_escalation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  /* -----------------------------
     escalation_status timestamps
     ----------------------------- */

  IF NEW.escalation_status = 'Acknowledged'
     AND OLD.escalation_status IS DISTINCT FROM NEW.escalation_status
     AND OLD.acknowledged_at IS NULL THEN
    NEW.acknowledged_at := NOW();
  END IF;

  IF NEW.escalation_status = 'Resolved'
     AND OLD.escalation_status IS DISTINCT FROM NEW.escalation_status
     AND OLD.resolved_at IS NULL THEN
    NEW.resolved_at := NOW();
  END IF;

  /* -----------------------------
     status = Escalated timestamp
     ----------------------------- */

  IF NEW.status = 'Escalated'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND OLD.escalated_at IS NULL THEN
    NEW.escalated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
