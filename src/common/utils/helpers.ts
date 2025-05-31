import * as crypto from 'crypto';

export const generateTokenWithExpiration = (
  byteSize: number = 32,
  expirationHours: number = 1,
) => {
  const token = crypto.randomBytes(byteSize).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);
  return { token, expiresAt };
};
