import '@logseq/libs'
import { defaultSettings, type PluginSettings } from './types'
import { TodoistClient } from './todoist'
import { addTasksToTodayJournal } from './logseq'

let timerId: number | null = null

async function syncOnce(settings: PluginSettings): Promise<void> {
	console.log('[Todoist Sync] Starting synchronization...')
	
	if (!settings.todoistApiToken) {
		const message = 'Todoist API token not set. Please configure in plugin settings.'
		console.warn('[Todoist Sync]', message)
		logseq.UI.showMsg(message, 'warning', { timeout: 8000 })
		return
	}
	
	try {
		console.log('[Todoist Sync] Connecting to Todoist API...')
		const todoist = new TodoistClient(settings.todoistApiToken)
		let tasks = await todoist.getInboxTasks(settings.inboxProjectId)
		console.log(`[Todoist Sync] Found tasks in Inbox: ${tasks.length}`)
		
		// Filter already synced tasks
		const syncedIds = settings.syncedTaskIds || []
		const newTasks = tasks.filter(task => !syncedIds.includes(task.id))
		
		if (newTasks.length === 0) {
			logseq.UI.showMsg('📥 No new tasks in Todoist Inbox', 'info', { timeout: 5000 })
			console.log(`[Todoist Sync] All ${tasks.length} tasks were already synced`)
			return
		}
		
		console.log(`[Todoist Sync] New tasks to sync: ${newTasks.length}`)
		logseq.UI.showMsg(`📥 Found new tasks: ${newTasks.length}`, 'info', { timeout: 4000 })

		console.log('[Todoist Sync] Adding tasks to journal...')
		await addTasksToTodayJournal(newTasks)

		// Save synced task IDs
		const updatedSyncedIds = [...syncedIds, ...newTasks.map(t => t.id)]
		
		// If deletion is enabled, delete tasks from Todoist
		if (settings.deleteAfterImport) {
			console.log('[Todoist Sync] Deleting tasks from Todoist...')
			logseq.UI.showMsg('🗑️ Deleting tasks from Todoist...', 'info', { timeout: 3000 })
			const results = await Promise.allSettled(newTasks.map(t => todoist.deleteTask(t.id)))
			const errors = results.filter(r => r.status === 'rejected')
			if (errors.length > 0) {
				console.warn('[Todoist Sync] Errors deleting tasks:', errors)
			}
			// If tasks deleted from Todoist, clear synced list
			await logseq.updateSettings({ 
				syncedTaskIds: [],
				lastSyncTime: new Date().toISOString()
			})
		} else {
			// If not deleting, save IDs for future filtering
			await logseq.updateSettings({ 
				syncedTaskIds: updatedSyncedIds,
				lastSyncTime: new Date().toISOString()
			})
			console.log(`[Todoist Sync] Saved ${updatedSyncedIds.length} synced IDs`)
		}
		
		const successMessage = settings.deleteAfterImport 
			? `✅ Synced and deleted ${newTasks.length} tasks from Todoist`
			: `✅ Synced ${newTasks.length} new tasks (not deleted)`
		console.log('[Todoist Sync]', successMessage)
		logseq.UI.showMsg(successMessage, 'success', { timeout: 8000 })
	} catch (e) {
		const errorMessage = 'Sync error: ' + (e instanceof Error ? e.message : String(e))
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
	// Add CSS to expand toolbar container to fit all buttons
	logseq.provideStyle(`
		.ui-items-container .list-wrap {
			max-width: 114px !important;
		}
	`)

	logseq.App.registerUIItem('toolbar', {
		key: 'todoist-sync-now',
		template: `
			<a data-on-click="todoistSyncNow" 
			   title="Sync Todoist Inbox" 
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
	{ key: 'todoistApiToken', title: 'Todoist API Token', description: 'Personal token from Todoist App Console', type: 'string', default: defaultSettings.todoistApiToken },
	{ key: 'inboxProjectId', title: 'Inbox Project ID', description: 'Optional. If empty, will be detected automatically', type: 'string', default: defaultSettings.inboxProjectId ?? '' },
	{ key: 'deleteAfterImport', title: 'Delete tasks from Todoist', description: 'Delete tasks from Todoist after importing to LogSeq', type: 'boolean', default: defaultSettings.deleteAfterImport },
	{ key: 'intervalMinutes', title: 'Interval (min)', description: 'How often to synchronize', type: 'number', default: defaultSettings.intervalMinutes },
])

logseq.ready(async () => {
	registerUI()
	logseq.App.onSettingsChanged((newSettings) => onSettingsChanged(newSettings as unknown as PluginSettings))
	const settings = (logseq.settings ?? defaultSettings) as PluginSettings
	startScheduler(settings)
	logseq.provideModel({
		todoistSyncNow: async () => {
			console.log('[Todoist Sync] Button clicked, starting manual sync...')
			logseq.UI.showMsg('🔄 Starting synchronization...', 'info', { timeout: 5000 })
			try {
				await syncOnce((logseq.settings ?? defaultSettings) as PluginSettings)
			} catch (error) {
				console.error('[Todoist Sync] Error during manual sync:', error)
				logseq.UI.showMsg('❌ Sync error', 'error', { timeout: 10000 })
			}
		},
		resetSyncHistory: async () => {
			console.log('[Todoist Sync] Resetting sync history...')
			await logseq.updateSettings({ 
				syncedTaskIds: [],
				lastSyncTime: undefined
			})
			logseq.UI.showMsg('🔄 Sync history reset', 'success', { timeout: 5000 })
		},
	})
}).catch(console.error)

export {}


