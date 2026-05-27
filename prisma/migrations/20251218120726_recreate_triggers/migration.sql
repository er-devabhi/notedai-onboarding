CREATE TRIGGER trg_set_escalation_timestamps
BEFORE UPDATE ON hospital_issue_ticket
FOR EACH ROW
WHEN (
  OLD.escalation_status IS DISTINCT FROM NEW.escalation_status
  OR OLD.status IS DISTINCT FROM NEW.status
)
EXECUTE FUNCTION set_escalation_timestamps();
