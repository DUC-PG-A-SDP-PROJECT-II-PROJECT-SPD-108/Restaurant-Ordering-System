/**
 * AURA BISTRO - BAKONG KHQR PAYMENT SERVICE (Backend-Mediated Security Architecture)
 * Gateway Proxied via Backend Express API: /api/bakong/generate and /api/bakong/check/:md5
 */
import api from './api';

export const BAKONG_CONFIG = {
  ACCOUNT_ID: import.meta.env?.VITE_BAKONG_ACCOUNT_ID || 'udom_vathna@bkrt',
  MERCHANT_NAME: import.meta.env?.VITE_BAKONG_MERCHANT_NAME || 'Aura Bistro',
  DEFAULT_CURRENCY: 'USD',
  USD_TO_KHR_RATE: 4100,
  POLL_INTERVAL_MS: 2500, // Check payment every 2.5s
  EXPIRY_SECONDS: 300 // 5-minute standard KHQR expiry
};

/**
 * Generate Dynamic EMVCo KHQR via Backend REST API
 */
export async function generateBakongKhqr({
  amount,
  currency = BAKONG_CONFIG.DEFAULT_CURRENCY,
  billNumber,
  accountId = BAKONG_CONFIG.ACCOUNT_ID,
  merchantName = BAKONG_CONFIG.MERCHANT_NAME
}) {
  const cleanAmount = Number(parseFloat(amount).toFixed(2));
  const invoiceNumber = billNumber || `INV-${Date.now().toString().slice(-6)}`;

  const payload = {
    accountId,
    merchantName,
    amount: cleanAmount,
    currency,
    billNumber: invoiceNumber
  };

  try {
    // Call backend API endpoint rather than external third-party directly
    const response = await api.post('/bakong/generate', payload);
    const data = response.data;

    return {
      success: true,
      md5: data.md5,
      qrImage: data.qrImage || data.qrDataUrl,
      qrString: data.qrString,
      deeplink: data.deeplink,
      billNumber: data.billNumber || invoiceNumber,
      amount: cleanAmount,
      currency,
      accountId: data.accountId || accountId,
      merchantName: data.merchantName || merchantName
    };
  } catch (error) {
    console.warn('Backend Bakong generate failed, employing graceful fallback QR:', error?.message);
    // Return graceful fallback QR so checkout is never blocked
    return {
      success: false,
      error: error.message,
      md5: `fallback-${Date.now()}`,
      qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        `00020101021229200016${accountId}520459995303840540${cleanAmount}5802KH5911${merchantName}6010Phnom Penh62150111${invoiceNumber}`
      )}`,
      qrString: `00020101021229200016${accountId}520459995303840540${cleanAmount}5802KH5911${merchantName}6010Phnom Penh62150111${invoiceNumber}`,
      deeplink: `https://bakong.page.link/?link=${encodeURIComponent(
        `00020101021229200016${accountId}520459995303840540${cleanAmount}`
      )}&apn=kh.gov.nbc.bakong`,
      billNumber: invoiceNumber,
      amount: cleanAmount,
      currency,
      accountId,
      merchantName
    };
  }
}

/**
 * Check payment settlement status on NBC Ledger via Backend API
 * responseCode === 0 : Paid / Confirmed
 * responseCode === 1 : Unpaid / Pending
 */
export async function checkBakongPayment(md5) {
  if (!md5 || md5.startsWith('fallback-')) {
    return { isPaid: false, responseCode: 1, message: 'Unpaid / Local demo' };
  }

  try {
    const response = await api.get(`/bakong/check/${md5}`);
    const resData = response.data;
    const isPaid = resData.responseCode === 0;

    return {
      isPaid,
      responseCode: resData.responseCode,
      responseMessage: resData.responseMessage || (isPaid ? 'Success' : 'Pending'),
      data: resData.data,
      hash: resData.data?.hash || resData.hash || md5
    };
  } catch (error) {
    console.warn('Bakong check error via backend:', error.message);
    return { isPaid: false, responseCode: 500, message: error.message };
  }
}

/**
 * Format USD amount to KHR currency string
 */
export function formatKhmerRiel(usdAmount) {
  const khr = Math.round(usdAmount * BAKONG_CONFIG.USD_TO_KHR_RATE);
  return `៛${khr.toLocaleString()}`;
}
