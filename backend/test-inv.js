const mongoose = require('mongoose');
const invoiceService = require('./services/invoiceService');
const Order = require('./models/Order');

mongoose.connect('mongodb+srv://dskkishore:Kishore298@paapicrackers.nt7j3.mongodb.net/paapi-crackers?retryWrites=true&w=majority')
  .then(async () => {
    try {
      const order = await Order.findOne();
      if (!order) {
        console.log('No order found');
        return process.exit(0);
      }
      
      const normalInvoice = await invoiceService.generateNormalInvoice({
        order,
        generatedBy: null
      });
      
      console.log('Normal Invoice successful:', normalInvoice._id);

    } catch(e) {
      console.error('ERROR GENERATING NORMAL INVOICE:', e);
    }
    process.exit(0);
  });
