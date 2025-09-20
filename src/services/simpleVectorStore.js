const fs = require('fs').promises;
const path = require('path');
const embeddingService = require('./embedding');

class SimpleVectorStore {
  constructor() {
    this.documents = [];
    this.embeddings = [];
    this.metadatas = [];
    this.ids = [];
    this.collectionName = process.env.COLLECTION_NAME || 'specialist-agent';
    this.storagePath = path.join(process.cwd(), 'vector_storage.json');
  }

  async initialize() {
    try {
      // Try to load existing data
      await this.loadFromStorage();
      console.log('Simple vector store initialized');
    } catch (error) {
      console.log('Starting with empty vector store');
    }
  }

  async addDocuments(documents) {
    const texts = documents.map(doc => doc.content);
    const embeddings = await embeddingService.generateEmbeddings(texts);
    
    const ids = documents.map((_, index) => `doc_${Date.now()}_${index}`);
    const metadatas = documents.map(doc => ({
      source: doc.source || 'unknown',
      title: doc.title || 'untitled',
      chunk_index: doc.chunkIndex || 0
    }));

    // Add to in-memory storage
    this.documents.push(...texts);
    this.embeddings.push(...embeddings);
    this.metadatas.push(...metadatas);
    this.ids.push(...ids);

    // Save to file
    await this.saveToStorage();

    console.log(`Added ${documents.length} documents to simple vector store`);
  }

  async similarity_search(query, k = 5) {
    if (this.embeddings.length === 0) {
      return [];
    }

    const queryEmbedding = await embeddingService.generateEmbedding(query);
    
    // Calculate cosine similarity
    const similarities = this.embeddings.map(embedding => {
      return this.cosineSimilarity(queryEmbedding, embedding);
    });

    // Get top k results
    const results = similarities
      .map((similarity, index) => ({
        content: this.documents[index],
        metadata: this.metadatas[index],
        distance: 1 - similarity,
        similarity: similarity
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    return results;
  }

  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async saveToStorage() {
    try {
      const data = {
        documents: this.documents,
        embeddings: this.embeddings,
        metadatas: this.metadatas,
        ids: this.ids,
        collectionName: this.collectionName
      };
      await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  async loadFromStorage() {
    try {
      const data = await fs.readFile(this.storagePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      this.documents = parsed.documents || [];
      this.embeddings = parsed.embeddings || [];
      this.metadatas = parsed.metadatas || [];
      this.ids = parsed.ids || [];
      this.collectionName = parsed.collectionName || this.collectionName;
      
      console.log(`Loaded ${this.documents.length} documents from storage`);
    } catch (error) {
      console.log('No existing storage found, starting fresh');
    }
  }

  async clear() {
    this.documents = [];
    this.embeddings = [];
    this.metadatas = [];
    this.ids = [];
    await this.saveToStorage();
    console.log('Vector store cleared');
  }
}

module.exports = new SimpleVectorStore();
