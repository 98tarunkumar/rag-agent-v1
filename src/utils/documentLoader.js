const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentLoader {
  async loadDocument(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    try {
      switch (extension) {
        case '.txt':
          return await this.loadTextFile(filePath, fileName);
        case '.pdf':
          return await this.loadPdfFile(filePath, fileName);
        case '.docx':
          return await this.loadDocxFile(filePath, fileName);
        case '.md':
          return await this.loadMarkdownFile(filePath, fileName);
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }
    } catch (error) {
      console.error(`Error loading document ${fileName}:`, error);
      throw error;
    }
  }

  async loadTextFile(filePath, fileName) {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      content,
      source: fileName,
      title: fileName.replace('.txt', ''),
      type: 'text'
    };
  }

  async loadPdfFile(filePath, fileName) {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    return {
      content: data.text,
      source: fileName,
      title: fileName.replace('.pdf', ''),
      type: 'pdf',
      pages: data.numpages
    };
  }

  async loadDocxFile(filePath, fileName) {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return {
      content: result.value,
      source: fileName,
      title: fileName.replace('.docx', ''),
      type: 'docx'
    };
  }

  async loadMarkdownFile(filePath, fileName) {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      content,
      source: fileName,
      title: fileName.replace('.md', ''),
      type: 'markdown'
    };
  }

  async loadDocumentsFromDirectory(directoryPath) {
    const documents = [];
    const files = await fs.readdir(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        try {
          const document = await this.loadDocument(filePath);
          documents.push(document);
        } catch (error) {
          console.warn(`Skipping file ${file}: ${error.message}`);
        }
      }
    }

    return documents;
  }
}

module.exports = new DocumentLoader();
