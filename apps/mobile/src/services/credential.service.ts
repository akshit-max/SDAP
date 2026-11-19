/**
 * WITHUS Mobile Secure Browser PoC — Credential Parsing & Sanitization Service
 *
 * Implements:
 * - Parsing of plaintext credential formats from backend reveal
 * - Username resolution (parsed vs session permittedUsername)
 * - Safe JavaScript string escaping to prevent code injection
 * - Zero persistence guarantee (never write credentials to storage or logs)
 */

export interface ParsedCredentials {
  username: string;
  password: string;
}

export class CredentialService {
  /**
   * Parse credentials from backend plaintext response.
   * Matches WITHUS extension service-worker.ts parsing logic:
   * 1. Newline-separated ("username\npassword")
   * 2. Colon-separated ("username:password")
   * 3. Space-separated ("user@email.com password123")
   * 4. Single-value (password only)
   */
  static parsePlaintext(plaintext: string, permittedUsername?: string): ParsedCredentials {
    if (!plaintext || typeof plaintext !== 'string') {
      return {
        username: permittedUsername || '',
        password: '',
      };
    }

    const trimmed = plaintext.trim();
    let username = '';
    let password = '';

    if (trimmed.includes('\n')) {
      const parts = trimmed.split('\n');
      username = parts[0].trim();
      password = parts.slice(1).join('\n').trim();
    } else if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      username = parts[0].trim();
      password = parts.slice(1).join(':').trim();
    } else if (trimmed.includes(' ')) {
      const spaceIdx = trimmed.indexOf(' ');
      const firstToken = trimmed.slice(0, spaceIdx).trim();
      const rest = trimmed.slice(spaceIdx + 1).trim();

      if (firstToken.includes('@') || firstToken.length < 50) {
        username = firstToken;
        password = rest;
      } else {
        username = '';
        password = trimmed;
      }
    } else {
      username = '';
      password = trimmed;
    }

    // Fallback to session permittedUsername if username was not embedded in plaintext
    if (!username && permittedUsername) {
      username = permittedUsername.trim();
    }

    return {
      username,
      password,
    };
  }

  /**
   * Safely JSON-encode a string value for insertion into JavaScript templates,
   * preventing template breakout or XSS attacks.
   */
  static escapeForScript(value: string): string {
    return JSON.stringify(value || '');
  }
}

