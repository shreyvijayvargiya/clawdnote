# ClawdNote - Smart AI Note Taking App

ClawdNote is a modern note-taking application built with Next.js, Firebase, and Tiptap. It features AI-powered voice-to-text, semantic note mapping via 3D graphs, and a Model Context Protocol (MCP) server for deep integration with AI agents like Claude.

## Features

- **Tiptap Editor**: Rich text editing with a clean, minimal interface.
- **Voice-to-Text & AI Processing**: Record notes by speaking. Use **OpenRouter** to automatically translate, clean up, and structure your spoken notes before adding them to the editor.
- **3D Neural Map**: Visualize connections between your notes based on content similarity.
  - **Local Embeddings**: Uses **Transformers.js** to generate embeddings directly in your browser. **No OpenAI API key required** for the graph!
- **Google Authentication**: Secure login with Firebase Auth.
- **MCP Server**: Connect your notes to Claude to let AI read, create, and manage your notes.
- **Fast & Responsive**: Built with React Query for efficient data fetching and Sonner for delightful notifications.

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase Project (Auth, Firestore)
- **Firebase Service Account Key**: Required for the MCP server to interact with Firestore from the backend.
- OpenRouter API Key (for "Speak & Translate" feature)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd clawdnote
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Config (Client Side)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Admin (Server Side - Required for MCP)
   FIREBASE_SERVICE_ACCOUNT_KEY='{ "type": "service_account", ... }'

   # OpenRouter Config (For Voice Processing & Translation)
   NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Model Context Protocol (MCP) Integration

ClawdNote includes a full MCP implementation that allows Claude (or any MCP-compatible agent) to interact with your notes.

### 1. Local MCP Server
The server is hosted at `/api/mcp` and uses the modern **Streamable HTTP** transport. It handles authentication via API keys stored in Firestore.

### 2. Testing the Connection
You can verify your MCP setup using the built-in test script. Ensure your dev server is running, then run:

```bash
CLAWDNOTE_API_KEY=your_api_key CLAWDNOTE_URL=http://localhost:3000 node mcp-server/test-connection.js
```

This will:
- Connect to the local server via Streamable HTTP.
- List available tools (`list_notes`, `get_note`, `ping`).
- Verify the connection with a `ping` call.

### 3. Connecting Claude Desktop
To connect Claude Desktop to your local development environment, use the provided bridge script. 

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "clawdnote-local": {
      "command": "node",
      "args": ["/absolute/path/to/clawdnote/mcp-server/connect.js"],
      "env": {
        "CLAWDNOTE_API_KEY": "your_personal_api_key",
        "CLAWDNOTE_URL": "http://localhost:3000"
      }
    }
  }
}
```

*Note: The bridge handles the translation between Claude's Stdio transport and the server's Streamable HTTP transport.*

## Tech Stack

- **Framework**: Next.js
- **Editor**: Tiptap
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google)
- **State Management**: React Query
- **Visualization**: Three.js & React Force Graph 3D
- **AI**: Transformers.js (Local Embeddings), OpenRouter (LLM), Web Speech API, MCP SDK
- **Styling**: Tailwind CSS & Lucide Icons
- **Notifications**: Sonner
