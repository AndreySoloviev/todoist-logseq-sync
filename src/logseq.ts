import '@logseq/libs'

export async function ensureTodayJournalHeading(heading: string): Promise<string | null> {
	// get current journal page
	const page = await logseq.Editor.getCurrentPage()
	// Fallback to today's journal page by name (yyyy-MM-dd)
	let journalPage = page
	if (!journalPage || !journalPage['journal?']) {
		const todayName = new Date().toISOString().slice(0, 10)
		journalPage = await logseq.Editor.getPage(todayName)
	}
	if (!journalPage) return null

	// Find or create heading block on top level
	const blocks = await logseq.Editor.getPageBlocksTree(journalPage.uuid)
	let headingBlock = blocks.find(b => (b.content ?? '').trim() === `## ${heading}`)
	if (!headingBlock) {
		const firstBlock = blocks[0]
		headingBlock = await logseq.Editor.insertBlock(journalPage.uuid, `## ${heading}`, { sibling: false, before: true })
		if (!headingBlock) return null
	}
	return headingBlock.uuid
}

export async function appendTasksUnderBlock(blockUuid: string, items: string[]): Promise<void> {
	if (items.length === 0) return
	const children = items.map(i => ({ content: i }))
	await logseq.Editor.insertBatchBlock(blockUuid, children, { sibling: false })
}


