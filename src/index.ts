import '@logseq/libs'
import { defaultSettings, type PluginSettings } from './types'
import { TodoistClient } from './todoist'
import { addTasksToTodayJournal } from './logseq'

let timerId: number | null = null

async function syncOnce(settings: PluginSettings): Promise<void> {
	console.log('[Todoist Sync] Начинается синхронизация...')
	
	if (!settings.todoistApiToken) {
		const message = 'Не задан токен Todoist API. Откройте настройки плагина.'
		console.warn('[Todoist Sync]', message)
		logseq.UI.showMsg(message, 'warning', { timeout: 8000 })
		return
	}
	
	try {
		console.log('[Todoist Sync] Подключение к Todoist API...')
		const todoist = new TodoistClient(settings.todoistApiToken)
		let tasks = await todoist.getInboxTasks(settings.inboxProjectId)
		console.log(`[Todoist Sync] Найдено задач в Inbox: ${tasks.length}`)
		
		// Фильтруем уже синхронизированные задачи
		const syncedIds = settings.syncedTaskIds || []
		const newTasks = tasks.filter(task => !syncedIds.includes(task.id))
		
		if (newTasks.length === 0) {
			logseq.UI.showMsg('📥 Нет новых задач в Todoist Inbox', 'info', { timeout: 5000 })
			console.log(`[Todoist Sync] Все ${tasks.length} задач уже были синхронизированы ранее`)
			return
		}
		
		console.log(`[Todoist Sync] Новых задач для синхронизации: ${newTasks.length}`)
		logseq.UI.showMsg(`📥 Найдено новых задач: ${newTasks.length}`, 'info', { timeout: 4000 })

		console.log('[Todoist Sync] Добавление задач в журнал...')
		await addTasksToTodayJournal(newTasks)

		// Сохраняем ID синхронизированных задач
		const updatedSyncedIds = [...syncedIds, ...newTasks.map(t => t.id)]
		
		// Если включено удаление, удаляем задачи из Todoist
		if (settings.deleteAfterImport) {
			console.log('[Todoist Sync] Удаление задач из Todoist...')
			logseq.UI.showMsg('🗑️ Удаляем задачи из Todoist...', 'info', { timeout: 3000 })
			const results = await Promise.allSettled(newTasks.map(t => todoist.deleteTask(t.id)))
			const errors = results.filter(r => r.status === 'rejected')
			if (errors.length > 0) {
				console.warn('[Todoist Sync] Ошибки при удалении задач:', errors)
			}
			// Если задачи удалены из Todoist, очищаем список синхронизированных
			await logseq.updateSettings({ 
				syncedTaskIds: [],
				lastSyncTime: new Date().toISOString()
			})
		} else {
			// Если не удаляем, сохраняем ID для фильтрации в будущем
			await logseq.updateSettings({ 
				syncedTaskIds: updatedSyncedIds,
				lastSyncTime: new Date().toISOString()
			})
			console.log(`[Todoist Sync] Сохранено ${updatedSyncedIds.length} синхронизированных ID`)
		}
		
		const successMessage = settings.deleteAfterImport 
			? `✅ Синхронизировано и удалено ${newTasks.length} задач из Todoist`
			: `✅ Синхронизировано ${newTasks.length} новых задач (без удаления)`
		console.log('[Todoist Sync]', successMessage)
		logseq.UI.showMsg(successMessage, 'success', { timeout: 8000 })
	} catch (e) {
		const errorMessage = 'Ошибка синхронизации: ' + (e instanceof Error ? e.message : String(e))
		console.error('[Todoist Sync]', errorMessage, e)
		logseq.UI.showMsg(errorMessage, 'error', { timeout: 12000 })
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
	// Добавляем CSS для расширения контейнера toolbar, чтобы все кнопки помещались
	logseq.provideStyle(`
		.ui-items-container .list-wrap {
			max-width: 114px !important;
		}
	`)

	logseq.App.registerUIItem('toolbar', {
		key: 'todoist-sync-now',
		template: `
			<a data-on-click="todoistSyncNow" 
			   title="Синхронизировать Todoist Inbox" 
			   class="button">
				<i class="ti ti-checkbox"></i>
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
	{ key: 'deleteAfterImport', title: 'Удалять задачи из Todoist', description: 'Удалять задачи из Todoist после импорта в LogSeq', type: 'boolean', default: defaultSettings.deleteAfterImport },
	{ key: 'intervalMinutes', title: 'Интервал (мин)', description: 'Как часто синхронизировать', type: 'number', default: defaultSettings.intervalMinutes },
])

logseq.ready(async () => {
	registerUI()
	logseq.App.onSettingsChanged((newSettings) => onSettingsChanged(newSettings as unknown as PluginSettings))
	const settings = (logseq.settings ?? defaultSettings) as PluginSettings
	startScheduler(settings)
	logseq.provideModel({
		todoistSyncNow: async () => {
			console.log('[Todoist Sync] Кнопка нажата, начинается ручная синхронизация...')
			logseq.UI.showMsg('🔄 Начинается синхронизация...', 'info', { timeout: 5000 })
			try {
				await syncOnce((logseq.settings ?? defaultSettings) as PluginSettings)
			} catch (error) {
				console.error('[Todoist Sync] Ошибка при ручной синхронизации:', error)
				logseq.UI.showMsg('❌ Ошибка синхронизации', 'error', { timeout: 10000 })
			}
		},
		resetSyncHistory: async () => {
			console.log('[Todoist Sync] Сброс истории синхронизации...')
			await logseq.updateSettings({ 
				syncedTaskIds: [],
				lastSyncTime: undefined
			})
			logseq.UI.showMsg('🔄 История синхронизации сброшена', 'success', { timeout: 5000 })
		},
	})
}).catch(console.error)

export {}


