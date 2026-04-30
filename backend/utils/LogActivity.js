const ActivityLog = require("../models/ActivityLog");

const logActivity = async ({
  action,
  entity_type,
  entity_id = null,
  message,
  performed_by = null,
  performed_by_role = "system",
  meta = {},
}) => {
  try {
    await ActivityLog.create({
      action,
      entity_type,
      entity_id,
      message,
      performed_by,
      performed_by_role,
      meta,
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
};

module.exports = logActivity;