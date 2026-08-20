import crypto from 'crypto';

/**
 * Generates an activation code in the format MILK-XXXX-XXXX.
 * Excludes easily confusable characters (O, 0, I, 1).
 */
export default function generateActivationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  const generateSegment = (length) => {
    let result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };
  
  return `MILK-${generateSegment(4)}-${generateSegment(4)}`;
}
