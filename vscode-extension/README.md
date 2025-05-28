# Dev Helper

A Visual Studio Code extension designed to help developers maintain focus and boost productivity through task management, focus sessions, and productivity analytics.

## Features

### 🎯 Focus Mode
- Start and stop focus sessions with customizable durations
- Block notifications during focus sessions
- Track focus time and productivity metrics
- Visual feedback for active focus sessions

### 📋 Task Management
- Create and manage tasks directly in VS Code
- Break down complex tasks into subtasks
- Track task completion and progress
- Estimate and monitor task durations

### 📊 Productivity Analytics
- Daily, weekly, and monthly productivity insights
- Focus time tracking and statistics
- Task completion rates
- Best productivity hours analysis
- Streak tracking for consistent productivity

### 🎮 Gamification (Optional)
- Earn XP for completing tasks
- Track productivity streaks
- Visualize progress and achievements

## Installation

1. Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Search for "Dev Helper"
4. Click Install

## Usage

### Dashboard
Access the Dev Helper dashboard from the activity bar (sidebar) to:
- View your tasks and progress
- Start/stop focus sessions
- Monitor productivity metrics
- Access quick actions

### Commands
- `Dev Helper: Start Focus Mode` (Ctrl+Shift+H)
- `Dev Helper: Stop Focus Mode` (Ctrl+Shift+J)
- `Dev Helper: Show Dashboard`
- `Dev Helper: Create Task`
- `Dev Helper: Decompose Task`
- `Dev Helper: Show Blocked Notifications`

### Configuration
The extension can be configured through VS Code settings:

```json
{
    "devHelper.theme": "dev-helper-light", // Choose from: dev-helper-light, dev-helper-dark, dev-helper-high-contrast
    "devHelper.apiUrl": "", // Optional API URL for advanced features
    "devHelper.notificationBlocking": true, // Enable/disable notification blocking during focus
    "devHelper.gamification": false, // Enable/disable gamification features
    "devHelper.debug": true // Enable/disable debug mode
}
```

## Development

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)
- VS Code Extension Development Tools

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run compile
   ```
4. Press F5 in VS Code to start debugging

### Available Scripts
- `npm run compile` - Compile the extension
- `npm run watch` - Watch for changes and recompile
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run package` - Package the extension for distribution

### Project Structure
```
vscode-extension/
├── src/
│   ├── api/          # API client and services
│   ├── analysis/     # Productivity analytics
│   ├── context/      # VS Code context management
│   ├── gamification/ # Gamification features
│   ├── hyperfocus/   # Focus mode implementation
│   ├── notifications/# Notification management
│   ├── tasks/        # Task management
│   ├── themes/       # Custom themes
│   ├── utils/        # Utility functions
│   └── views/        # UI components
├── media/            # Icons and assets
├── themes/           # Theme definitions
└── tests/            # Test files
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Report bugs and feature requests on [GitHub Issues](https://github.com/yourusername/dev-helper/issues)
- For questions and discussions, use [GitHub Discussions](https://github.com/yourusername/dev-helper/discussions)

## Acknowledgments

- Thanks to all contributors who have helped me shape this extension
- Inspired by productivity tools and focus techniques used by developers worldwide

## Security & Privacy

- **[Security Policy](./SECURITY.md):** Details all security measures, including input sanitization, webview protection, and local-only data handling.
- **[Privacy Policy](./PRIVACY.md):** Explains how your data is handled, stored only locally, and never shared or tracked.

**Summary:**
- All your data (tasks, tags, categories, preferences) is stored locally and never sent to third parties.
- No analytics, telemetry, or personal data is collected.
- All user input is validated and sanitized to prevent vulnerabilities (XSS, injection, etc.).
- Sensitive operations (file access, storage) are protected and never expose data externally.
- You can delete all your data at any time via the extension interface or by uninstalling the extension.

For details, see the linked policy files above.

---