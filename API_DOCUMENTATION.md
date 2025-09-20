# Specialist Agent API Documentation

A comprehensive guide to using the RAG-based specialist agent API for document processing and intelligent question answering.

## 🚀 Quick Start

### Prerequisites
- Node.js application running on port 3000
- Ollama server running with required models
- ChromaDB server running (optional - has fallback)

### Base URL
```
http://localhost:3000
```

---

## 📋 API Endpoints

### 1. Health Check

**GET** `/api/health`

Check if the specialist agent is running and healthy.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2025-09-20T14:24:48.775Z"
}
```

#### Example
```bash
curl http://localhost:3000/api/health
```

---

### 2. API Information

**GET** `/`

Get information about available API endpoints and service status.

#### Response
```json
{
  "message": "Specialist Agent - RAG-based AI Assistant",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "query": "POST /api/query",
    "ingest": "POST /api/ingest"
  }
}
```

#### Example
```bash
curl http://localhost:3000/
```

---

### 3. Document Ingestion

**POST** `/api/ingest`

Process and ingest documents into the vector store. Supports both file upload and directory processing.

#### Usage Options

##### Option A: File Upload (Multipart Form Data)
Upload a single document file directly.

**Request**: `multipart/form-data`
- `file` (file, required): Document file to upload

##### Option B: Directory Processing (JSON)
Process all documents in a specified directory.

**Request Body**:
```json
{
  "directoryPath": "./data/documents"
}
```

#### Parameters
- `file` (file, optional): Single document file to upload
- `directoryPath` (string, optional): Path to directory containing documents to process

**Note**: Either `file` or `directoryPath` must be provided.

#### Supported File Types
- `.txt` - Plain text files
- `.md` - Markdown files
- `.pdf` - PDF documents
- `.docx` - Microsoft Word documents

#### File Upload Limits
- **Maximum file size**: 10MB
- **File validation**: Automatic type checking
- **Temporary storage**: Files are processed and automatically cleaned up

#### Response
```json
{
  "message": "Documents ingested successfully",
  "source": "uploaded file: document.pdf",
  "documentsLoaded": 1,
  "chunksCreated": 5
}
```

#### Examples

**Single File Upload**:
```bash
curl -X POST -F "file=@document.pdf" http://localhost:3000/api/ingest
```

**Directory Processing**:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"directoryPath": "./data/documents"}'
```

#### Error Responses
- `400 Bad Request`: Missing file or directory path, invalid file type, file too large
- `500 Internal Server Error`: Processing error

---

### 4. Multiple File Upload

**POST** `/api/ingest/multiple`

Upload and process multiple documents at once.

#### Request
- **Content-Type**: `multipart/form-data`
- **Field**: `files` (array of files, max 10 files)

#### Parameters
- `files` (array of files, required): Multiple document files to upload

#### Response
```json
{
  "message": "Multiple documents ingested successfully",
  "source": "uploaded files: doc1.pdf, doc2.txt, doc3.md",
  "documentsLoaded": 3,
  "chunksCreated": 15,
  "processedFiles": ["doc1.pdf", "doc2.txt", "doc3.md"]
}
```

#### Example
```bash
curl -X POST \
  -F "files=@document1.pdf" \
  -F "files=@document2.txt" \
  -F "files=@document3.md" \
  http://localhost:3000/api/ingest/multiple
```

#### Error Responses
- `400 Bad Request`: No files uploaded, no valid documents processed
- `500 Internal Server Error`: Processing error

---

### 5. Query Specialist Agent

**POST** `/api/query`

Ask questions to your specialist agent and get intelligent responses based on ingested documents.

#### Request Body
```json
{
  "question": "What is the main topic of the documents?"
}
```

#### Parameters
- `question` (string, required): The question you want to ask

#### Response
```json
{
  "answer": "Based on the ingested documents, the main topic appears to be...",
  "sources": [
    {
      "source": "document1.pdf",
      "title": "document1",
      "similarity": 0.85
    },
    {
      "source": "document2.txt",
      "title": "document2",
      "similarity": 0.78
    }
  ]
}
```

#### Response Fields
- `answer` (string): The AI-generated response based on document context
- `sources` (array): List of source documents used for the answer
  - `source` (string): Original filename
  - `title` (string): Document title
  - `similarity` (number): Relevance score (0-1, higher is more relevant)

