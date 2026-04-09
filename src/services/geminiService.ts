import { GoogleGenAI } from "@google/genai";

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

export async function callGeminiAI(prompt: string, modelIndex = 0): Promise<string | null> {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = MODELS[modelIndex];
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || '';
  } catch (error: any) {
    console.error(`Error with model ${MODELS[modelIndex]}:`, error);
    
    // Fallback logic
    if (modelIndex < MODELS.length - 1) {
      return callGeminiAI(prompt, modelIndex + 1);
    }
    
    throw error;
  }
}

// Gọi Gemini với file (hình ảnh hoặc PDF) dạng base64
export async function callGeminiWithFile(
  prompt: string,
  fileBase64: string,
  mimeType: string,
  modelIndex = 0
): Promise<string | null> {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = MODELS[modelIndex];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType,
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.5,
      }
    });

    return response.text || '';
  } catch (error: any) {
    console.error(`Error with model ${MODELS[modelIndex]} (multimodal):`, error);
    
    if (modelIndex < MODELS.length - 1) {
      return callGeminiWithFile(prompt, fileBase64, mimeType, modelIndex + 1);
    }
    
    throw error;
  }
}

// Trích xuất text từ file .docx (ZIP chứa XML)
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Tìm file word/document.xml trong ZIP
  // ZIP format: local file headers start with PK\x03\x04
  const textParts: string[] = [];
  
  // Simple approach: convert to blob, use JSZip-like manual parsing
  // Actually, let's use a simpler approach - find the XML content in the docx
  try {
    // Use the browser's built-in decompression via Response + Blob
    const blob = new Blob([bytes], { type: 'application/zip' });
    
    // We'll try to extract using a minimal ZIP parser
    const entries = await parseZipEntries(bytes);
    const documentEntry = entries.find(e => e.name === 'word/document.xml');
    
    if (!documentEntry) {
      throw new Error('Không tìm thấy nội dung document.xml trong file .docx');
    }

    // Decompress the entry
    const xmlText = await decompressEntry(documentEntry, bytes);
    
    // Parse XML to extract text
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    
    // Get all text nodes from w:t elements
    const textNodes = doc.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      't'
    );
    
    for (let i = 0; i < textNodes.length; i++) {
      textParts.push(textNodes[i].textContent || '');
    }

    // Also try paragraph breaks
    const paragraphs = doc.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'p'
    );
    
    const result: string[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const pTexts = paragraphs[i].getElementsByTagNameNS(
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        't'
      );
      const line: string[] = [];
      for (let j = 0; j < pTexts.length; j++) {
        line.push(pTexts[j].textContent || '');
      }
      if (line.length > 0) {
        result.push(line.join(''));
      }
    }

    return result.join('\n') || textParts.join(' ');
  } catch (error) {
    console.error('Error parsing docx:', error);
    throw new Error('Không thể đọc file Word. Vui lòng thử file khác hoặc chụp ảnh.');
  }
}

// Minimal ZIP parser
interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  dataOffset: number;
}

function parseZipEntries(data: Uint8Array): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (offset < data.length - 4) {
    const sig = view.getUint32(offset, true);
    
    // Local file header signature
    if (sig !== 0x04034b50) break;
    
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    
    const nameBytes = data.slice(offset + 30, offset + 30 + nameLen);
    const name = new TextDecoder().decode(nameBytes);
    
    const dataOffset = offset + 30 + nameLen + extraLen;
    
    entries.push({
      name,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      dataOffset
    });
    
    offset = dataOffset + compressedSize;
  }

  return entries;
}

async function decompressEntry(entry: ZipEntry, zipData: Uint8Array): Promise<string> {
  const compressedData = zipData.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    // Stored (no compression)
    return new TextDecoder().decode(compressedData);
  }

  if (entry.compressionMethod === 8) {
    // Deflate - use DecompressionStream
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    const writePromise = writer.write(compressedData).then(() => writer.close());
    
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const result = await reader.read();
      if (result.done) {
        done = true;
      } else {
        chunks.push(result.value);
      }
    }

    await writePromise;

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const chunk of chunks) {
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return new TextDecoder().decode(result);
  }

  throw new Error(`Unsupported compression method: ${entry.compressionMethod}`);
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const SYSTEM_PROMPT = `Bạn là một giáo viên Hóa học ảo thông minh (AI Tutor). 
Nhiệm vụ của bạn là giải đáp các thắc mắc về hóa học, giải thích các phản ứng, 
hướng dẫn thực hiện thí nghiệm và kiểm tra kiến thức của học sinh.
Hãy trả lời bằng tiếng Việt, phong cách thân thiện, dễ hiểu và chính xác về mặt khoa học.
Sử dụng Markdown để định dạng câu trả lời (in đậm, danh sách, phương trình hóa học).`;

export const REACTION_PROMPT = `Bạn là một chuyên gia hóa học. 
Khi tôi cung cấp danh sách các hóa chất, hãy dự đoán phản ứng xảy ra.
Trả về kết quả dưới dạng JSON duy nhất với cấu trúc sau:
{
  "color": "mã màu hex (ví dụ: #ff0000)",
  "bubbles": true/false (có sủi bọt khí không),
  "precipitate": true/false (có kết tủa không),
  "message": "mô tả ngắn gọn hiện tượng bằng tiếng Việt",
  "equation": "phương trình hóa học cân bằng",
  "explanation": "giải thích ngắn gọn cơ chế phản ứng"
}
Nếu không có phản ứng, hãy trả về màu trung bình của các hóa chất và message "Không có phản ứng xảy ra".`;

