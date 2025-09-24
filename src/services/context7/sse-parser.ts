/**
 * Server-Sent Events (SSE) Parser for Context7 API
 * 
 * Handles parsing of SSE responses from Context7 API which returns:
 * event: message
 * data: {"result": {...}}
 * 
 * This parser extracts the JSON data from SSE format
 */

export interface SSEMessage {
  event?: string;
  data?: string;
  id?: string;
  retry?: number;
}

export class SSEParser {
  /**
   * Parse SSE response text into structured messages
   */
  static parseSSE(text: string): SSEMessage[] {
    const messages: SSEMessage[] = [];
    const lines = text.split('\n');
    
    let currentMessage: Partial<SSEMessage> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Empty line indicates end of message
      if (trimmedLine === '') {
        if (Object.keys(currentMessage).length > 0) {
          messages.push(currentMessage as SSEMessage);
          currentMessage = {};
        }
        continue;
      }
      
      // Parse field: value format
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) continue;
      
      const field = trimmedLine.substring(0, colonIndex).trim();
      const value = trimmedLine.substring(colonIndex + 1).trim();
      
      switch (field) {
        case 'event':
          currentMessage.event = value;
          break;
        case 'data':
          currentMessage.data = value;
          break;
        case 'id':
          currentMessage.id = value;
          break;
        case 'retry':
          currentMessage.retry = parseInt(value, 10);
          break;
      }
    }
    
    // Add final message if exists
    if (Object.keys(currentMessage).length > 0) {
      messages.push(currentMessage as SSEMessage);
    }
    
    return messages;
  }
  
  /**
   * Extract JSON data from SSE messages
   * Looks for messages with event: "message" and extracts the data field
   */
  static extractJSONFromSSE(text: string): any {
    try {
      const messages = this.parseSSE(text);
      
      // Look for message event with data
      for (const message of messages) {
        if (message.event === 'message' && message.data) {
          try {
            return JSON.parse(message.data);
          } catch (parseError) {
            // If data is not JSON, try parsing the entire message
            continue;
          }
        }
      }
      
      // If no message event found, try parsing the first data field
      for (const message of messages) {
        if (message.data) {
          try {
            return JSON.parse(message.data);
          } catch (parseError) {
            continue;
          }
        }
      }
      
      // If all else fails, try parsing the entire text as JSON
      return JSON.parse(text);
      
    } catch (error) {
      throw new Error(`Failed to parse SSE response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check if response is SSE format
   */
  static isSSEResponse(text: string): boolean {
    return text.includes('event:') && text.includes('data:');
  }
  
  /**
   * Smart response parser that handles both JSON and SSE
   */
  static parseResponse(text: string): any {
    try {
      // First try direct JSON parsing
      return JSON.parse(text);
    } catch (jsonError) {
      // If JSON fails, try SSE parsing
      if (this.isSSEResponse(text)) {
        return this.extractJSONFromSSE(text);
      }
      
      // If neither works, re-throw the original JSON error
      throw jsonError;
    }
  }
}
