const ExcelJS = require('exceljs');

/**
 * Export Helper - CSV and Excel exports
 */

const exportToCSV = (data, fields) => {
  const { Parser } = require('json2csv');
  const parser = new Parser({ fields });
  return parser.parse(data);
};

const exportToExcel = async (data, columns, sheetName = 'Report') => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }));

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7F44C2' },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  data.forEach((row) => {
    sheet.addRow(row);
  });

  return await workbook.xlsx.writeBuffer();
};

module.exports = { exportToCSV, exportToExcel };
