import type { TodoistTask } from './types'

const TODOIST_API_BASE = 'https://api.todoist.com/rest/v2'

export class TodoistClient {
	private readonly apiToken: string

	constructor(apiToken: string) {
		this.apiToken = apiToken
	}

	private async request<T>(path: string, init?: RequestInit): Promise<T> {
		const res = await fetch(`${TODOIST_API_BASE}${path}`, {
			...init,
			headers: {
				'Authorization': `Bearer ${this.apiToken}`,
				'Content-Type': 'application/json',
				...(init?.headers ?? {}),
			},
		})
		if (!res.ok) {
			const body = await res.text().catch(() => '')
			throw new Error(`Todoist API error ${res.status}: ${body}`)
		}
		return res.json() as Promise<T>
	}

	async getInboxProjectId(): Promise<string> {
		// Inbox project has special id returned via /projects with is_inbox_project true
		const projects = await this.request<Array<{ id: string; name: string; is_inbox_project?: boolean }>>('/projects')
		const inbox = projects.find(p => p.is_inbox_project)
		if (!inbox) throw new Error('Не найден Inbox проект в Todoist')
		return inbox.id
	}

	async getInboxTasks(inboxProjectId?: string): Promise<TodoistTask[]> {
		let projectId = inboxProjectId
		if (!projectId) {
			projectId = await this.getInboxProjectId()
		}
		const tasks = await this.request<TodoistTask[]>(`/tasks?project_id=${encodeURIComponent(projectId)}`)
		return tasks
	}

	async deleteTask(taskId: string): Promise<void> {
		await this.request<void>(`/tasks/${taskId}`, { method: 'DELETE' })
	}
}


