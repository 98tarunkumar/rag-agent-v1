class TextSplitter {
  constructor(chunkSize = 1000, chunkOverlap = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  splitText(text) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;
      
      // Try to find a good break point (sentence end)
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('.', end);
        const paragraphEnd = text.lastIndexOf('\n\n', end);
        const breakPoint = Math.max(sentenceEnd, paragraphEnd);
        
        if (breakPoint > start) {
          end = breakPoint + 1;
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = end - this.chunkOverlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  splitDocuments(documents) {
    const splitDocuments = [];

    documents.forEach((doc, docIndex) => {
      const chunks = this.splitText(doc.content);
      
      chunks.forEach((chunk, chunkIndex) => {
        splitDocuments.push({
          ...doc,
          content: chunk,
          chunkIndex,
          originalDocIndex: docIndex
        });
      });
    });

    return splitDocuments;
  }
}

module.exports = TextSplitter;
