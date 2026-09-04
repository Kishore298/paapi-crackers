const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use public DNS servers to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Customer = require('../models/Customer');
const Order = require('../models/Order');
const POSSale = require('../models/POSSale');

const run = async () => {
  try {
    console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers. Recalculating stats...`);

    let updatedCount = 0;

    for (const customer of customers) {
      // Get online orders (not cancelled)
      const orders = await Order.find({
        customer: customer._id,
        status: { $ne: 'Cancelled' }
      });

      // Get POS sales (not cancelled)
      const posSales = await POSSale.find({
        customer: customer._id,
        status: { $ne: 'Cancelled' }
      });

      const totalOrders = orders.length + posSales.length;

      const ordersSpending = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const posSpending = posSales.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
      const totalSpending = ordersSpending + posSpending;

      // Update customer
      customer.totalOrders = totalOrders;
      customer.totalSpending = totalSpending;
      await customer.save();
      updatedCount++;
      console.log(`Updated Customer ${customer.phone}: orders=${totalOrders}, spend=${totalSpending}`);
    }

    console.log(`Successfully updated ${updatedCount} customers.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
