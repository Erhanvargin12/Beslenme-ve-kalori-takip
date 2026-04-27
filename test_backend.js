const fetch = require('node-fetch');
async function test() {
  const res = await fetch('http://localhost:3000/analiz-et', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gorselBase64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', mimeType: 'image/gif' })
  });
  console.log(await res.text());
}
test();