#### Example
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the key findings in the research papers?"}'
```

#### Error Responses
- `400 Bad Request`: Missing question
- `500 Internal Server Error`: Processing error

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root:

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

### Model Configuration

#### Embedding Model
- **Default**: `nomic-embed-text`
- **Purpose**: Converts text to vector embeddings for similarity search
- **Alternative models**: Any Ollama embedding model

#### Chat Model
- **Default**: `llama3.2:3b`
- **Purpose**: Generates responses based on retrieved context
- **Alternative models**: 
  - `llama3.2:3b` - Lightweight, fast
  - `mistral` - Balanced performance
  - `llama3.1` - More capable but resource-intensive

---

## 📚 Usage Examples

### 1. Complete Workflow

```bash
# 1. Check if service is running
curl http://localhost:3000/api/health

# 2. Ingest documents (choose one method)
# Option A: Upload single file
curl -X POST -F "file=@document.pdf" http://localhost:3000/api/ingest

# Option B: Upload multiple files
curl -X POST \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.txt" \
  http://localhost:3000/api/ingest/multiple

# Option C: Process directory
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"directoryPath": "./data/documents"}'

# 3. Ask questions
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of the documents?"}'
```

### 2. Document Processing Options

```bash
# Single file upload
curl -X POST -F "file=@research_paper.pdf" http://localhost:3000/api/ingest

# Multiple file upload (max 10 files)
curl -X POST \
  -F "files=@paper1.pdf" \
  -F "files=@paper2.txt" \
  -F "files=@notes.md" \
  http://localhost:3000/api/ingest/multiple

# Process directory
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"directoryPath": "/path/to/your/documents"}'
```

### 3. Various Question Types

```bash
# Factual questions
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the key statistics mentioned?"}'

# Analytical questions
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the main conclusions drawn?"}'

# Comparative questions
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How do the different approaches compare?"}'
```

---

## 🛠️ Advanced Usage

### Custom Document Processing

The system automatically:
1. **Loads documents** from specified directory
2. **Splits text** into chunks (1000 characters with 200 overlap)
3. **Generates embeddings** using Ollama
4. **Stores vectors** in ChromaDB or fallback storage
5. **Enables similarity search** for relevant document retrieval

### Vector Store Options

#### ChromaDB (Recommended)
- **Pros**: Scalable, persistent, advanced features
- **Setup**: `chroma run --host localhost --port 8000`
- **Fallback**: Automatically uses simple storage if unavailable

#### Simple Vector Store (Fallback)
- **Pros**: No external dependencies, easy setup
- **Storage**: JSON file (`vector_storage.json`)
- **Limitations**: In-memory, less scalable

### Text Chunking Strategy

- **Chunk Size**: 1000 characters (configurable)
- **Overlap**: 200 characters (configurable)
- **Smart Splitting**: Breaks at sentence/paragraph boundaries
- **Metadata**: Preserves source file information

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 node src/app.js
```

#### 2. ChromaDB Connection Error
```bash
# Start ChromaDB server
chroma run --host localhost --port 8000

# Or use fallback storage (automatic)
```

#### 3. Ollama Model Not Found
```bash
# Pull required models
ollama pull nomic-embed-text
ollama pull llama3.2:3b
```

#### 4. Document Processing Errors
- Check file permissions
- Ensure supported file formats
- Verify directory path exists

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check request body format |
| 404 | Not Found | Verify endpoint URL |
| 500 | Internal Server Error | Check logs, verify services |

---

## 📊 Performance Tips

### Optimization

1. **Chunk Size**: Adjust based on document type
   - Technical docs: 1500-2000 characters
   - General text: 1000 characters
   - Short documents: 500 characters

2. **Model Selection**: Balance speed vs accuracy
   - Fast: `llama3.2:3b`
   - Balanced: `mistral`
   - Accurate: `llama3.1`

3. **Batch Processing**: Process multiple documents together
4. **Memory Management**: Monitor vector store size

### Monitoring

- Check health endpoint regularly
- Monitor response times
- Track document ingestion success rates
- Watch for memory usage

---

## 🔐 Security Considerations

### Data Privacy
- Documents are processed locally
- No data sent to external services (except Ollama)
- Vector embeddings stored locally
- ChromaDB runs on localhost

