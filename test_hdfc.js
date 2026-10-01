require('dotenv').config({ path: 'd:/SDAP/.env' });
const fetch = require('node-fetch'); // we'll use native fetch or node-fetch
async function test() {
  const url = process.env.HDFC_BASE_URL + '/session';
  const auth = 'Basic ' + Buffer.from(process.env.HDFC_API_KEY + ':').toString('base64');
  const headers = {
    'Authorization': auth,
    'Content-Type': 'application/json',
    'x-merchantid': process.env.HDFC_MERCHANT_ID,
    'x-customerid': process.env.HDFC_CLIENT_ID,
    'x-resellerid': process.env.HDFC_RESELLER_ID
  };
  const body = {
    order_id: 'test_order_' + Date.now(),
    amount: "499.00",
    customer_id: "cust_test_123",
    customer_email: "test@example.com",
    customer_phone: "9999999999",
    payment_page_client_id: process.env.HDFC_PAYMENT_PAGE_CLIENT_ID,
    action: 'paymentPage',
    currency: 'INR',
    return_url: process.env.HDFC_RETURN_URL,
    description: "test"
  };
  console.log("Headers:", headers);
  const res = await globalThis.fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  console.log("Response:", text);
}
test().catch(console.error);
