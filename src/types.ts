export type IconStyle = 'stroke' | 'filled';

export interface CustomIconData {
	viewBox: string;
	elements: string[];
}

export interface CheckboxConfig {
	symbol: string;
	name: string;
	color: string;
	icon: string;
	viewBox: string;
	customIconData?: CustomIconData;
	description: string;
}

export interface PluginSettings {
	checkboxes: CheckboxConfig[];
	enabled: boolean;
	iconSize: string;
	iconPosition: string;
	iconStyle: IconStyle;
}
