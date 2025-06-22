# @teawithsand/sandbox

A powerful TypeScript library for creating secure sandboxed execution environments in web browsers. Execute JavaScript, Python (via PyScript), and TypeScript code in isolated iframes with comprehensive event monitoring and state management.

## Features

- 🔒 **Secure Execution**: Run untrusted code in isolated iframe sandboxes
- 🐍 **PyScript Support**: Execute Python code directly in the browser
- 📘 **TypeScript Support**: Compile and run TypeScript code on-the-fly
- 📊 **State Management**: Track loading states, errors, and execution status
- 🎯 **Event System**: Monitor console output, errors, and custom events
- 🎨 **HTML Builder**: Fluent API for building sandbox HTML documents
- 🌐 **Cross-browser**: Works in modern browsers with iframe support

## Installation

```bash
npm install @teawithsand/sandbox
```

## Quick Start

### Basic JavaScript Execution

```typescript
import { Sandbox, HtmlBuilder } from '@teawithsand/sandbox';
import { createStore } from '@teawithsand/fstate';

// Create a store for state management
const store = createStore();

// Create sandbox instance
const sandbox = new Sandbox({ store });

// Subscribe to events
sandbox.bus.addSubscriber((message) => {
    console.log('Sandbox event:', message);
});

// Create and load HTML with JavaScript
const html = new HtmlBuilder({ title: "My Sandbox" })
    .setBodyContent('<h1>Hello Sandbox!</h1>')
    .addFooterScript({
        content: `
            console.log("Hello from sandbox!");
            console.log("Current time:", new Date().toISOString());
        `
    })
    .build();

sandbox.loadHtml(html);

// Monitor sandbox state
store.subscribe(sandbox.state, (state) => {
    console.log('Sandbox state:', state);
    if (state.loaded) {
        console.log('Sandbox is ready!');
    }
});
```

### Python Execution with PyScript

```typescript
import { Sandbox, HtmlBuilder } from '@teawithsand/sandbox';
import { createStore } from '@teawithsand/fstate';

const store = createStore();
const sandbox = new Sandbox({ store });

// Subscribe to console messages
sandbox.bus.addSubscriber((message) => {
    if (message.type === 'console') {
        console.log(`Python output [${message.level}]:`, ...message.args);
    }
});

// Create HTML with PyScript support
const html = new HtmlBuilder({ title: "Python Sandbox" })
    .includePyScript("2024.1.1") // Include PyScript runtime
    .setBodyContent(`
        <h1>Python in the Browser</h1>
        <py-script>
            import sys
            import math
            
            print("Hello from Python!")
            print(f"Python version: {sys.version}")
            print(f"Pi is approximately: {math.pi:.4f}")
            
            # Data processing example
            numbers = [1, 2, 3, 4, 5]
            squared = [x**2 for x in numbers]
            print(f"Original: {numbers}")
            print(f"Squared: {squared}")
        </py-script>
    `)
    .build();

sandbox.loadHtml(html);
```

### TypeScript Compilation and Execution

```typescript
import { Sandbox, HtmlBuilder } from '@teawithsand/sandbox';
import { createStore } from '@teawithsand/fstate';

const store = createStore();
const sandbox = new Sandbox({ store });

sandbox.bus.addSubscriber((message) => {
    console.log('TypeScript sandbox:', message);
});

const html = new HtmlBuilder({ title: "TypeScript Sandbox" })
    .includeTypeScript("5.3.3") // Include TypeScript compiler
    .addFooterScript({
        content: `
            // Wait for TypeScript to load
            setTimeout(() => {
                const tsCode = \`
                    interface User {
                        name: string;
                        age: number;
                        isActive: boolean;
                    }
                    
                    class UserManager {
                        private users: User[] = [];
                        
                        addUser(user: User): void {
                            this.users.push(user);
                            console.log(\\\`Added user: \\\${user.name}\\\`);
                        }
                        
                        getActiveUsers(): User[] {
                            return this.users.filter(u => u.isActive);
                        }
                        
                        getUserCount(): number {
                            return this.users.length;
                        }
                    }
                    
                    const manager = new UserManager();
                    manager.addUser({ name: "Alice", age: 30, isActive: true });
                    manager.addUser({ name: "Bob", age: 25, isActive: false });
                    manager.addUser({ name: "Charlie", age: 35, isActive: true });
                    
                    console.log("Total users:", manager.getUserCount());
                    console.log("Active users:", manager.getActiveUsers());
                \`;
                
                try {
                    const compiled = window.compileTypeScript(tsCode);
                    console.log("TypeScript compiled successfully!");
                    eval(compiled);
                } catch (error) {
                    console.error("TypeScript compilation failed:", error);
                }
            }, 500);
        `
    })
    .build();

