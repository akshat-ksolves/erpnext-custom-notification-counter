frappe.provide("custom_notification_counter");

custom_notification_counter = {
	BADGE_CLASS: "cnc-badge",
	BADGE_CLASS_SIDEBAR: "cnc-badge-sidebar",
	BADGE_CLASS_DESK: "cnc-badge-desk",
	_count: 0,

	// Entry point — called once after frappe boots
	start() {
		this._fetch();
		this._realtime();
		this._loop();
	},

	// Fetch unread count from server
	_fetch() {
		const me = this;
		frappe.call({
			method: "custom_notification_counter.api.notification.get_unread_count",
			callback(r) {
				me._count = cint(r.message) || 0;
				me._render();
			},
		});
	},

	// Inject badge spans + show count on every known bell location
	_render() {
		const me = this;

		// 1. Sidebar bell — badge inside span.sidebar-item-icon
		const $sidebar = $(".sidebar-notification .sidebar-item-icon").first();
		if ($sidebar.length) {
			if (!$sidebar.find("." + me.BADGE_CLASS_SIDEBAR).length) {
				$sidebar.css("position", "relative");
				$sidebar.append('<span class="cnc-badge cnc-badge-sidebar"></span>');
			}
		}

		// 2. Desktop home page bell — badge inside the button
		const $desk = $(".desktop-notifications .dropdown > button").first();
		if ($desk.length) {
			if (!$desk.find("." + me.BADGE_CLASS_DESK).length) {
				$desk.css("position", "relative");
				$desk.append('<span class="cnc-badge cnc-badge-desk"></span>');
			}
		}

		// Update all badges with current count
		const $all = $("." + me.BADGE_CLASS);
		if (me._count > 0) {
			$all.text(me._count > 99 ? "99+" : me._count).show();
		} else {
			$all.hide();
		}
	},

	// Run _render every second — ensures badge reappears after any re-render
	_loop() {
		const me = this;
		setInterval(function () {
			me._render();
		}, 1000);
	},

	// Realtime events
	_realtime() {
		const me = this;
		frappe.realtime.on("notification", function () {
			me._count += 1;
			me._render();
		});
		frappe.realtime.on("indicator_hide", function () {
			me._count = 0;
			me._render();
		});
	},
};

frappe.after_ajax(function () {
	if (frappe.session.user === "Guest") return;
	custom_notification_counter.start();

	// Re-fetch count every 30s
	setInterval(function () {
		custom_notification_counter._fetch();
	}, 30000);
});