export const LAB_PROBLEM_PROMPT = `Bạn là một chuyên gia hóa học phòng thí nghiệm. 
Tôi sẽ cung cấp cho bạn đề bài thí nghiệm hóa học (có thể từ hình ảnh, PDF, hoặc văn bản).

Nhiệm vụ: Phân tích đề bài và xác định TẤT CẢ các hóa chất cần thiết để thực hiện thí nghiệm.

Trả về KẾT QUẢ dưới dạng JSON DUY NHẤT (KHÔNG markdown, KHÔNG giải thích thêm) với cấu trúc:
{
  "problem_summary": "Tóm tắt ngắn gọn đề bài bằng tiếng Việt",
  "chemicals": [
    {
      "id": "id_duy_nhat_viet_thuong_khong_dau (ví dụ: hcl, naoh, cuso4)",
      "name": "Tên tiếng Việt đầy đủ của hóa chất",
      "formula": "Công thức hóa học (ví dụ: HCl, NaOH)",
      "color": "mã màu hex thể hiện màu thực tế của hóa chất (ví dụ: #3b82f6 cho dung dịch xanh lam)",
      "state": "liquid hoặc solid hoặc gas",
      "properties": "Mô tả ngắn tính chất vật lý",
      "concentration": "Nồng độ nếu đề bài chỉ định (ví dụ: 0.1M, 1M), để trống nếu không có",
      "safetyWarnings": ["Cảnh báo an toàn 1", "Cảnh báo an toàn 2"],
      "description": "Vai trò/mục đích trong thí nghiệm này"
    }
  ],
  "experiment_steps": ["Bước 1: ...", "Bước 2: ...", "Bước 3: ..."],
  "expected_results": "Mô tả hiện tượng và kết quả dự kiến",
  "equations": ["Phương trình hóa học cân bằng 1", "Phương trình 2"]
}

LƯU Ý QUAN TRỌNG:
- Chỉ trả về JSON, không có text khác
- Mỗi hóa chất phải có đầy đủ tất cả các trường
- Màu sắc phải phản ánh đúng màu thực tế của hóa chất/dung dịch
- Nếu đề bài cần chỉ thị (quỳ tím, phenolphthalein...) thì cũng liệt kê
- id phải là duy nhất, viết thường, không dấu, không khoảng trắng`;

export async function predictReaction(chemicals: string[]): Promise<any> {
  const prompt = `${REACTION_PROMPT}\n\nDanh sách hóa chất: ${chemicals.join(', ')}`;
  const response = await callGeminiAI(prompt);
  if (!response) return null;
  
  try {
    // Extract JSON from response if it's wrapped in markdown
    const jsonStr = response.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse reaction JSON:", e);
    return null;
  }
}

// Phân tích đề bài thí nghiệm từ file
export interface LabProblemResult {
  problem_summary: string;
  chemicals: {
    id: string;
    name: string;
    formula: string;
    color: string;
    state: 'solid' | 'liquid' | 'gas';
    properties: string;
    concentration?: string;
    safetyWarnings: string[];
    description: string;
  }[];
  experiment_steps: string[];
  expected_results: string;
  equations: string[];
}

export async function analyzeLabProblem(file: File): Promise<LabProblemResult | null> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  let response: string | null = null;

  if (fileType.startsWith('image/')) {
    // Hình ảnh: gửi trực tiếp qua base64
    const base64 = await fileToBase64(file);
    response = await callGeminiWithFile(
      LAB_PROBLEM_PROMPT + '\n\nĐây là hình ảnh đề bài thí nghiệm. Hãy đọc và phân tích nội dung.',
      base64,
      fileType
    );
  } else if (fileType === 'application/pdf') {
    // PDF: gửi trực tiếp qua base64 (Gemini hỗ trợ PDF native)
    const base64 = await fileToBase64(file);
    response = await callGeminiWithFile(
      LAB_PROBLEM_PROMPT + '\n\nĐây là file PDF đề bài thí nghiệm. Hãy đọc và phân tích nội dung.',
      base64,
      'application/pdf'
    );
  } else if (
    fileName.endsWith('.docx') ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // Word .docx: trích xuất text rồi gửi
    const text = await extractTextFromDocx(file);
    if (!text.trim()) {
      throw new Error('Không trích xuất được nội dung từ file Word.');
    }
    response = await callGeminiAI(
      LAB_PROBLEM_PROMPT + '\n\nĐề bài thí nghiệm (trích xuất từ file Word):\n\n' + text
    );
  } else {
    throw new Error(`Định dạng file không được hỗ trợ: ${fileType || fileName}`);
  }

  if (!response) return null;

  try {
    const jsonStr = response.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonStr) as LabProblemResult;
    
    // Validate
    if (!result.chemicals || !Array.isArray(result.chemicals)) {
      throw new Error('Invalid response structure');
    }

    // Ensure all chemicals have required fields
    result.chemicals = result.chemicals.map(chem => ({
      id: chem.id || chem.formula?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown',
      name: chem.name || chem.formula || 'Không rõ',
      formula: chem.formula || '',
      color: chem.color || '#e2e8f0',
      state: chem.state || 'liquid',
      properties: chem.properties || '',
      concentration: chem.concentration || undefined,
      safetyWarnings: chem.safetyWarnings || ['Cần cẩn thận'],
      description: chem.description || ''
    }));

    return result;
  } catch (e) {
    console.error("Failed to parse lab problem JSON:", e, response);
    throw new Error('AI không trả về kết quả hợp lệ. Vui lòng thử lại.');
  }
}
