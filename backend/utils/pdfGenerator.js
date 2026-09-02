const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

      const brandColor = '#7c3aed';
      const darkGray = '#374151';
      const lightGray = '#6b7280';
      const borderGray = '#e5e7eb';
      const bgGray = '#f3f4f6';
      const bgPurple = '#f3e8ff';

      // ---- HEADER ----
      const logoPath = path.join(__dirname, '../public/paapi-logo.png');
      const startY = 40;
      doc.y = startY;

      // Left: Logo and Business Info
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, startY, { height: 35 });
      }
      
      // Business Name
      doc.fontSize(22).font('Helvetica-Bold').fillColor(brandColor)
         .text(biz.name || 'Paapi Crackers', 90, startY + 5);

      doc.y = startY + 45;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkGray)
         .text(biz.name || 'Paapi Crackers', 40, doc.y);
      
      doc.font('Helvetica').fillColor(lightGray).moveDown(0.2);
      if (biz.address) {
        const addr = biz.address.replace(/\n/g, ', ').replace(/,\s*,/g, ',');
        doc.text(addr, { width: 250 });
      }
      if (biz.city || biz.state) {
        doc.text(`${biz.city || ''}${biz.city && biz.state ? ', ' : ''}${biz.state || ''} - ${biz.pincode || ''}`);
      }
      doc.moveDown(0.2);
      if (biz.gstin && isGST) {
        doc.font('Helvetica-Bold').fillColor(darkGray).text('GSTIN: ', { continued: true })
           .font('Helvetica').fillColor(lightGray).text(biz.gstin);
      }
      if (biz.phone) {
        doc.font('Helvetica-Bold').fillColor(darkGray).text('Contact: ', { continued: true })
           .font('Helvetica').fillColor(lightGray).text(biz.phone);
      }

      // Right: Invoice Metadata
      const rightX = 350;
      doc.y = startY + 5;
      doc.fontSize(18).font('Helvetica-Bold').fillColor(darkGray)
         .text(isGST ? 'TAX INVOICE' : 'INVOICE', rightX, doc.y, { align: 'right', width: 205 });
      
      doc.y += 15;
      doc.fontSize(9);
      const drawMeta = (label, value) => {
        const y = doc.y;
        doc.font('Helvetica').fillColor(lightGray).text(label, rightX, y, { width: 80, align: 'right' });
        doc.font('Helvetica-Bold').fillColor(darkGray).text(value, rightX + 90, y, { width: 115, align: 'right' });
      };

      drawMeta('Invoice No:', invoice.invoiceNumber);
      doc.moveDown(0.2);
      drawMeta('Invoice Date:', new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
      doc.moveDown(0.2);
      if (cust.state) drawMeta('Place of Supply:', cust.state);

      // Divider
      doc.y = Math.max(doc.y, 160) + 15;
      doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1).strokeColor(borderGray).stroke();
      doc.y += 15;

      // ---- BILL TO / SHIP TO ----
      const billY = doc.y;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(brandColor).text('Billed To', 40, billY);
      doc.moveTo(40, doc.y + 2).lineTo(280, doc.y + 2).lineWidth(1).strokeColor(borderGray).stroke();
      
      doc.fontSize(12).font('Helvetica-Bold').fillColor(brandColor).text('Shipped To', 315, billY);
      doc.moveTo(315, doc.y + 2).lineTo(555, doc.y + 2).lineWidth(1).strokeColor(borderGray).stroke();
      
      doc.y = billY + 20;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(darkGray);
      doc.text(cust.name || 'Cash Customer', 40, doc.y, { width: 240 });
      doc.text(cust.name || 'Cash Customer', 315, billY + 20, { width: 240 });

      doc.y = billY + 35;
      doc.fontSize(9).font('Helvetica').fillColor(lightGray);
      const addressText = `${cust.address || ''}\n${cust.city || ''} - ${cust.pincode || ''}\n${cust.state || ''}`.trim();
      if (addressText) {
        doc.text(addressText, 40, doc.y, { width: 240 });
        doc.text(addressText, 315, billY + 35, { width: 240 });
      } else {
        doc.text('Walk-in Customer', 40, doc.y);
        doc.text('Walk-in Customer', 315, billY + 35);
      }

      doc.moveDown(0.5);
      if (cust.gstin && isGST) {
        doc.font('Helvetica-Bold').fillColor(darkGray).text('GSTIN/UIN: ', 40, doc.y, { continued: true })
           .font('Helvetica').fillColor(lightGray).text(cust.gstin);
      }
      if (cust.phone) {
        doc.font('Helvetica-Bold').fillColor(darkGray).text('Phone: ', 40, doc.y, { continued: true })
           .font('Helvetica').fillColor(lightGray).text(cust.phone);
      }

      doc.y = Math.max(doc.y, billY + 90) + 15;

      // ---- TABLE ----
      const tableTop = doc.y;
      
      // Table Header Background
      doc.rect(40, tableTop, 515, 25).fill(bgGray);
      
      const thY = tableTop + 8;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkGray);
      
      const col = isGST 
        ? { hash: 40, item: 70, hsn: 190, gst: 235, qty: 275, mrp: 310, disc: 350, rate: 400, amt: 460 }
        : { hash: 40, item: 80, qty: 250, mrp: 290, disc: 340, rate: 390, amt: 460 };

      doc.text('#', col.hash, thY);
      doc.text('Item Description', col.item, thY);
      if (isGST) {
        doc.text('HSN/SAC', col.hsn, thY, { width: 40, align: 'center' });
        doc.text('GST %', col.gst, thY, { width: 35, align: 'center' });
      }
      doc.text('Qty', col.qty, thY, { width: 30, align: 'center' });
      doc.text('MRP', col.mrp, thY, { width: 40, align: 'right' });
      doc.text('Disc', col.disc, thY, { width: 40, align: 'right' });
      doc.text('Rate', col.rate, thY, { width: 50, align: 'right' });
      doc.text('Amount (Rs)', col.amt, thY, { width: 70, align: 'right' });
      doc.y = thY + 15;

      doc.y += 18;
      
      // Table Rows
      let isEven = false;
      const items = invoice.items || [];
      
      const drawRow = (item, index, y) => {
        const textH = doc.heightOfString(item.productSnapshot?.name || 'Item', { width: isGST ? 150 : 180 });
        const rowH = Math.max(25, textH + 10);
        
        if (isEven) doc.rect(40, y - 5, 515, rowH).fill('#fafafa');
        isEven = !isEven;
        
        doc.fontSize(9).font('Helvetica').fillColor(lightGray);
        
        const mrpVal = item.productSnapshot?.mrp || item.rate;
        const mrp = Number(mrpVal).toFixed(2);
        let disc = '-';
        if (item.productSnapshot?.mrp && item.productSnapshot?.discountPrice) {
          const d = Number(item.productSnapshot.mrp) - Number(item.productSnapshot.discountPrice);
          if (d > 0) disc = d.toFixed(2);
        } else if (item.discount > 0) {
          disc = item.discount.toFixed(2);
        }

        doc.text(String(index + 1), col.hash, y);
        doc.font('Helvetica-Bold').fillColor(darkGray).text(item.productSnapshot?.name || 'Item', col.item, y, { width: isGST ? 110 : 160 });
        doc.font('Helvetica').fillColor(lightGray);
        
        if (isGST) {
          doc.text(item.productSnapshot?.hsnCode || '-', col.hsn, y, { width: 40, align: 'center' });
          const gstPercent = item.taxRate ? `${item.taxRate}%` : (item.igstRate || (item.cgstRate + item.sgstRate) || '18') + '%';
          doc.text(gstPercent, col.gst, y, { width: 35, align: 'center' });
          doc.text(String(item.quantity), col.qty, y, { width: 30, align: 'center' });
          doc.text(mrp, col.mrp, y, { width: 40, align: 'right' });
          doc.text(disc, col.disc, y, { width: 40, align: 'right' });
          doc.text(Number(item.rate).toFixed(2), col.rate, y, { width: 50, align: 'right' });
          doc.text(Number(item.taxableValue).toFixed(2), col.amt, y, { width: 70, align: 'right' });
        } else {
          doc.text(String(item.quantity), col.qty, y, { width: 30, align: 'center' });
          doc.text(mrp, col.mrp, y, { width: 40, align: 'right' });
          doc.text(disc, col.disc, y, { width: 40, align: 'right' });
          doc.text(Number(item.rate).toFixed(2), col.rate, y, { width: 50, align: 'right' });
          doc.text(Number(item.total).toFixed(2), col.amt, y, { width: 70, align: 'right' });
        }
        
        return y + rowH;
      };

      let nextY = doc.y;
      items.forEach((item, i) => {
        if (nextY > 650) {
          doc.addPage();
          nextY = 40;
          doc.rect(40, nextY, 515, 25).fill(bgGray);
          const pthY = nextY + 8;
          doc.fontSize(9).font('Helvetica-Bold').fillColor(darkGray);
          doc.text('#', col.hash, pthY);
          doc.text('Item Description', col.item, pthY);
          if (isGST) {
            doc.text('HSN/SAC', col.hsn, pthY, { width: 40, align: 'center' });
            doc.text('GST %', col.gst, pthY, { width: 35, align: 'center' });
          }
          doc.text('Qty', col.qty, pthY, { width: 30, align: 'center' });
          doc.text('MRP', col.mrp, pthY, { width: 40, align: 'right' });
          doc.text('Disc', col.disc, pthY, { width: 40, align: 'right' });
          doc.text('Rate', col.rate, pthY, { width: 50, align: 'right' });
          doc.text('Amount (Rs)', col.amt, pthY, { width: 70, align: 'right' });
          nextY += 28;
        }
        nextY = drawRow(item, i, nextY);
      });

      doc.y = nextY + 10;
      doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1).strokeColor(borderGray).stroke();
      doc.y += 20;

      // ---- FOOTER ----
      const footerY = doc.y;
      
      // Totals Box (Stretched)
      const totalBoxX = 40;
      const totalBoxW = 515;
      
      const boxHeight = isGST ? 110 : 70;
      doc.roundedRect(totalBoxX, footerY, totalBoxW, boxHeight, 5).stroke(borderGray);
      
      let ty = footerY + 12;
      const drawTotalLine = (label, val, bold = false) => {
        doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? darkGray : lightGray);
        doc.text(label, totalBoxX + 15, ty, { width: totalBoxW - 130, align: 'right' });
        doc.text(val, totalBoxX + totalBoxW - 100, ty, { width: 85, align: 'right' });
        ty += 16;
      };

      if (isGST) {
        drawTotalLine('Total Taxable Value', `Rs. ${Number(invoice.taxableAmount).toFixed(2)}`);
        if (invoice.cgstTotal > 0) drawTotalLine('CGST', `Rs. ${Number(invoice.cgstTotal).toFixed(2)}`);
        if (invoice.sgstTotal > 0) drawTotalLine('SGST', `Rs. ${Number(invoice.sgstTotal).toFixed(2)}`);
        if (invoice.igstTotal > 0) drawTotalLine('IGST', `Rs. ${Number(invoice.igstTotal).toFixed(2)}`);
      } else {
        const subtotal = invoice.items.reduce((acc, i) => acc + (i.rate * i.quantity), 0);
        drawTotalLine('Subtotal', `Rs. ${subtotal.toFixed(2)}`);
      }
      
      if (invoice.deliveryCharge > 0) drawTotalLine('Delivery', `Rs. ${Number(invoice.deliveryCharge).toFixed(2)}`);
      
      // Grand Total Row Background
      const gtY = footerY + boxHeight - 40;
      doc.rect(totalBoxX + 1, gtY, totalBoxW - 2, 40 - 1).fill(bgPurple); // -1 for rounded corners clip approx
      
      doc.fontSize(12).font('Helvetica-Bold').fillColor(brandColor);
      doc.text('Grand Total', totalBoxX + 15, gtY + 12, { width: totalBoxW - 130, align: 'right' });
      doc.fontSize(14).text(`Rs. ${Number(invoice.grandTotal).toFixed(2)}`, totalBoxX + totalBoxW - 130, gtY + 10, { width: 115, align: 'right' });

      // Amount in Words
      const numberToWords = (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        if ((num = num.toString()).length > 9) return 'Overflow';
        const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
        return str.trim();
      };
      doc.roundedRect(totalBoxX, gtY + 45, totalBoxW, 30, 5).fill(bgPurple);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(brandColor);
      doc.text(`Amount In Words: ${numberToWords(Math.round(invoice.grandTotal))}`, totalBoxX + 10, gtY + 52, { width: totalBoxW - 20, align: 'center' });

      doc.y = gtY + 90;
      doc.fontSize(7).font('Helvetica').fillColor(lightGray).text('This is a computer generated invoice and does not require physical signature.', 40, doc.y, { align: 'center', width: 515 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
