import type { UsersLocaleObject } from "@/i18n/types";

const usersEn: UsersLocaleObject = {
	users_title: "Users",
	users_count: "{{count}} user",
	users_count_plural: "{{count}} users",
	users_load_error: "Failed to load users.",
	users_search_placeholder: "Search by name, email or UID",
	users_refresh: "Refresh",
	users_table_name: "Name",
	users_table_email: "Email",
	users_table_ingame_uid: "In-game UID",
	users_table_status: "Status",
	users_table_last_login: "Last login",
	users_table_created_at: "Created at",
	users_table_actions: "Actions",
	users_status_active: "Active",
	users_status_inactive: "Inactive",
	users_activate_tooltip: "Activate user",
	users_deactivate_tooltip: "Deactivate user",
	users_activate_success: "User activated successfully.",
	users_deactivate_success: "User deactivated successfully.",
	users_activate_error: "Failed to activate user.",
	users_deactivate_error: "Failed to deactivate user.",
	users_empty: "No users found.",
	users_pagination_previous: "Previous",
	users_pagination_next: "Next",
	users_pagination_page: "Page {{current}} of {{total}}",
};

export default usersEn;
