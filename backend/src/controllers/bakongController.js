const BAKONG_ACCOUNT_ID = process.env.BAKONG_ACCOUNT_ID || 'udom_vathna@bkrt';
const BAKONG_GATEWAY_URL = process.env.BAKONG_GATEWAY_URL || 'https://lorndavid.online';
const BAKONG_MERCHANT_NAME = process.env.BAKONG_MERCHANT_NAME || 'Aura Bistro';

/**
 * Generate Dynamic EMVCo KHQR from Lorndavid Bakong Gateway
 * POST /api/bakong/generate
 */
export async function generateKhqr(req, res) {
  try {
    const {
      amount,
      currency = 'USD',
      billNumber = `INV-${Date.now().toString().slice(-6)}`,
      merchantName = BAKONG_MERCHANT_NAME,
      accountId = BAKONG_ACCOUNT_ID
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount required' });
    }

    const payload = {
      accountId,
      merchantName,
      amount: Number(parseFloat(amount).toFixed(2)),
      currency,
      billNumber
    };

    const gatewayRes = await fetch(`${BAKONG_GATEWAY_URL}/api/v1/khqr/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await gatewayRes.json();
    res.status(gatewayRes.status).json(data);
  } catch (error) {
    console.error('Bakong generate error:', error.message);
    res.status(500).json({ error: 'Failed to generate KHQR from gateway', details: error.message });
  }
}

/**
 * Check payment status by MD5 checksum
 * GET /api/bakong/check/:md5
 */
export async function checkPayment(req, res) {
  try {
    const { md5 } = req.params;
    const gatewayRes = await fetch(`${BAKONG_GATEWAY_URL}/api/v1/check/${md5}`);
    const data = await gatewayRes.json();
    res.status(gatewayRes.status).json(data);
  } catch (error) {
    console.error('Bakong check error:', error.message);
    res.status(500).json({ error: 'Failed to verify payment with gateway', details: error.message });
  }
}
