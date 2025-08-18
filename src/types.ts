export interface TodoistTask {
	id: string
	content: string
	description?: string
	project_id?: string
	section_id?: string | null
	due?: { date?: string; datetime?: string; string?: string } | null
	labels?: string[]
	priority?: number
	url?: string
}

export interface PluginSettings {
	todoistApiToken: string
	inboxProjectId?: string
	journalHeading: string
	intervalMinutes: number
}

export const defaultSettings: PluginSettings = {
	todoistApiToken: '',
	inboxProjectId: undefined,
	journalHeading: 'Todoist Inbox',
	intervalMinutes: 5,
}


