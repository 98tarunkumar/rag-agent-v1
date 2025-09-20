# Specialist Agent - RAG-based AI Assistant

A Retrieval-Augmented Generation (RAG) application using Ollama and ChromaDB for document processing and question answering.

## ✅ Error Fixed!

The ES module error has been resolved. All files now use CommonJS syntax (`require`/`module.exports`) consistently.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Install and Start Ollama
```bash
# Install Ollama (if not already installed)
# Visit: https://ollama.ai/download

# Start Ollama server
ollama serve

# Pull required models (in a new terminal)
ollama pull nomic-embed-text
ollama pull llama3.2:3b
```

### 3. Install and Start ChromaDB
```bash
# Install ChromaDB
pip install chromadb

# Start ChromaDB server
chroma run --host localhost --port 8000
```

### 4. Add Your Documents
Place your domain-specific documents in the `data/documents/` folder.

### 5. Run the Application
```bash
npm start
```

## 📚 API Endpoints

- **`GET /`** - API documentation
- **`GET /api/health`** - Health check
- **`POST /api/query`** - Ask questions to your specialist agent
- **`POST /api/ingest`** - Ingest documents from a directory

## 🔧 Usage Examples

### Ingest Documents
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"directoryPath": "./data/documents"}'
```

### Query the Agent
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of the documents?"}'
```

## 🛠️ Configuration

Update `.env` file with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
CHAT_MODEL=llama3.2:3b

# Vector Store Configuration (ChromaDB)
CHROMA_URL=http://localhost:8000
COLLECTION_NAME=specialist-agent

# Optional: Additional Configuration
MAX_FILE_SIZE=10mb
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

## 📁 Project Structure

```
specialist-agent/
├── src/
│   ├── services/
│   │   ├── embedding.js      # Ollama embeddings
│   │   ├── vectorstore.js    # ChromaDB integration
│   │   └── chat.js          # Ollama chat service
│   ├── utils/
│   │   ├── documentLoader.js # Document processing
│   │   └── textSplitter.js   # Text chunking
│   ├── routes/
│   │   └── api.js           # API endpoints
│   └── app.js               # Main application
├── data/
│   └── documents/           # Your domain documents
├── package.json            # Dependencies
├── .env                    # Configuration
└── README.md              # This file
```

## 🎯 Features

- **Document Processing**: Supports PDF, DOCX, TXT, and Markdown files
- **Local AI**: Uses Ollama for embeddings and chat (no API keys needed)
- **Vector Storage**: ChromaDB for efficient similarity search
- **RAG Pipeline**: Retrieval-Augmented Generation for context-aware responses
- **Specialist Focus**: Optimized for domain-specific knowledge bases

## 🔍 Troubleshooting

### ChromaDB Connection Error
Make sure ChromaDB server is running:
```bash
chroma run --host localhost --port 8000
```

### Ollama Connection Error
Make sure Ollama server is running:
```bash
ollama serve
```

### Model Not Found
Pull the required models:
```bash
ollama pull nomic-embed-text
ollama pull llama3.2:3b
```

## 📝 License

MIT License - feel free to use this project for your own specialist agents!
