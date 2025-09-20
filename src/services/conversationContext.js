const { v4: uuidv4 } = require('uuid');

class ConversationContextService {
  constructor() {
    this.conversations = new Map(); // Store conversations by session ID
    this.maxContextLength = parseInt(process.env.CONTEXT_WINDOW_LENGTH) || 10; // Default 10 messages
    this.maxTokens = parseInt(process.env.CONTEXT_MAX_TOKENS) || 4000; // Default 4000 tokens
  }

  // Create a new conversation session
  createSession(sessionId = null) {
    const id = sessionId || uuidv4();
    this.conversations.set(id, {
      messages: [],
      createdAt: new Date(),
      lastAccessed: new Date()
    });
    return id;
  }

  // Add a message to a conversation
  addMessage(sessionId, role, content, metadata = {}) {
    if (!this.conversations.has(sessionId)) {
      // Auto-create session if it doesn't exist
      console.log(`Auto-creating session ${sessionId}`);
      this.createSession(sessionId);
    }

    const conversation = this.conversations.get(sessionId);
    const message = {
      id: uuidv4(),
      role, // 'user' or 'assistant'
      content,
      timestamp: new Date(),
      metadata
    };

    conversation.messages.push(message);
    conversation.lastAccessed = new Date();

    // Trim conversation if it exceeds context window
    this.trimConversation(sessionId);

    return message;
  }

  // Get conversation context for a session
  getContext(sessionId, includeSystemMessage = true) {
    if (!this.conversations.has(sessionId)) {
      // Return empty context if session doesn't exist
      return includeSystemMessage ? [{
        role: 'system',
        content: this.buildSystemPrompt(),
        timestamp: new Date()
      }] : [];
    }

    const conversation = this.conversations.get(sessionId);
    conversation.lastAccessed = new Date();

    let context = conversation.messages.slice(-this.maxContextLength);

    // Add system message if requested
    if (includeSystemMessage && context.length > 0) {
      const systemMessage = {
        role: 'system',
        content: this.buildSystemPrompt(),
        timestamp: new Date()
      };
      context = [systemMessage, ...context];
    }

    return context;
  }

  // Get recent messages for context (excluding current query)
  getRecentContext(sessionId, excludeLast = 0) {
    if (!this.conversations.has(sessionId)) {
      return [];
    }

    const conversation = this.conversations.get(sessionId);
    const messages = conversation.messages.slice(0, -excludeLast);
    return messages.slice(-this.maxContextLength);
  }

  // Trim conversation to fit within context limits
  trimConversation(sessionId) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return;

    let messages = conversation.messages;

    // First, trim by message count
    if (messages.length > this.maxContextLength) {
      messages = messages.slice(-this.maxContextLength);
    }

    // Then, trim by token count if needed
    let totalTokens = this.estimateTokens(messages);
    while (totalTokens > this.maxTokens && messages.length > 2) {
      // Remove oldest messages (keep at least 2 for context)
      messages = messages.slice(1);
      totalTokens = this.estimateTokens(messages);
    }

    conversation.messages = messages;
  }

  // Estimate token count for messages (rough approximation)
  estimateTokens(messages) {
    return messages.reduce((total, message) => {
      // Rough estimation: 1 token ≈ 4 characters
      return total + Math.ceil(message.content.length / 4);
    }, 0);
  }

  // Build system prompt with conversation context
  buildSystemPrompt() {
    return `You are a specialist AI agent with expertise in document analysis and question answering. 

You have access to a knowledge base of documents and can maintain conversation context. When answering questions:

1. Use the provided document context to give accurate, detailed answers
2. Reference previous parts of the conversation when relevant
3. Maintain consistency with earlier responses
4. If you don't know something based on the documents, clearly state this
5. Provide specific citations from the source documents when possible

Remember to be helpful, accurate, and maintain the conversation flow naturally.`;
  }

  // Get conversation summary for context
  getConversationSummary(sessionId) {
    if (!this.conversations.has(sessionId)) {
      return '';
    }

    const conversation = this.conversations.get(sessionId);
    const recentMessages = conversation.messages.slice(-5); // Last 5 messages

    if (recentMessages.length === 0) {
      return '';
    }

    const summary = recentMessages.map(msg => 
      `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
    ).join('\n');

    return `Recent conversation context:\n${summary}`;
  }

  // Clear conversation history
  clearConversation(sessionId) {
    if (this.conversations.has(sessionId)) {
      this.conversations.get(sessionId).messages = [];
    }
  }

  // Delete conversation session
  deleteSession(sessionId) {
    this.conversations.delete(sessionId);
  }

  // Get conversation statistics
  getConversationStats(sessionId) {
    if (!this.conversations.has(sessionId)) {
      return null;
    }

    const conversation = this.conversations.get(sessionId);
    return {
      messageCount: conversation.messages.length,
      createdAt: conversation.createdAt,
      lastAccessed: conversation.lastAccessed,
      estimatedTokens: this.estimateTokens(conversation.messages)
    };
  }

  // Clean up old conversations (optional maintenance)
  cleanupOldConversations(maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, conversation] of this.conversations.entries()) {
      if (conversation.lastAccessed < cutoffTime) {
        this.conversations.delete(sessionId);
      }
    }
  }

  // Update context window configuration
  updateContextConfig(maxLength, maxTokens) {
    this.maxContextLength = maxLength;
    this.maxTokens = maxTokens;
  }

  // Get current configuration
  getConfig() {
    return {
      maxContextLength: this.maxContextLength,
      maxTokens: this.maxTokens,
      activeConversations: this.conversations.size
    };
  }
}

module.exports = new ConversationContextService();
