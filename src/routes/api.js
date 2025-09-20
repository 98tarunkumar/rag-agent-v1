const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const chatService = require('../services/chat');
const vectorStore = require('../services/vectorstore');
const conversationContext = require('../services/conversationContext');
const documentLoader = require('../utils/documentLoader');
const TextSplitter = require('../utils/textSplitter');

const router = express.Router();
const textSplitter = new TextSplitter(500, 100); // Smaller chunks to reduce memory usage

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.md', '.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

ensureUploadsDir();

// Query endpoint
router.post('/query', async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const result = await chatService.answerQuestion(question, sessionId);
    res.json(result);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new conversation session
router.post('/conversation/start', (req, res) => {
  try {
    const sessionId = conversationContext.createSession();
    res.json({ 
      sessionId,
      message: 'New conversation session created',
      config: conversationContext.getConfig()
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create conversation session' });
  }
});

// Get context configuration (must be before /:sessionId route)
router.get('/conversation/config', (req, res) => {
  try {
    res.json({
      config: conversationContext.getConfig()
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Update context configuration (must be before /:sessionId route)
router.post('/conversation/config', (req, res) => {
  try {
    const { maxContextLength, maxTokens } = req.body;
    
    if (maxContextLength && maxTokens) {
      conversationContext.updateContextConfig(maxContextLength, maxTokens);
    }
    
    res.json({
      message: 'Context configuration updated',
      config: conversationContext.getConfig()
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Get conversation history
router.get('/conversation/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const context = conversationContext.getContext(sessionId, false);
    const stats = conversationContext.getConversationStats(sessionId);
    
    res.json({
      sessionId,
      messages: context,
      stats
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(404).json({ error: 'Conversation not found' });
  }
});

// Clear conversation history
router.delete('/conversation/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    conversationContext.clearConversation(sessionId);
    res.json({ 
      message: 'Conversation history cleared',
      sessionId 
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({ error: 'Failed to clear conversation' });
  }
});

// Delete conversation session
router.delete('/conversation/:sessionId/delete', (req, res) => {
  try {
    const { sessionId } = req.params;
    conversationContext.deleteSession(sessionId);
    res.json({ 
      message: 'Conversation session deleted',
      sessionId 
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation session' });
  }
});

// Document ingestion endpoint - supports both file upload and directory processing
router.post('/ingest', upload.single('file'), async (req, res) => {
  try {
    let documents = [];
    let source = '';

    // Check if file was uploaded
    if (req.file) {
      // Process uploaded file
      const document = await documentLoader.loadDocument(req.file.path);
      documents = [document];
      source = `uploaded file: ${req.file.originalname}`;
      
      // Clean up uploaded file after processing
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up uploaded file:', cleanupError);
      }
    } else {
      // Process directory (existing functionality)
      const { directoryPath } = req.body;
      
      if (!directoryPath) {
        return res.status(400).json({ 
          error: 'Either file upload or directory path is required',
          usage: {
            fileUpload: 'POST /api/ingest with multipart/form-data file field',
            directoryPath: 'POST /api/ingest with JSON body containing directoryPath'
          }
        });
      }

      documents = await documentLoader.loadDocumentsFromDirectory(directoryPath);
      source = `directory: ${directoryPath}`;
    }

    if (documents.length === 0) {
      return res.status(400).json({ 
        error: 'No documents found to process',
        source: source
      });
    }

    console.log(`Loaded ${documents.length} documents from ${source}`);

    // Split documents into chunks
    const splitDocuments = textSplitter.splitDocuments(documents);
    console.log(`Created ${splitDocuments.length} chunks`);

    // Add to vector store
    await vectorStore.addDocuments(splitDocuments);

    res.json({ 
      message: 'Documents ingested successfully',
      source: source,
      documentsLoaded: documents.length,
      chunksCreated: splitDocuments.length
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB' 
      });
    }
    
    if (error.message && error.message.includes('not allowed')) {
      return res.status(400).json({ 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Multiple file upload endpoint
router.post('/ingest/multiple', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        usage: 'POST /api/ingest/multiple with multipart/form-data files field (max 10 files)'
      });
    }

    const documents = [];
    const processedFiles = [];

    // Process each uploaded file
    for (const file of files) {
      try {
        const document = await documentLoader.loadDocument(file.path);
        documents.push(document);
        processedFiles.push(file.originalname);
        
        // Clean up uploaded file
        await fs.unlink(file.path);
      } catch (fileError) {
        console.warn(`Failed to process file ${file.originalname}:`, fileError);
        // Clean up failed file
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.warn('Failed to clean up file:', cleanupError);
        }
      }
    }

    if (documents.length === 0) {
      return res.status(400).json({ 
        error: 'No valid documents could be processed',
        attemptedFiles: files.map(f => f.originalname)
      });
    }

    console.log(`Loaded ${documents.length} documents from ${files.length} uploaded files`);

    // Split documents into chunks
    const splitDocuments = textSplitter.splitDocuments(documents);
    console.log(`Created ${splitDocuments.length} chunks`);

    // Add to vector store
    await vectorStore.addDocuments(splitDocuments);

    res.json({ 
      message: 'Multiple documents ingested successfully',
      source: `uploaded files: ${processedFiles.join(', ')}`,
      documentsLoaded: documents.length,
      chunksCreated: splitDocuments.length,
      processedFiles: processedFiles
    });
  } catch (error) {
    console.error('Multiple file ingestion error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = router;
