const http = require('http');
const jwt = require('jsonwebtoken');

// Generate superAdmin token
const token = jwt.sign({ id: '66c3a2f3a5e8e814a0349f71', role: 'superAdmin' }, 'paapi-crackers-super-secret-key-2026', { expiresIn: '1d' });

const data = JSON.stringify({orderId:'66c429074fec0fc1ddce1b36', type:'gst'});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/invoices/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body));
});

req.on('error', console.error);
req.write(data);
req.end();
