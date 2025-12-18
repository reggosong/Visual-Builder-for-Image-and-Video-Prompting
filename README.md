# Video Prompt Workflow Builder

A visual workflow builder for creating and managing modular video prompts. Build complex video generation workflows by connecting different extraction and processing modules.

## Features

- **Visual Node-Based Interface** - Drag and drop modules to create workflows
- **Real-Time Processing** - See results as you build your workflow
- **Multiple Module Types**:

  - Text Prompt Input
  - Frame Extractors (Start/End)
  - Character Extractor
  - Style Variant Extractor
  - Shot Information Extractor (lighting, mood, angles, etc.)
  - Context Prompt Builder with template variables
  - Final Output with export options

- **Dark Mode Support**
- **Auto-Save & Import/Export**
- ⌨**Keyboard Shortcuts**
- **Undo/Redo**
- **Responsive Design**

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
npm install
```

### Configuration

1. Start the development server:

```bash
npm run dev
```

2. Open the app in your browser at http://localhost:5173
3. Start building your workflows! AI features are pre-configured and ready to use.

### Build for Production

```bash
npm run build
```

## Usage

### Creating a Workflow

1. **Add Nodes**: Drag modules from the left sidebar onto the canvas or click to add them
2. **Connect Nodes**: Click and drag from an output handle (right side) to an input handle (left side)
3. **Configure**: Click on nodes to edit their properties in the right panel
4. **Run**: Click "Run Workflow" in the toolbar to process the workflow
5. **Export**: Use the output node to copy or export your final prompt

### Example Workflow

1. Add a "Text Prompt Input" node with your base prompt
2. Connect it to "Character Extractor" and "Shot Info Extractor" nodes
3. Connect both extractors to a "Context Prompt" node
4. Use template variables like `{{characters}}` and `{{lighting}}` in the Context Prompt
5. Connect to an "Output" node to see the final result

### Keyboard Shortcuts

- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- `Delete/Backspace` - Delete selected node
- `Ctrl/Cmd + Enter` - Run workflow

## Module Types

### Input Modules

- **Text Prompt Input**: Starting point for your workflow with a text area for your base prompt

### Extractor Modules

All extractors can work in automatic or manual mode:

- **Start Frame**: Extract or set the starting frame number
- **End Frame**: Extract or set the ending frame number
- **Character**: Extract character names from text
- **Style Variant**: Identify style keywords (cinematic, anime, etc.)
- **Shot Information**: Extract lighting, mood, actions, camera angles, lens info, and movement

### Processing Modules

- **Context Prompt Builder**: Combine multiple inputs using template variables (`{{variableName}}`)

### Output Modules

- **Final Output**: Display and export the generated prompt (copy, JSON, or text file)

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Flow** - Node-based UI
- **Zustand** - State management
- **TailwindCSS v4** - Styling
- **Lucide React** - Icons
- **Anthropic Claude AI** - Intelligent text extraction
  - Claude Sonnet 4.5 for character, shot info, and frame extraction
- **FAL AI** - Image/video generation
  - Flux Schnell for fast, high-quality image generation

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx              # Main React Flow canvas
│   ├── Sidebar.tsx             # Module library
│   ├── PropertiesPanel.tsx     # Node properties editor
│   ├── Toolbar.tsx             # Top toolbar
│   └── nodes/                  # Custom node components
├── store/
│   └── workflowStore.ts        # Zustand state management
├── types/
│   └── workflow.types.ts       # TypeScript definitions
├── utils/
│   ├── extractors.ts           # Text extraction logic
│   ├── templateEngine.ts       # Variable substitution
│   └── dataFlowEngine.ts       # Workflow execution
├── App.tsx                     # Main app component
└── main.tsx                    # Entry point
```

## Features in Detail

### Automatic Extraction

The extractor modules use pattern matching and keyword detection to automatically extract information from your prompts. You can switch to manual mode at any time to override the extracted values.

### Template System

The Context Prompt Builder uses a simple template syntax with `{{variableName}}` placeholders. Available variables come from connected upstream nodes and are shown in the properties panel.

### Data Flow

The workflow engine uses topological sorting to execute nodes in the correct order, ensuring that all dependencies are resolved before processing each node.

### Persistence

- Auto-save every 30 seconds to localStorage
- Export/import workflows as JSON
- Load example workflows to get started

## Configuration Options

### Settings Panel (⚙️)

- **Use AI for Extraction & Generation**: Toggle AI features (Claude and FAL) on/off
- **Auto-run on Connect**: Automatically execute workflow when nodes are connected

**Note**: AI services (Anthropic Claude for text extraction and FAL for image generation) are pre-configured with integrated API keys.

## Security & Privacy

- API keys are securely integrated into the application
- Data is only sent to Anthropic Claude (for text extraction) and FAL (for image generation)
- Workflows are saved locally in your browser's localStorage
- No user data is stored on external servers

## Troubleshooting

### AI Extraction Not Working

1. Check that "Use AI for Extraction & Generation" toggle is enabled in Settings
2. Ensure you have an active internet connection
3. Check browser console for error messages
4. Falls back to regex extraction if Claude is unavailable

### Image Generation Issues

- Image generation uses Flux Schnell which is fast and efficient
- Check browser console for any API errors
- Ensure you have an active internet connection
- Check your API quota and billing status at [FAL Dashboard](https://fal.ai/dashboard)

## Contributing

Feel free to open issues or submit pull requests!

## License

MIT
