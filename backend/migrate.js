const mongoose = require('mongoose');
require('dotenv').config();
const dns = require('dns');
dns.setServers(["8.8.8.8", "8.8.4.4"]);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.db.collection('products').updateMany(
    {},
    { $rename: { 'sellingPrice': 'mrp' }, $unset: { 'packQuantity': '' } }
  );
  console.log('Migrated', result.modifiedCount);
  process.exit(0);
}).catch(console.error);
