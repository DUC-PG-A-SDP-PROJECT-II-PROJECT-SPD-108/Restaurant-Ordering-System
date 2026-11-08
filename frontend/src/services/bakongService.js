/**
 * AURA BISTRO - BAKONG KHQR PAYMENT SERVICE
 * Gateway: https://www.lorndavid.online/docs
 * Official National Bank of Cambodia (NBC) EMVCo KHQR Generator & MD5 Settlement Poller
 */

export const BAKONG_CONFIG = {
  BASE_URL: import.meta.env?.VITE_BAKONG_GATEWAY_URL || 'https://lorndavid.online',
  ACCOUNT_ID: import.meta.env?.VITE_BAKONG_ACCOUNT_ID || 'udom_vathna@bkrt',
  MERCHANT_NAME: import.meta.env?.VITE_BAKONG_MERCHANT_NAME || 'Aura Bistro',
  DEFAULT_CURRENCY: 'USD',
  USD_TO_KHR_RATE: 4100,
  POLL_INTERVAL_MS: 2500, // Check payment every 2.5s
  EXPIRY_SECONDS: 300 // 5-minute standard KHQR expiry
};

/**
 * Generate Dynamic EMVCo KHQR from Lorndavid Bakong Gateway
 * @param {Object} params
 * @param {number} params.amount - Amount to pay
 * @param {string} [params.currency='USD'] - 'USD' or 'KHR'
 * @param {string} [params.billNumber] - Unique invoice identifier
 * @param {string} [params.accountId] - Bakong Account ID (e.g. udom_vathna@bkrt)
 * @param {string} [params.merchantName] - Store name
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
    const response = await fetch(`${BAKONG_CONFIG.BASE_URL}/api/v1/khqr/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gateway returned HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
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
    console.error('Failed to generate Bakong KHQR:', error);
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
 * Check payment settlement status on NBC Ledger via MD5
 * responseCode === 0 : Paid / Confirmed
 * responseCode === 1 : Unpaid / Pending
 * @param {string} md5 - MD5 hash returned during generation
 */
export async function checkBakongPayment(md5) {
  if (!md5 || md5.startsWith('fallback-')) {
    return { isPaid: false, responseCode: 1, message: 'Unpaid / Local demo' };
  }

  try {
    const response = await fetch(`${BAKONG_CONFIG.BASE_URL}/api/v1/check/${md5}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { isPaid: false, responseCode: response.status, message: 'Check request error' };
    }

    const resData = await response.json();
    const isPaid = resData.responseCode === 0;

    return {
      isPaid,
      responseCode: resData.responseCode,
      responseMessage: resData.responseMessage || (isPaid ? 'Success' : 'Pending'),
      data: resData.data,
      hash: resData.data?.hash || resData.hash || md5
    };
  } catch (error) {
    console.warn('Bakong check error:', error.message);
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
