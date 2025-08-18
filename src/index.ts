import '@logseq/libs'
import { defaultSettings, type PluginSettings } from './types'
import { TodoistClient } from './todoist'
import { ensureTodayJournalHeading, appendTasksUnderBlock } from './logseq'

let timerId: number | null = null

async function syncOnce(settings: PluginSettings): Promise<void> {
	if (!settings.todoistApiToken) {
		console.warn('[Todoist Sync] Не задан токен Todoist API')
		return
	}
	try {
		const todoist = new TodoistClient(settings.todoistApiToken)
		const tasks = await todoist.getInboxTasks(settings.inboxProjectId)
		if (tasks.length === 0) return

		const blockUuid = await ensureTodayJournalHeading(settings.journalHeading)
		if (!blockUuid) {
			console.warn('[Todoist Sync] Не удалось найти/создать страницу журнала')
			return
		}

		const lines = tasks.map(t => {
			const due = t.due?.string || t.due?.date || ''
			const labels = (t.labels && t.labels.length) ? ` #[${t.labels.join('] #[')}]` : ''
			const priority = t.priority ? ` P${t.priority}` : ''
			const link = t.url ? ` <${t.url}>` : ''
			return `${t.content}${due ? ` ⏰ ${due}` : ''}${labels}${priority}${link}`.trim()
		})

		await appendTasksUnderBlock(blockUuid, lines)

		// After successful append, delete tasks in parallel (best-effort)
		await Promise.allSettled(tasks.map(t => todoist.deleteTask(t.id)))
		console.log(`[Todoist Sync] Синхронизировано и удалено ${tasks.length} задач`)
	} catch (e) {
		console.error('[Todoist Sync] Ошибка синхронизации', e)
	}
}

function startScheduler(settings: PluginSettings): void {
	stopScheduler()
	const intervalMs = Math.max(1, settings.intervalMinutes) * 60_000
	timerId = window.setInterval(() => {
		void syncOnce(settings)
	}, intervalMs)
	void syncOnce(settings)
}

function stopScheduler(): void {
	if (timerId != null) {
		clearInterval(timerId)
		timerId = null
	}
}

function registerUI() {
	logseq.App.registerUIItem('toolbar', {
		key: 'todoist-sync-now',
		template: `
			<a data-on-click="todoistSyncNow" title="Todoist Sync">
				<span class="ti ti-inbox"></span>
			</a>
		`,
	})
}

function onSettingsChanged(settings: PluginSettings) {
	startScheduler(settings)
}

logseq.useSettingsSchema([
	{ key: 'todoistApiToken', title: 'Todoist API Token', description: 'Личный токен из Todoist App Console', type: 'string', default: defaultSettings.todoistApiToken },
	{ key: 'inboxProjectId', title: 'Inbox Project ID', description: 'Необязательно. Если пусто, будет найден автоматически', type: 'string', default: defaultSettings.inboxProjectId ?? '' },
	{ key: 'journalHeading', title: 'Заголовок в журнале', description: 'Под каким заголовком будут вставляться задачи', type: 'string', default: defaultSettings.journalHeading },
	{ key: 'intervalMinutes', title: 'Интервал (мин)', description: 'Как часто синхронизировать', type: 'number', default: defaultSettings.intervalMinutes },
])

logseq.ready(async () => {
	registerUI()
	logseq.App.onSettingsChanged((newSettings) => onSettingsChanged(newSettings as unknown as PluginSettings))
	const settings = (logseq.settings ?? defaultSettings) as PluginSettings
	startScheduler(settings)
	logseq.provideModel({
		todoistSyncNow: async () => {
			await syncOnce((logseq.settings ?? defaultSettings) as PluginSettings)
		},
	})
}).catch(console.error)

export {}


