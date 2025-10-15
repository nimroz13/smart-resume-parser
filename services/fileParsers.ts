import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source for pdf.js to ensure it can run in the background.
// Using a CDN-hosted version of the worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

/**
 * Parses a plain text file (.txt) and returns its content.
 * @param file The File object to parse.
 * @returns A promise that resolves with the text content of the file.
 */
async function parseTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read the text file."));
    reader.readAsText(file);
  });
}

/**
 * Parses a PDF file (.pdf) and extracts its text content.
 * @param file The File object to parse.
 * @returns A promise that resolves with the extracted text content of the PDF.
 */
async function parsePdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
            return reject(new Error('Failed to read PDF file into buffer.'));
        }
        
        // PDF.js expects a TypedArray, so we convert the ArrayBuffer.
        const typedArray = new Uint8Array(arrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          // The text content is an array of items. We join them to form the page's text.
          const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          fullText += pageText + '\n\n';
        }
        resolve(fullText);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        reject(new Error('Failed to parse PDF content. The file might be corrupted or protected.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the PDF file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses a file (txt or pdf) and returns its text content.
 * @param file The File object to parse.
 * @returns A promise that resolves with the text content.
 * @throws An error if the file type is not supported.
 */
export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'txt' || file.type === 'text/plain') {
    return parseTxt(file);
  } else if (extension === 'pdf' || file.type === 'application/pdf') {
    return parsePdf(file);
  } else {
    throw new Error(`Unsupported file type: '${extension}'. Please upload a .txt or .pdf file.`);
  }
}