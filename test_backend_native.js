const http = require('http');

const data = JSON.stringify({
  gorselBase64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  mimeType: 'image/gif'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/analiz-et',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('RESPONSE:', body));
});

req.on('error', (e) => console.error('ERROR:', e.message));
req.write(data);
req.end();
