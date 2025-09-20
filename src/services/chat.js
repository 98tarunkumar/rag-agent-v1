const { Ollama } = require('ollama');
const vectorStore = require('./vectorstore');
const conversationContext = require('./conversationContext');

class ChatService {
  constructor() {
    this.model = process.env.CHAT_MODEL || 'llama3.2:3b';
    this.client = new Ollama();
  }

  async generateResponse(query, context = '') {
    const prompt = this.buildPrompt(query, context);
    
    try {
      const response = await this.client.chat({
        model: this.model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: false
      });

      return response.message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async answerQuestion(question, sessionId = null) {
    // Retrieve relevant documents
    const relevantDocs = await vectorStore.similarity_search(question, 5);

    // Build context from retrieved documents
    const documentContext = relevantDocs
      .map(doc => `Source: ${doc.metadata.source}\n${doc.content}`)
      .join('\n\n---\n\n');

    // Get conversation context if sessionId is provided
    let conversationContextText = '';
    if (sessionId) {
      try {
        conversationContextText = conversationContext.getConversationSummary(sessionId);
      } catch (error) {
        console.warn('Failed to get conversation context:', error.message);
      }
    }

    // Generate response with both document and conversation context
    const response = await this.generateResponse(question, documentContext, conversationContextText);

    // Store the conversation if sessionId is provided
    if (sessionId) {
      try {
        // Check if session exists, create if it doesn't
        if (!conversationContext.conversations.has(sessionId)) {
          console.log(`Session ${sessionId} not found, creating new session`);
          conversationContext.createSession(sessionId);
        }
        
        // Add user message
        conversationContext.addMessage(sessionId, 'user', question);
        
        // Add assistant response
        conversationContext.addMessage(sessionId, 'assistant', response, {
          sources: relevantDocs.map(doc => ({
            source: doc.metadata.source,
            title: doc.metadata.title,
            similarity: 1 - doc.distance
          }))
        });
      } catch (error) {
        console.warn('Failed to store conversation context:', error.message);
        // Continue without context if storage fails
      }
    }

    return {
      answer: response,
      sources: relevantDocs.map(doc => ({
        source: doc.metadata.source,
        title: doc.metadata.title,
        similarity: 1 - doc.distance
      })),
      sessionId: sessionId
    };
  }

  buildPrompt(query, documentContext, conversationContext = '') {
    let prompt = `You are a specialist AI agent with expertise in document analysis and question answering. Use the provided context to answer the user's question accurately and comprehensively.

Document Context:
${documentContext}`;

    if (conversationContext) {
      prompt += `\n\nConversation Context:
${conversationContext}`;
    }

    prompt += `\n\nQuestion: ${query}

Instructions:
- Answer based primarily on the provided document context
- Use conversation context to maintain continuity and provide more relevant responses
- Be specific and detailed in your response
- If the context doesn't contain enough information, clearly state what's missing
- Cite specific sources when possible
- Maintain a professional and knowledgeable tone
- Reference previous parts of the conversation when relevant

Answer:`;

    return prompt;
  }
}

module.exports = new ChatService();
