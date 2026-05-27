-- Create trigger function
CREATE OR REPLACE FUNCTION set_escalation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER trg_set_escalation_timestamps
BEFORE UPDATE ON hospital_issue_ticket
FOR EACH ROW
WHEN (OLD.escalation_status IS DISTINCT FROM NEW.escalation_status)
EXECUTE FUNCTION set_escalation_timestamps();
