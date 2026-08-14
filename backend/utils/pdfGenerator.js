const PDFDocument = require('pdfkit');

/**
 * PDF Generator using PDFKit
 * Generates invoice PDFs with business/customer details, items, and GST breakdown
 */

const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const isGST = invoice.type === 'gst';
      const biz = invoice.businessSnapshot || {};
      const cust = invoice.customerSnapshot || {};

      // Header
      doc.fontSize(18).font('Helvetica-Bold').text(biz.name || 'Business', { align: 'center' });
      doc.fontSize(9).font('Helvetica');
      if (biz.address) doc.text(`${biz.address}${biz.city ? ', ' + biz.city : ''}${biz.state ? ', ' + biz.state : ''} ${biz.pincode || ''}`, { align: 'center' });
      if (biz.phone) doc.text(`Phone: ${biz.phone}`, { align: 'center' });
      if (biz.gstin && isGST) doc.text(`GSTIN: ${biz.gstin}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Invoice Title
      doc.fontSize(14).font('Helvetica-Bold').text(isGST ? 'TAX INVOICE' : 'INVOICE', { align: 'center' });
      doc.moveDown(0.5);

      // Invoice details
      doc.fontSize(9).font('Helvetica');
      const detailsY = doc.y;
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, 40, detailsY);
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 350, detailsY);
      doc.moveDown(1.5);

      // Customer details
      doc.font('Helvetica-Bold').text('Bill To:', 40);
      doc.font('Helvetica');
      if (cust.name) doc.text(cust.name);
      if (cust.address) doc.text(`${cust.address}${cust.city ? ', ' + cust.city : ''}`);
      if (cust.state) doc.text(`${cust.state} ${cust.pincode || ''}`);
      if (cust.phone) doc.text(`Phone: ${cust.phone}`);
      if (cust.gstin && isGST) doc.text(`GSTIN: ${cust.gstin}`);
      doc.moveDown(1);

      // Items table
      const tableTop = doc.y;
      const colX = { sno: 40, product: 65, hsn: 200, qty: 255, rate: 295, disc: 350, taxable: 395 };

      if (isGST) {
        // GST invoice columns
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('S.No', colX.sno, tableTop);
        doc.text('Product', colX.product, tableTop);
        doc.text('HSN', colX.hsn, tableTop);
        doc.text('Qty', colX.qty, tableTop);
        doc.text('Rate', colX.rate, tableTop);
        doc.text('Disc', colX.disc, tableTop);
        doc.text('Taxable', colX.taxable, tableTop);
        doc.text('CGST', 445, tableTop);
        doc.text('SGST', 490, tableTop);
        doc.text('Total', 530, tableTop);
      } else {
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('S.No', 40, tableTop);
        doc.text('Product', 65, tableTop);
        doc.text('Qty', 300, tableTop);
        doc.text('Rate', 350, tableTop);
        doc.text('Discount', 410, tableTop);
        doc.text('Total', 490, tableTop);
      }

      doc.moveTo(40, doc.y + 3).lineTo(555, doc.y + 3).stroke();
      doc.moveDown(0.5);

      // Items
      doc.font('Helvetica').fontSize(8);
      (invoice.items || []).forEach((item, i) => {
        const y = doc.y;
        if (y > 700) {
          doc.addPage();
        }

        const ps = item.productSnapshot || {};
        if (isGST) {
          doc.text(String(i + 1), colX.sno, doc.y, { width: 20 });
          const lineY = doc.y - 10;
          doc.text(ps.name || '', colX.product, lineY, { width: 130 });
          doc.text(ps.hsnCode || '-', colX.hsn, lineY, { width: 50 });
          doc.text(String(item.quantity), colX.qty, lineY, { width: 35 });
          doc.text(`₹${item.rate}`, colX.rate, lineY, { width: 50 });
          doc.text(`₹${item.discount || 0}`, colX.disc, lineY, { width: 40 });
          doc.text(`₹${item.taxableValue}`, colX.taxable, lineY, { width: 45 });
          doc.text(`₹${item.cgstAmount || 0}`, 445, lineY, { width: 40 });
          doc.text(`₹${item.sgstAmount || 0}`, 490, lineY, { width: 35 });
          doc.text(`₹${item.total}`, 530, lineY, { width: 45 });
        } else {
          doc.text(String(i + 1), 40, doc.y, { width: 20 });
          const lineY = doc.y - 10;
          doc.text(ps.name || '', 65, lineY, { width: 230 });
          doc.text(String(item.quantity), 300, lineY, { width: 45 });
          doc.text(`₹${item.rate}`, 350, lineY, { width: 55 });
          doc.text(`₹${item.discount || 0}`, 410, lineY, { width: 75 });
          doc.text(`₹${item.total}`, 490, lineY, { width: 65 });
        }
        doc.moveDown(0.3);
      });

      doc.moveTo(40, doc.y + 3).lineTo(555, doc.y + 3).stroke();
      doc.moveDown(1);

      // Totals
      const totalsX = 400;
      doc.font('Helvetica').fontSize(9);

      if (isGST) {
        doc.text(`Taxable Amount:`, totalsX, doc.y);
        doc.text(`₹${invoice.taxableAmount}`, 500, doc.y - 11, { align: 'right' });
        doc.moveDown(0.3);

        if (invoice.cgstTotal > 0) {
          doc.text(`CGST:`, totalsX, doc.y);
          doc.text(`₹${invoice.cgstTotal}`, 500, doc.y - 11, { align: 'right' });
          doc.moveDown(0.3);
        }
        if (invoice.sgstTotal > 0) {
          doc.text(`SGST:`, totalsX, doc.y);
          doc.text(`₹${invoice.sgstTotal}`, 500, doc.y - 11, { align: 'right' });
          doc.moveDown(0.3);
        }
        if (invoice.igstTotal > 0) {
          doc.text(`IGST:`, totalsX, doc.y);
          doc.text(`₹${invoice.igstTotal}`, 500, doc.y - 11, { align: 'right' });
          doc.moveDown(0.3);
        }
      }

      if (invoice.discount > 0) {
        doc.text(`Discount:`, totalsX, doc.y);
        doc.text(`-₹${invoice.discount}`, 500, doc.y - 11, { align: 'right' });
        doc.moveDown(0.3);
      }

      if (invoice.deliveryCharge > 0) {
        doc.text(`Delivery Charge:`, totalsX, doc.y);
        doc.text(`₹${invoice.deliveryCharge}`, 500, doc.y - 11, { align: 'right' });
        doc.moveDown(0.3);
      }

      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text(`Grand Total: ₹${invoice.grandTotal}`, totalsX, doc.y);

      doc.moveDown(2);
      doc.font('Helvetica').fontSize(8);
      doc.text('Thank you for your business!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
