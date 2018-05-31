export interface WalletError {
  name: string;
  code: string;
  message: string;
}

const walletError = (code: number, name: string, defaultMessage: string) => (
  m?: string
): WalletError => {
  const err: any = new Error(m || defaultMessage);
  err.code = code;
  err.codeName = name;
  err.name = 'WalletError';
  return err;
};

export const signatureRejected = walletError(1000, 'SignatureRejected', 'Signature Rejected');