### Best Practices
- Use HTTPS in production
- Implement authentication if needed
- Monitor file upload sizes
- Regular backup of vector storage

---

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```env
   NODE_ENV=production
   PORT=3000
   ```

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/app.js --name specialist-agent
   ```

3. **Reverse Proxy** (Nginx)
   ```nginx
   location / {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📞 Support

### Getting Help

1. **Check logs** for detailed error messages
2. **Verify services** are running (Ollama, ChromaDB)
3. **Test endpoints** individually
4. **Check configuration** in `.env` file

### Common Commands

```bash
# Check if services are running
curl http://localhost:3000/api/health
curl http://localhost:8000/api/v1/heartbeat  # ChromaDB

# View logs
npm start  # or node src/app.js

# Restart services
# Kill existing processes and restart
```

---

## 📝 Changelog

### Version 1.0.0
- Initial release
- ChromaDB integration with fallback
- Ollama-based embeddings and chat
- Document processing pipeline
- RESTful API endpoints

---

## 💬 Conversation Context Features

### Overview
The Specialist Agent now supports conversation context, allowing for more natural and continuous interactions. This feature maintains conversation history across multiple queries, enabling the AI to provide contextually aware responses.

### Key Features
- **Conversation Memory**: Maintains conversation history across queries
- **Configurable Context Window**: Adjustable context length and token limits
- **Session Management**: Create, manage, and delete conversation sessions
- **Context-Aware Responses**: AI considers previous conversation context

### Environment Configuration
Add these variables to your `.env` file:
```env
# Conversation Context Configuration
CONTEXT_WINDOW_LENGTH=10
CONTEXT_MAX_TOKENS=4000
```

### Conversation Management Endpoints

#### Create New Conversation Session
**POST** `/api/conversation/start`

Create a new conversation session for maintaining context.

**Response:**
```json
{
  "sessionId": "uuid-generated-session-id",
  "message": "New conversation session created",
  "config": {
    "maxContextLength": 10,
    "maxTokens": 4000,
    "activeConversations": 1
  }
}
```

#### Get Conversation History
**GET** `/api/conversation/:sessionId`

Retrieve conversation history for a specific session.

**Response:**
```json
{
  "sessionId": "session-id",
  "messages": [
    {
      "id": "message-id",
      "role": "user",
      "content": "What is the main topic?",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "message-id",
      "role": "assistant",
      "content": "The main topic is...",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "metadata": {
        "sources": [...]
      }
    }
  ],
  "stats": {
    "messageCount": 2,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastAccessed": "2024-01-01T00:00:00.000Z",
    "estimatedTokens": 150
  }
}
```

#### Clear Conversation History
**DELETE** `/api/conversation/:sessionId`

Clear conversation history while keeping the session active.

#### Delete Conversation Session
**DELETE** `/api/conversation/:sessionId/delete`

Completely delete a conversation session.

#### Update Context Configuration
**POST** `/api/conversation/config`

Update context window settings.

**Request Body:**
```json
{
  "maxContextLength": 15,
  "maxTokens": 6000
}
```

#### Get Context Configuration
**GET** `/api/conversation/config`

Get current context window configuration.

### Usage Examples

#### Basic Conversation Flow
```bash
# 1. Create a new conversation session
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/conversation/start | jq -r '.sessionId')

# 2. Ask a question with context
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"What is the main topic?\", \"sessionId\": \"$SESSION_ID\"}"

# 3. Follow up with context-aware question
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Can you tell me more about that?\", \"sessionId\": \"$SESSION_ID\"}"

# 4. Get conversation history
curl http://localhost:3000/api/conversation/$SESSION_ID
```

#### Configuration Management
```bash
# Get current configuration
curl http://localhost:3000/api/conversation/config

# Update configuration
curl -X POST http://localhost:3000/api/conversation/config \
  -H "Content-Type: application/json" \
  -d '{"maxContextLength": 15, "maxTokens": 6000}'
```

### Context Window Behavior
- **Message Limit**: Keeps the last N messages (configurable)
- **Token Limit**: Trims context when token count exceeds limit
- **Automatic Cleanup**: Removes old messages to maintain performance
- **Session Persistence**: Context maintained until session is deleted

---

*This documentation covers the complete API for the Specialist Agent with conversation context features. For additional support or feature requests, please refer to the project repository.*
