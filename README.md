# ClawdNote - Smart AI Note Taking App (Local-First)

ClawdNote is a modern, local-first note-taking application built with Next.js, Dexie.js (IndexedDB), and Tiptap. It features AI-powered voice-to-text, semantic note mapping via 3D graphs, and a Model Context Protocol (MCP) server for deep integration with AI agents like Claude.

## Features

- **Tiptap Editor**: Rich text editing with a clean, minimal interface.
- **Local-First Storage**: Your notes are stored entirely in your browser using IndexedDB (via Dexie.js). No cloud dependency, no latency.
- **Voice-to-Text & AI Processing**: Record notes by speaking. Use **OpenRouter** to automatically translate, clean up, and structure your spoken notes.
- **3D Neural Map**: Visualize connections between your notes based on content similarity.
  - **Local Embeddings**: Uses **Transformers.js** to generate embeddings directly in your browser. **No OpenAI API key required** for the graph!
- **MCP Server**: Connect your local notes to Claude Desktop to let AI read and search your notes.
- **Fast & Responsive**: Built with React Query for efficient data management and Sonner for delightful notifications.

## Getting Started

### Prerequisites

- Node.js 18+
- OpenRouter API Key (for "Speak & Translate" feature)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/shreyvijayvargiya/clawdnote.git
   cd clawdnote
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Setup Environment Variables**:
   Create a `.env.local` file in the root directory:

   ```env
   # OpenRouter Config (For Voice Processing & Translation)
   NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Model Context Protocol (MCP) Integration

ClawdNote includes a built-in MCP bridge that allows Claude Desktop to interact with your local notes.

### 1. Generating an API Key
Open the application, click on your profile in the sidebar, and click **"New API Key"**. This key is stored locally and used to authenticate the MCP bridge.

### 2. Connecting Claude Desktop
The application provides a ready-to-copy JSON configuration in the Profile modal. It automatically detects your project path.

Add the configuration to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## Tech Stack

- **Framework**: Next.js
- **Editor**: Tiptap
- **Database**: Dexie.js (IndexedDB)
- **State Management**: React Query
- **Visualization**: Three.js & React Force Graph 3D
- **AI**: Transformers.js (Local Embeddings), OpenRouter (LLM), Web Speech API, MCP SDK
- **Styling**: Tailwind CSS & Lucide Icons
- **Notifications**: Sonner
