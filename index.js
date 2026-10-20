const express = require('express');
const 【entity-axios¦canonical_name=axios】 = require('【entity-axios¦canonical_name=axios】');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());

const CONFIG = {
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'temp',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'temp',
    shortCode: '400200',
    passkey: process.env.MPESA_PASSKEY || 'temp',
    authUrl: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkUrl: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processquery',
    callbackUrl: 'https://danstar-net-billing.onrender.com/api/callback'
};

let token = '';
let expiry = 0;
async function getToken() {
  if (token && Date.now() < expiry) return token;
  const auth = Buffer.from(CONFIG.consumerKey+':'+CONFIG.consumerSecret).toString('base64');
  const r = await 【entity-axios¦canonical_name=axios】.get(CONFIG.authUrl, { headers: { Authorization: 'Basic '+auth }});
  token = r.data.access_token;
  expiry = Date.now() + 3000000;
  return token;
}

app.get('/', (req,res)=> res.send('<h1>Danstar Net - Paybill 400200 LIVE</h1><p>Server Running</p>'));
app.post('/api/pay', async (req,res)=>{
  let phone = req.body.phone.replace(/^0/,'254');
  const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,-3);
  const password = Buffer.from(CONFIG.shortCode+CONFIG.passkey+timestamp).toString('base64');
  try {
    const t = await getToken();
    const payload = {
      BusinessShortCode: CONFIG.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: req.body.amount || 20,
      PartyA: phone,
      PartyB: CONFIG.shortCode,
      PhoneNumber: phone,
      CallBackURL: CONFIG.callbackUrl,
      AccountReference: 'DanstarNet',
      TransactionDesc: 'WiFi'
    };
    const r = await axios.post(CONFIG.stkUrl, payload, { headers: { Authorization: 'Bearer '+t }});
    res.json({ success: true, data: r.data });
  } catch(e){ res.status(500).json({ success:false, error: e.response?.data || e.message }); }
});
app.post('/api/callback', (req,res)=>{
  console.log('M-PESA CALLBACK', JSON.stringify(req.body));
  res.json({ ResultCode:0, ResultDesc:'OK' });
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log('Running on '+PORT));
