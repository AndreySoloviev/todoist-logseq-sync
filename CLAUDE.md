# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Logseq plugin that synchronizes tasks from Todoist Inbox to the current day's journal and deletes them from Todoist. The plugin runs on a configurable timer (default 5 minutes) and provides a manual sync button in the toolbar.

## Development Commands

- `npm run dev` - Start development build with file watching
- `npm run build` - Build the plugin for distribution (outputs to `dist/`)
- `npm run clean` - Clean the distribution folder

## Architecture

### Core Files
- `src/index.ts` - Main plugin entry point, handles settings, scheduler, and UI registration
- `src/todoist.ts` - TodoistClient class for Todoist REST API v2 operations
- `src/logseq.ts` - Logseq-specific operations for journal manipulation and block insertion
- `src/types.ts` - TypeScript interfaces and default settings
- `scripts/build.mjs` - ESBuild configuration with esbuild bundling

### Key Components

**TodoistClient (`src/todoist.ts:5`)**
- Handles authentication with Bearer token
- Auto-discovers Inbox project if not specified
- Manages task retrieval and deletion via REST API

**Sync Process (`src/index.ts:8`)**
1. Fetches all tasks from Todoist Inbox
2. Ensures today's journal page has the configured heading
3. Appends tasks as blocks under the heading
4. Deletes tasks from Todoist (best-effort, uses Promise.allSettled)

**Journal Integration (`src/logseq.ts:3`)**
- Creates/finds journal pages for current date
- Manages block hierarchy and insertion
- Uses batch operations for efficiency

### Plugin Settings
- `todoistApiToken` - Required Todoist API token
- `inboxProjectId` - Optional specific project ID (auto-discovered if empty)
- `journalHeading` - Section heading in journal (default: "Todoist Inbox")
- `intervalMinutes` - Sync frequency (default: 5 minutes)

## Build System

Uses esbuild for bundling with:
- ES2020 target
- Browser platform
- Bundled output to `dist/index.js`
- Automatic copying of manifest.json and README.md

## Development Notes

- Plugin uses `@logseq/libs` for Logseq API integration
- All async operations use proper error handling with console logging
- Tasks are formatted with due dates, labels, priority, and links when present
- Scheduler automatically restarts when settings change
- Manual sync available via toolbar button with inbox icon