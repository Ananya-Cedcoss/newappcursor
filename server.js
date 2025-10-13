const express = require('express');
const app = express();

app.get('/api/products', (req, res) => {
  res.json(['Shirt', 'Pants', 'Hat']);
});

// Export app for Supertest
module.exports = app;

// Optional: only listen if not in test mode
if (require.main === module) {
  app.listen(3000, () => console.log('Server running on port 3000'));
}
