import crypto from 'crypto';

const merchantId = process.env.NAGAD_MERCHANT_ID || '';
const privateKey = (process.env.NAGAD_MERCHANT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const publicKey = (process.env.NAGAD_PUBLIC_KEY || '').replace(/\\n/g, '\n');
const baseUrl = process.env.NAGAD_BASE_URL || 'http://sandbox.mynagad.com:10080';

// Format: YYYYMMDDHHmmss
function getFormattedDateTime(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function generateRandomString(length = 20): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

function encryptWithPublicKey(data: string): string {
  try {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, buffer);
    return encrypted.toString('base64');
  } catch (err) {
    console.error("Nagad RSA Encryption Error", err);
    throw new Error("Failed to encrypt data with Nagad public key.");
  }
}

function decryptWithPrivateKey(data: string): string {
  try {
    const buffer = Buffer.from(data, 'base64');
    const decrypted = crypto.privateDecrypt({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, buffer);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error("Nagad RSA Decryption Error", err);
    throw new Error("Failed to decrypt data with merchant private key.");
  }
}

function signWithPrivateKey(data: string): string {
  try {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  } catch (err) {
    console.error("Nagad RSA Signing Error", err);
    throw new Error("Failed to sign data with merchant private key.");
  }
}

export async function initializePayment(orderId: string, amount: number, clientIp = "127.0.0.1") {
  const dateTime = getFormattedDateTime();
  const challenge = generateRandomString();

  const sensitiveDataObj = {
    merchantId,
    datetime: dateTime,
    orderId,
    challenge
  };

  const sensitiveDataStr = JSON.stringify(sensitiveDataObj);
  
  const encryptedSensitiveData = encryptWithPublicKey(sensitiveDataStr);
  const signature = signWithPrivateKey(sensitiveDataStr);

  const payload = {
    dateTime,
    sensitiveData: encryptedSensitiveData,
    signature
  };

  const res = await fetch(`${baseUrl}/api/dfs/check-out/initialize/${merchantId}/${orderId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-KM-Api-Version': 'v-0.2.0',
      'X-KM-IP-V4': clientIp,
      'X-KM-Client-Type': 'PC_WEB'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.reason) {
    throw new Error(`Nagad Initialization Failed: ${data.message || data.reason}`);
  }

  // Decrypt response sensitive data
  const decryptedDataStr = decryptWithPrivateKey(data.sensitiveData);
  const decryptedData = JSON.parse(decryptedDataStr);

  return {
    paymentReferenceId: decryptedData.paymentReferenceId,
    challenge: decryptedData.challenge
  };
}

export async function completePayment(paymentReferenceId: string, orderId: string, amount: number, challenge: string, clientIp = "127.0.0.1") {
  const sensitiveDataObj = {
    merchantId,
    orderId,
    amount: amount.toString(),
    currencyCode: '050',
    challenge
  };

  const sensitiveDataStr = JSON.stringify(sensitiveDataObj);
  const encryptedSensitiveData = encryptWithPublicKey(sensitiveDataStr);
  const signature = signWithPrivateKey(sensitiveDataStr);

  const payload = {
    sensitiveData: encryptedSensitiveData,
    signature,
    merchantCallbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/nagad/callback?orderId=${orderId}`
  };

  const res = await fetch(`${baseUrl}/api/dfs/check-out/complete/${paymentReferenceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-KM-Api-Version': 'v-0.2.0',
      'X-KM-IP-V4': clientIp,
      'X-KM-Client-Type': 'PC_WEB'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  
  if (data.status === 'Success' && data.callBackUrl) {
    return data.callBackUrl;
  }

  throw new Error(`Nagad Complete Payment Failed: ${data.message || JSON.stringify(data)}`);
}

export async function verifyPayment(paymentRefId: string) {
  const res = await fetch(`${baseUrl}/api/dfs/verify/payment/${paymentRefId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-KM-Api-Version': 'v-0.2.0',
      'X-KM-Client-Type': 'PC_WEB'
    }
  });

  const data = await res.json();
  return data;
}
