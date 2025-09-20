const { ChromaClient } = require('chromadb');
const { v4: uuidv4 } = require('uuid');
const embeddingService = require('./embedding');
const simpleVectorStore = require('./simpleVectorStore');

class VectorStore {
  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000'
    });
    this.collectionName = process.env.COLLECTION_NAME || 'specialist-agent';
    this.collection = null;
    this.useSimpleStore = false;
  }

  async initialize() {
    try {
      // Try to get existing collection
      this.collection = await this.client.getCollection({
        name: this.collectionName
      });
      console.log('Connected to ChromaDB collection');
    } catch (error) {
      if (error.message.includes('Could not connect to tenant') || 
          error.message.includes('Failed to connect to chromadb')) {
        console.log('ChromaDB server not available. Using simple in-memory vector store.');
        this.useSimpleStore = true;
        await simpleVectorStore.initialize();
        return;
      }
      
      // Create new collection if it doesn't exist
      try {
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: { description: 'Specialist Agent Knowledge Base' }
        });
        console.log('Created new ChromaDB collection');
      } catch (createError) {
        console.log('ChromaDB not available. Using simple in-memory vector store.');
        this.useSimpleStore = true;
        await simpleVectorStore.initialize();
      }
    }
  }

  async addDocuments(documents) {
    if (this.useSimpleStore) {
      return await simpleVectorStore.addDocuments(documents);
    }

    if (!this.collection) await this.initialize();

    const texts = documents.map(doc => doc.content);
    const embeddings = await embeddingService.generateEmbeddings(texts);
    
    const ids = documents.map(() => uuidv4());
    const metadatas = documents.map(doc => ({
      source: doc.source || 'unknown',
      title: doc.title || 'untitled',
      chunk_index: doc.chunkIndex || 0
    }));

    await this.collection.add({
      ids,
      embeddings,
      documents: texts,
      metadatas
    });

    console.log(`Added ${documents.length} documents to ChromaDB vector store`);
  }

  async similarity_search(query, k = 5) {
    if (this.useSimpleStore) {
      return await simpleVectorStore.similarity_search(query, k);
    }

    if (!this.collection) await this.initialize();

    const queryEmbedding = await embeddingService.generateEmbedding(query);
    
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: k
    });

    return results.documents[0].map((doc, index) => ({
      content: doc,
      metadata: results.metadatas[0][index],
      distance: results.distances[0][index]
    }));
  }
}

module.exports = new VectorStore();
