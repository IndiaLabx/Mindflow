import mammoth from 'mammoth';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ProcessedDocument {
  name: string;
  mimeType: string;
  data: string;
  isText: boolean;
}

export const processFile = async (file: File): Promise<ProcessedDocument> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File ${file.name} exceeds the 5MB size limit.`));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Failed to read file ${file.name}`));
    };

    if (file.type === 'application/pdf') {
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          name: file.name,
          mimeType: 'application/pdf',
          data: base64String,
          isText: false
        });
      };
      reader.readAsDataURL(file);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      reader.onloadend = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve({
            name: file.name,
            mimeType: 'text/plain', // Treat extracted docx as plain text
            data: result.value,
            isText: true
          });
        } catch (error) {
          reject(new Error(`Failed to extract text from DOCX ${file.name}: ${error}`));
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.onloadend = () => {
        resolve({
          name: file.name,
          mimeType: 'text/plain',
          data: reader.result as string,
          isText: true
        });
      };
      reader.readAsText(file);
    } else {
      reject(new Error(`Unsupported file type: ${file.type}`));
    }
  });
};
