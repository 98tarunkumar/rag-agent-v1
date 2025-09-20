const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const vectorStore = require('./services/vectorstore');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Specialist Agent - RAG-based AI Assistant with Conversation Context',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      query: 'POST /api/query (supports sessionId for conversation context)',
      ingest: 'POST /api/ingest (supports file upload or directory)',
      ingestMultiple: 'POST /api/ingest/multiple (multiple file upload)',
      conversation: {
        start: 'POST /api/conversation/start (create new session)',
        get: 'GET /api/conversation/:sessionId (get conversation history)',
        clear: 'DELETE /api/conversation/:sessionId (clear history)',
        delete: 'DELETE /api/conversation/:sessionId/delete (delete session)',
        config: 'GET/POST /api/conversation/config (manage context settings)'
      }
    },
    uploadFormats: ['.txt', '.md', '.pdf', '.docx'],
    maxFileSize: '10MB',
    contextFeatures: {
      conversationMemory: 'Maintains conversation history across queries',
      configurableWindow: 'Adjustable context window length and token limits',
      sessionManagement: 'Create, manage, and delete conversation sessions',
      contextAwareness: 'AI responses consider previous conversation context'
    },
    usage: {
      singleFile: 'curl -X POST -F "file=@document.pdf" http://localhost:3000/api/ingest',
      multipleFiles: 'curl -X POST -F "files=@doc1.pdf" -F "files=@doc2.txt" http://localhost:3000/api/ingest/multiple',
      directory: 'curl -X POST -H "Content-Type: application/json" -d \'{"directoryPath": "./data/documents"}\' http://localhost:3000/api/ingest',
      conversation: 'curl -X POST -H "Content-Type: application/json" -d \'{"question": "Hello", "sessionId": "your-session-id"}\' http://localhost:3000/api/query'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Initialize vector store and start server
async function initializeApp() {
  try {
    await vectorStore.initialize();
    console.log('Vector store initialized');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Specialist Agent running on port ${PORT}`);
      console.log(`📚 Ready to process documents and answer questions!`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port or kill the existing process.`);
        console.error(`💡 Try: lsof -ti:${PORT} | xargs kill -9`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

initializeApp();

module.exports = app;
