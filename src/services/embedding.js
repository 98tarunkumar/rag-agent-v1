const { Ollama } = require('ollama');

class EmbeddingService {
  constructor() {
    this.model = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
    this.client = new Ollama();
  }

  async generateEmbedding(text) {
    try {
      const response = await this.client.embeddings({
        model: this.model,
        prompt: text
      });
      return response.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts) {
    const embeddings = [];
    const batchSize = 5; // Process in smaller batches to reduce memory usage
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      
      try {
        const batchEmbeddings = await Promise.all(batchPromises);
        embeddings.push(...batchEmbeddings);
        
        // Force garbage collection between batches
        if (global.gc) {
          global.gc();
        }
      } catch (error) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, error);
        throw error;
      }
    }
    
    return embeddings;
  }
}

module.exports = new EmbeddingService();
