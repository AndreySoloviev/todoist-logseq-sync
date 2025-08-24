import '@logseq/libs'
import type { TodoistTask } from './types'

export async function addTasksToTodayJournal(tasks: TodoistTask[]): Promise<void> {
	console.log(`[Logseq Helper] Добавляем ${tasks.length} задач в начало сегодняшнего журнала...`)
	logseq.UI.showMsg(`📝 Добавляем ${tasks.length} задач в журнал`, 'info', { timeout: 5000 })
	
	if (tasks.length === 0) {
		logseq.UI.showMsg(`ℹ️ Нет задач для добавления`, 'info', { timeout: 5000 })
		return
	}
	
	try {
		// Получаем сегодняшнюю дату в формате YYYY-MM-DD
		const today = new Date().toISOString().slice(0, 10)
		console.log(`[Logseq Helper] Сегодняшняя дата: ${today}`)
		logseq.UI.showMsg(`📅 Работаем с датой: ${today}`, 'info', { timeout: 5000 })
		
		let addedCount = 0
		
		// Обрабатываем задачи в обратном порядке, чтобы первая задача оказалась наверху
		for (let i = tasks.length - 1; i >= 0; i--) {
			const task = tasks[i]
			
			// Форматируем основную задачу: только контент + дата + лейблы + #task
			const due = task.due?.string || task.due?.date || ''
			const labels = (task.labels && task.labels.length) ? ` #[${task.labels.join('] #[')}]` : ''
			const taskContent = `${task.content}${due ? ` ⏰ ${due}` : ''}${labels} #task`.trim()
			
			console.log(`[Logseq Helper] Задача ${i + 1}/${tasks.length}: ${taskContent}`)
			logseq.UI.showMsg(`➕ Добавляем: ${task.content}`, 'info', { timeout: 4000 })
			
			let taskBlock = null
			
			// Способ 1: Пробуем prependBlockInPage
			try {
				console.log(`[Logseq Helper] Способ 1: prependBlockInPage для страницы "${today}"`)
				taskBlock = await logseq.Editor.prependBlockInPage(today, taskContent)
				if (taskBlock) {
					console.log(`[Logseq Helper] ✅ prependBlockInPage сработал, UUID: ${taskBlock.uuid}`)
				}
			} catch (error1) {
				console.log(`[Logseq Helper] ❌ prependBlockInPage не сработал:`, error1)
			}
			
			// Способ 2: Если не сработал, пробуем appendBlockInPage
			if (!taskBlock) {
				try {
					console.log(`[Logseq Helper] Способ 2: appendBlockInPage для страницы "${today}"`)
					taskBlock = await logseq.Editor.appendBlockInPage(today, taskContent)
					if (taskBlock) {
						console.log(`[Logseq Helper] ✅ appendBlockInPage сработал, UUID: ${taskBlock.uuid}`)
					}
				} catch (error2) {
					console.log(`[Logseq Helper] ❌ appendBlockInPage не сработал:`, error2)
				}
			}
			
			// Способ 3: Пробуем создать/получить страницу явно и insertBlock
			if (!taskBlock) {
				try {
					console.log(`[Logseq Helper] Способ 3: Ищем страницу "${today}" для insertBlock`)
					let page = await logseq.Editor.getPage(today)
					if (!page) {
						console.log(`[Logseq Helper] Страница не найдена, создаём новую`)
						page = await logseq.Editor.createPage(today, {}, { journal: true, createFirstBlock: false })
					}
					if (page) {
						console.log(`[Logseq Helper] Страница найдена/создана: ${page.name}, UUID: ${page.uuid}`)
						taskBlock = await logseq.Editor.insertBlock(page.uuid, taskContent, { sibling: false, before: true })
						if (taskBlock) {
							console.log(`[Logseq Helper] ✅ insertBlock сработал, UUID: ${taskBlock.uuid}`)
						}
					}
				} catch (error3) {
					console.log(`[Logseq Helper] ❌ insertBlock не сработал:`, error3)
				}
			}
			
			if (taskBlock) {
				console.log(`[Logseq Helper] Задача добавлена успешно, UUID: ${taskBlock.uuid}`)
				addedCount++
				
				if (task.description) {
					// Если есть описание, добавляем его как вложенный блок
					console.log(`[Logseq Helper] Добавляем описание: ${task.description}`)
					logseq.UI.showMsg(`📝 Добавляем описание`, 'info', { timeout: 3000 })
					try {
						await logseq.Editor.insertBlock(taskBlock.uuid, task.description, { sibling: false })
						console.log(`[Logseq Helper] Описание добавлено`)
					} catch (descError) {
						console.error(`[Logseq Helper] Ошибка добавления описания:`, descError)
						logseq.UI.showMsg(`⚠️ Не удалось добавить описание`, 'warning', { timeout: 6000 })
					}
				}
			} else {
				console.error(`[Logseq Helper] Все способы не сработали для задачи: ${task.content}`)
				logseq.UI.showMsg(`❌ Не удалось добавить: ${task.content}`, 'error', { timeout: 8000 })
			}
		}
		
		console.log(`[Logseq Helper] Добавлено ${addedCount} из ${tasks.length} задач`)
		if (addedCount > 0) {
			logseq.UI.showMsg(`✅ Добавлено ${addedCount} задач в начало журнала`, 'success', { timeout: 6000 })
		} else {
			logseq.UI.showMsg(`❌ Не удалось добавить ни одной задачи`, 'error', { timeout: 10000 })
		}
		
	} catch (error) {
		console.error('[Logseq Helper] Общая ошибка при добавлении задач:', error)
		logseq.UI.showMsg(`❌ Общая ошибка: ${String(error)}`, 'error', { timeout: 10000 })
		throw error
	}
}


