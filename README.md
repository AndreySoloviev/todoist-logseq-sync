# Todoist Inbox Sync for Logseq

A Logseq plugin that automatically synchronizes tasks from your Todoist Inbox to your daily journal and removes them from Todoist after import. Perfect for capturing tasks in Todoist on the go and processing them in Logseq.

## Features

- 🔄 **Automatic Sync**: Syncs tasks from Todoist Inbox every 5 minutes (configurable)
- 📅 **Daily Journal Integration**: Adds tasks directly to today's journal page
- 🏷️ **Rich Task Import**: Preserves task details including due dates, labels, priority, and links
- 🗑️ **Auto-cleanup**: Automatically removes tasks from Todoist after successful import
- ⚡ **Manual Sync**: Toolbar button for on-demand synchronization
- ⚙️ **Configurable**: Customize sync interval, target heading, and more

## Installation

### Method 1: Install from Marketplace (Recommended)

1. Open Logseq
2. Go to Settings → Plugins (press `t` `p`)
3. Click on "Marketplace" tab
4. Search for "Todoist Inbox Sync"
5. Click "Install"

### Method 2: Manual Installation

1. Download the latest release from the [Releases page](https://github.com/yourusername/todoist-inbox-sync/releases)
2. Unzip the downloaded file
3. In Logseq, go to Settings → Plugins
4. Click "Load unpacked plugin" 
5. Select the unzipped folder

### Method 3: Install from Source

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/todoist-inbox-sync.git
   cd todoist-inbox-sync
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. In Logseq:
   - Go to Settings → Plugins
   - Click "Load unpacked plugin"
   - Select the `dist` folder from the cloned repository

## Setup

### 1. Get Your Todoist API Token

1. Log in to [Todoist](https://todoist.com)
2. Go to Settings → Integrations → Developer
3. Copy your API token

### 2. Configure the Plugin

1. In Logseq, click on the plugin settings icon (⚙️) in the toolbar
2. Find "Todoist Inbox Sync" and click its settings button
3. Enter your configuration:
   - **Todoist API Token** (required): Paste your API token
   - **Inbox Project ID** (optional): Leave empty to auto-detect, or specify a project ID
   - **Journal Heading** (optional): Section name for tasks (default: "Todoist Inbox")
   - **Sync Interval** (optional): Minutes between syncs (default: 5)

## Usage

### Automatic Sync

Once configured, the plugin will automatically:
1. Check your Todoist Inbox every X minutes (as configured)
2. Import any tasks found to today's journal page
3. Delete the tasks from Todoist

### Manual Sync

Click the inbox icon (📥) in the Logseq toolbar to trigger an immediate sync.

### How Tasks Are Imported

Tasks are added to the beginning of your daily journal page in the following format:

```markdown
Task content ⏰ 2024-01-15 #[work] #[urgent] #task
Description of the task (if any)
```

The format includes:
- Task content followed by due date (if set) with ⏰ emoji
- Labels in square brackets format: `#[label]`
- All tasks are tagged with `#task` for easy filtering
- Task description appears on the next line (if provided)

## Configuration Options

| Option | Description | Default | Required |
|--------|-------------|---------|----------|
| `todoistApiToken` | Your Todoist API token | - | ✅ Yes |
| `inboxProjectId` | Specific project ID to sync from | Auto-detect Inbox | ❌ No |
| `journalHeading` | Heading name in daily journal | "Todoist Inbox" | ❌ No |
| `intervalMinutes` | Minutes between automatic syncs | 5 | ❌ No |

## Troubleshooting

### Tasks not syncing

1. **Check API Token**: Ensure your Todoist API token is correct
2. **Check Console**: Open Developer Tools (F12) and check for error messages
3. **Verify Project**: If using custom project ID, verify it exists in Todoist
4. **Manual Sync**: Try clicking the toolbar button to trigger manual sync

### Tasks appear but aren't deleted from Todoist

- The plugin uses best-effort deletion. Check console for specific errors
- Ensure your API token has write permissions

### Plugin not loading

1. Ensure you're using a compatible version of Logseq (0.8.0 or higher)
2. Try reloading the plugin from Settings → Plugins
3. Check that the plugin files are in the correct location

## Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/todoist-inbox-sync.git
cd todoist-inbox-sync

# Install dependencies
npm install

# Start development build with watch mode
npm run dev

# Build for production
npm run build
```

### Project Structure

```
todoist-inbox-sync/
├── src/
│   ├── index.ts       # Main plugin entry point
│   ├── todoist.ts     # Todoist API client
│   ├── logseq.ts      # Logseq integration
│   └── types.ts       # TypeScript definitions
├── dist/              # Built plugin files
├── manifest.json      # Plugin manifest
└── package.json       # Dependencies and scripts
```

## Privacy & Security

- Your Todoist API token is stored locally in Logseq settings
- No data is sent to third-party servers
- All communication is directly between your Logseq instance and Todoist API
- Tasks are permanently deleted from Todoist after import

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Open an issue on [GitHub Issues](https://github.com/AndreySoloviev/todoist-inbox-sync/issues)
- Check existing issues for solutions

## Acknowledgments

- Built with [Logseq Plugin SDK](https://plugins-doc.logseq.com/)
- Uses [Todoist REST API v2](https://developer.todoist.com/rest/v2/)

---

Made with ❤️ for the Logseq community
