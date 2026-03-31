import frappe


@frappe.whitelist()
def get_unread_count():
	"""Returns the count of unread Notification Log entries for the current user."""
	if frappe.session.user == "Guest":
		return 0

	return frappe.db.count(
		"Notification Log",
		filters={"for_user": frappe.session.user, "read": 0},
	)
