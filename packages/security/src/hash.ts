import * as argon2 from 'argon2';

export class HashService {
  static async hash(plainText: string): Promise<string> {
    return argon2.hash(plainText, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  static async verify(hash: string, plainText: string): Promise<boolean> {
    return argon2.verify(hash, plainText);
  }
}