sandbox.loadHtml(html);
```

### Advanced HTML Building

```typescript
import { Sandbox, HtmlBuilder } from '@teawithsand/sandbox';

// Create a rich HTML environment
const html = new HtmlBuilder({ title: "Advanced Sandbox" })
    // Add CSS frameworks
    .addCssLink("https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css")
    .addCssLink("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css")
    
    // Add custom styles
    .setInlineStyles(`
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            margin-top: 2rem;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    `)
    
    // Add meta tags
    .addCustomHeaderEntry({
        tag: "meta",
        attributes: { name: "viewport", content: "width=device-width, initial-scale=1" }
    })
    
    // Set body content
    .setBodyContent(`
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <h1 class="card-title">
                                <i class="fas fa-code"></i>
                                Advanced Sandbox
                            </h1>
                            <p class="card-text">
                                This sandbox includes Bootstrap, Font Awesome, and custom styling.
                            </p>
                            <div id="output" class="mt-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `)
    
    // Add interactive JavaScript
    .addFooterScript({
        content: `
            const output = document.getElementById('output');
            
            function addMessage(message, type = 'info') {
                const alert = document.createElement('div');
                alert.className = \`alert alert-\${type} alert-dismissible fade show\`;
                alert.innerHTML = \`
                    \${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                \`;
                output.appendChild(alert);
            }
            
            // Simulate some activity
            setTimeout(() => addMessage('Sandbox loaded successfully!', 'success'), 1000);
            setTimeout(() => addMessage('All systems operational.', 'info'), 2000);
            
            console.log('Advanced sandbox is ready!');
        `
    })
    
    // Add Bootstrap JavaScript
    .addFooterScript({
        src: "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
    })
    
    .build();

const sandbox = new Sandbox({ store: createStore() });
sandbox.loadHtml(html);
```

### Error Handling and Monitoring

```typescript
import { Sandbox, HtmlBuilder, SandboxMessageType } from '@teawithsand/sandbox';
import { createStore } from '@teawithsand/fstate';

const store = createStore();
const sandbox = new Sandbox({ store });

// Comprehensive event monitoring
sandbox.bus.addSubscriber((message) => {
    switch (message.type) {
        case SandboxMessageType.CONSOLE:
            console.log(`[${message.level.toUpperCase()}]`, ...message.args);
            break;
            
        case SandboxMessageType.ERROR:
            console.error('Sandbox Error:', {
                message: message.message,
                filename: message.filename,
                stack: message.stack
            });
            break;
            
        case SandboxMessageType.UNHANDLED_REJECTION:
            console.error('Unhandled Promise Rejection:', message.reason);
            break;
    }
});

// Monitor state changes
store.subscribe(sandbox.state, (state) => {
    console.log('State update:', {
        loaded: state.loaded,
        domContentLoaded: state.domContentLoaded,
        hasErrored: state.hasErrored
    });
    
    if (state.hasErrored) {
        console.error('Sandbox encountered an error!');
    }
});

// Load potentially problematic code
const html = new HtmlBuilder({ title: "Error Handling Demo" })
    .addFooterScript({
        content: `
            console.log("Starting error handling demo...");
            
            // This will cause an unhandled error
            setTimeout(() => {
                throw new Error("Intentional error for demo");
            }, 1000);
            
            // This will cause an unhandled rejection
            setTimeout(() => {
                Promise.reject(new Error("Intentional rejection for demo"));
            }, 2000);
            
            console.log("Demo script loaded");
        `
    })
    .build();

sandbox.loadHtml(html);
```

### Cleanup and Resource Management

```typescript
import { Sandbox, HtmlBuilder } from '@teawithsand/sandbox';
import { createStore } from '@teawithsand/fstate';

