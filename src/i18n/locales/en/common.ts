import type { CommonLocaleObject } from "@/i18n/types";

const commonEn: CommonLocaleObject = {
	validation_required: "This field is required.",
	validation_email: "Please enter a valid email.",
	validation_password_strength:
		"Password must be 6-30 characters and include lowercase letters and numbers.",
	validation_password_mismatch: "Passwords do not match.",
	validation_url: "Please enter a valid URL.",
	validation_permission_required: "Please select at least one permission.",
	pagination_page_info: "Page {{current}} of {{total}}",
	pagination_previous: "Previous",
	pagination_next: "Next",
	search_placeholder: "Search...",
	show_inactive_true: "Include inactive",
	show_inactive_false: "Active only",
	level: "Level",
	cancel: "Cancel",
	save: "Save",
};

export default commonEn;
