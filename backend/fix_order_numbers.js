require('dotenv').config({ path: './.env' });
const dns = require('dns');

// Force Node.js to use public DNS servers to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require('mongoose');
const Order = require('./models/Order');
const POSSale = require('./models/POSSale');
const Invoice = require('./models/Invoice');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paapi-crackers', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
}).then(async () => {
  console.log('Connected to DB');

  // Process Orders
  const orders = await Order.find().sort({ createdAt: 1 });
  let orderSeq = 1;
  for (const order of orders) {
    const customerName = order.customerDetails?.name || 'customer';
    const date = new Date(order.createdAt);
    const yearSuffix = date.getFullYear().toString().slice(-2);

    const safeName = customerName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .substring(0, 15);

    const fullPrefix = `ORD-${safeName}-${yearSuffix}`;
    const newOrderNumber = `${fullPrefix}${String(orderSeq).padStart(5, '0')}`;

    order.orderNumber = newOrderNumber;
    await order.save();

    // Update Invoice if exists
    if (order.invoice) {
      const inv = await Invoice.findById(order.invoice);
      if (inv) {
        inv.invoiceNumber = newOrderNumber;
        await inv.save();
      }
    }
    console.log(`Updated Order: ${newOrderNumber}`);
    orderSeq++;
  }

  // Process POS Sales
  const posSales = await POSSale.find().sort({ createdAt: 1 });
  let posSeq = 1;
  for (const sale of posSales) {
    const customerName = sale.customerName || 'customer';
    const date = new Date(sale.createdAt);
    const yearSuffix = date.getFullYear().toString().slice(-2);

    const safeName = customerName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .substring(0, 15);

    const fullPrefix = `POS-${safeName}-${yearSuffix}`;
    // updated padding to 5 as requested
    const newBillNumber = `${fullPrefix}${String(posSeq).padStart(5, '0')}`;

    sale.billNumber = newBillNumber;
    await sale.save();

    // Update Invoice if exists
    if (sale.invoice) {
      const inv = await Invoice.findById(sale.invoice);
      if (inv) {
        inv.invoiceNumber = newBillNumber;
        await inv.save();
      }
    }
    console.log(`Updated POS Sale: ${newBillNumber}`);
    posSeq++;
  }

  console.log('Done!');
  process.exit(0);
});