const store = createStore();
const sandbox = new Sandbox({ store });

// Subscribe and store unsubscribe function
const unsubscribe = sandbox.bus.addSubscriber((message) => {
    console.log('Event:', message);
});

// Use the sandbox...
sandbox.loadHtml(new HtmlBuilder().build());

// Cleanup when done
function cleanup() {
    // Unsubscribe from events
    unsubscribe();
    
    // Release sandbox resources
    sandbox.release();
    
    console.log('Sandbox cleaned up');
}

// Call cleanup when appropriate (e.g., component unmount, page unload)
window.addEventListener('beforeunload', cleanup);
```
- 🎨 **UI Integration**: Works with existing DOM iframes
- 📝 **Event/Log Capture**: Comprehensive logging and error handling
- ⏱️ **Resource Limits**: Configurable timeouts and resource controls
- 🏗️ **Builder Pattern**: Flexible HTML building with SandboxHtmlBuilder

## Installation

```bash
npm install @teawithsand/sandbox
```

## Quick Start

### Basic Usage

```typescript
import { Sandbox, SandboxHtmlBuilder } from "@teawithsand/sandbox"

// Create a sandbox
const sandbox = new Sandbox({ timeoutMs: 10000 })

// Build HTML using the builder
const html = new SandboxHtmlBuilder()
  .setSandboxId(sandbox.getId())
  .setBodyHtml('<h1>Hello, World!</h1><button id="btn">Click me!</button>')
  .addStyles('h1 { color: blue; } button { padding: 10px; }')
  .addFootScript({
    content: `
      document.getElementById('btn').addEventListener('click', () => {
        console.log('Button clicked!');
        document.querySelector('h1').textContent = 'Hello, Sandbox!';
      });
    `
  })
  .build()

// Load and execute
sandbox.loadHtml(html)

// Listen to events
    console.error("Sandbox error:", event.error.message)
  }
})

// Embed in page
document.body.appendChild(sandbox.getIframe())
```

### Using Existing iframe

```typescript
const existingIframe = document.getElementById('my-iframe') as HTMLIFrameElement

const sandbox = new Sandbox({ iframe: existingIframe })

const html = new SandboxHtmlBuilder()
  .setSandboxId(sandbox.getId())
  .setBodyHtml('<p>Using existing iframe!</p>')
  .build()

sandbox.loadHtml(html)
```

### Python/PyScript Support

```typescript
const sandbox = new Sandbox()

const html = new SandboxHtmlBuilder()
  .setSandboxId(sandbox.getId())
  .setBodyHtml('<div id="output"></div>')
  .enablePython({
    packages: ["numpy", "matplotlib"]
  })
  .addFootScript({
    type: "py",
    content: `
import math
result = math.sqrt(16)
print(f"Square root of 16 is: {result}")
    `
  })
  .build()

