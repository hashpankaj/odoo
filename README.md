# RequestPro - Advanced Request Modifier Chrome Extension

A powerful Chrome extension for modifying HTTP requests, similar to Requestly, with a modern dark-themed interface.

## Features

### Core Functionality
- **URL Redirection**: Redirect requests to different URLs with pattern matching
- **Header Modification**: Add, modify, or remove HTTP request/response headers
- **Request Blocking**: Block specific requests from loading
- **Request Delays**: Add artificial delays to requests for testing
- **Script Injection**: Inject custom JavaScript into web pages
- **Query Parameter Manipulation**: Modify URL query parameters
- **User Agent Override**: Change browser user agent string

### Advanced Features
- **Rule Management**: Create, edit, delete, and organize rules
- **Import/Export**: Backup and share rule configurations
- **Real-time Statistics**: Monitor blocked/redirected requests
- **Pattern Matching**: Support for contains, equals, starts-with, ends-with, and regex
- **Rule Activation**: Toggle rules on/off without deletion
- **Modern UI**: Dark theme with smooth animations and responsive design

## Installation

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build:extension`
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Production Build
```bash
npm run build:extension
```

## Usage

### Creating Rules
1. Click the RequestPro extension icon
2. Navigate to "Create Rule"
3. Choose a rule type (redirect, block, modify headers, etc.)
4. Configure conditions (URL patterns, hosts, paths)
5. Set up actions (redirect URL, header values, scripts)
6. Save and activate the rule

### Rule Types

#### URL Redirect
- Redirect matching requests to different URLs
- Supports dynamic URL patterns
- Useful for API endpoint switching

#### Header Modification
- Add custom headers to requests/responses
- Remove unwanted headers
- Modify existing header values

#### Request Blocking
- Block requests matching specific patterns
- Useful for blocking trackers, ads, or unwanted resources

#### Script Injection
- Inject custom JavaScript into web pages
- Access to page context and DOM
- Useful for debugging and testing

#### Query Parameters
- Add, modify, or remove URL parameters
- Dynamic parameter manipulation

#### User Agent Override
- Change browser identification
- Test mobile/desktop versions
- Bypass user agent restrictions

### Pattern Matching
- **Contains**: URL contains the specified text
- **Equals**: URL exactly matches the pattern
- **Starts with**: URL begins with the pattern
- **Ends with**: URL ends with the pattern
- **Regex**: Advanced pattern matching with regular expressions

## Architecture

### Extension Components
- **Background Script**: Handles request interception and rule processing
- **Content Script**: Manages script injection and DOM manipulation
- **Popup Interface**: React-based UI for rule management
- **Storage**: Chrome extension storage for rule persistence

### Key Files
- `public/manifest.json`: Extension configuration
- `public/background.js`: Service worker for request handling
- `public/content.js`: Content script for page interaction
- `src/services/chromeExtensionService.ts`: Extension API wrapper
- `src/hooks/useChromeExtension.ts`: React hook for extension features

## Development

### Project Structure
```
src/
├── components/          # React components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── services/           # Extension services
├── types/              # TypeScript definitions
└── utils/              # Utility functions

public/
├── manifest.json       # Extension manifest
├── background.js       # Background service worker
├── content.js          # Content script
└── injected.js         # Page context script
```

### Building
- `npm run dev`: Development server
- `npm run build`: Production build
- `npm run build:extension`: Build for Chrome extension

### Testing
1. Load the extension in Chrome
2. Test rule creation and activation
3. Verify request interception works
4. Check script injection functionality

## Permissions

The extension requires the following permissions:
- `declarativeNetRequest`: For request blocking and redirection
- `webRequest`: For request interception
- `storage`: For rule persistence
- `activeTab`: For current tab access
- `scripting`: For script injection
- `tabs`: For tab management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Comparison with Requestly

RequestPro offers similar functionality to Requestly with these advantages:
- Modern, dark-themed interface
- Better performance with Manifest V3
- Enhanced script injection capabilities
- Improved rule management
- Open source and customizable