sandbox.loadHtml(html)
```

## API Reference

### Sandbox Class

#### Constructor
```typescript
new Sandbox({ store, iframe? }: SandboxOptions)
```

**Parameters:**
- `store: JotaiStore` - Jotai store instance for state management
- `iframe?: HTMLIFrameElement` - Optional existing iframe element to use

#### Methods

##### `loadHtml(html: string): void`
Load HTML content into the sandbox iframe.

```typescript
const html = new HtmlBuilder().setBodyContent('<h1>Hello</h1>').build();
sandbox.loadHtml(html);
```

##### `release(): void`
Clean up resources and remove event listeners. Call this when you're done with the sandbox.

```typescript
sandbox.release();
```

#### Properties

##### `state: Atom<SandboxState>`
Reactive state atom that can be subscribed to for state changes.

```typescript
store.subscribe(sandbox.state, (state) => {
    console.log('Sandbox state changed:', state);
});
```

##### `bus: Subscribable<SandboxMessage>`
Event bus for monitoring sandbox events. Returns an unsubscribe function.

```typescript
const unsubscribe = sandbox.bus.addSubscriber((message) => {
    console.log('Event:', message);
});
```

### HtmlBuilder Class

#### Constructor
```typescript
new HtmlBuilder({ title? }: { title?: string })
```

**Parameters:**
- `title?: string` - Document title (default: "Sandbox Document")

#### Fluent API Methods

All methods return `this` for method chaining.

##### `setTitle(title: string): this`
Set the document title.

##### `setBodyContent(content: string): this`
Set the HTML content of the body element.

##### `setInlineStyles(styles: string): this`
Add CSS styles to the document head.

##### `addHeaderScript(script: ScriptEntry): this`
Add a script element to the document head.

##### `addFooterScript(script: ScriptEntry): this`
Add a script element before the closing body tag.

##### `addCssLink(href: string, integrity?: string, crossorigin?: string): this`
Add a CSS stylesheet link to the document head.

##### `addCustomHeaderEntry(entry: CustomHeaderEntry): this`
Add any custom HTML element to the document head.

##### `includePyScript(version?: string): this`
Include PyScript runtime for Python execution (default version: "2024.1.1").

##### `includeTypeScript(version?: string): this`
Include TypeScript compiler for runtime compilation (default version: "5.3.3").

##### `build(): string`
Generate the final HTML document string.

### Type Definitions

#### SandboxState
```typescript
interface SandboxState {
    html: string;              // Current HTML content
    loaded: boolean;           // Document fully loaded
    domContentLoaded: boolean; // DOM content loaded
    hasErrored: boolean;       // Whether an error occurred
}
```

#### SandboxMessage
```typescript
type SandboxMessage =
    | {
        type: SandboxMessageType.CONSOLE;
        level: ConsoleLogLevel;
        args: unknown[];
        timestamp: number;
    }
    | {
        type: SandboxMessageType.ERROR;
        message: string;
        filename?: string;
        stack?: string;
        timestamp: number;
    }
    | {
        type: SandboxMessageType.UNHANDLED_REJECTION;
        reason: unknown;
        promise?: string;
        timestamp: number;
    }
```

#### ScriptEntry
```typescript
interface ScriptEntry {
    src?: string;           // External script URL
    content?: string;       // Inline script content
    async?: boolean;        // Async loading
    defer?: boolean;        // Defer execution
    type?: string;          // Script type (e.g., "module")
    integrity?: string;     // Subresource integrity
    crossorigin?: string;   // CORS settings
}
```

#### CustomHeaderEntry
```typescript
interface CustomHeaderEntry {
    tag: string;                        // HTML tag name
    attributes: Record<string, string>; // Tag attributes
}
```

#### Enums

##### SandboxMessageType
```typescript
enum SandboxMessageType {
    CONSOLE = "console",
    ERROR = "error",
    UNHANDLED_REJECTION = "unhandledRejection"
}
```

##### ConsoleLogLevel
```typescript
enum ConsoleLogLevel {
    LOG = "log",
    WARN = "warn", 
    ERROR = "error"
}
```

## Use Cases

### Educational Platforms
- Code playgrounds and interactive tutorials
- Live coding demonstrations
- Student assignment evaluation

### Development Tools
- Code snippet testing
- Library documentation with live examples
- API testing interfaces

### Content Management
- User-generated content execution
- Template preview systems
- Widget development platforms

### Data Science
- Jupyter-like notebook experiences
- Python data analysis in the browser
- Interactive data visualizations

## Browser Compatibility

- **Chrome/Chromium**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## Security Considerations

- Code runs in iframe sandboxes for isolation
- No access to parent window or sensitive APIs
- All communication via secure postMessage API
- Consider Content Security Policy (CSP) for additional protection
- Always validate and sanitize user input before execution

## Performance Tips

- Use `release()` to clean up resources when done
- Unsubscribe from event listeners to prevent memory leaks
- Consider debouncing frequent sandbox reloads
- Cache compiled TypeScript for better performance

## Troubleshooting

### Common Issues

**Sandbox not loading:**
- Check browser console for iframe errors
- Verify Content Security Policy allows iframe execution
- Ensure proper cleanup of previous sandbox instances

**Events not firing:**
- Verify event subscriptions are active
- Check for JavaScript errors in sandbox
- Ensure proper state management store setup

**PyScript/TypeScript not working:**
- Check network connectivity for CDN resources
- Verify correct version specifications
- Look for loading timeout issues

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT License - see LICENSE.md for details

## Support

For issues, questions, or contributions, please visit our GitHub repository or contact the maintainers.
