import React, { useState, useEffect } from 'react';
import { Download, Calendar, IndianRupee, ShoppingBag, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency, formatNumber, formatDate } from '../utils/format';
import { utils, writeFile } from 'xlsx';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
        setReportData(data.data);
      } catch (error) {
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [startDate, endDate]);

  const handleExportExcel = () => {
    if (!reportData || reportData.dailySales.length === 0) return toast.error('No data to export');

    const wb = utils.book_new();
    
    // Daily Sales Sheet
    const salesWs = utils.json_to_sheet(reportData.dailySales.map(day => ({
      Date: day._id,
      Orders: day.orders,
      'Revenue (₹)': day.revenue
    })));
    utils.book_append_sheet(wb, salesWs, "Daily Sales");

    // Product Sales Sheet
    const prodWs = utils.json_to_sheet(reportData.productSales.map(prod => ({
      Product: prod.name,
      SKU: prod.sku,
      'Quantity Sold': prod.quantitySold,
      'Revenue Generated (₹)': prod.revenueGenerated
    })));
    utils.book_append_sheet(wb, prodWs, "Product Performance");

    writeFile(wb, `Sales_Report_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sales Reports</h1>
          <p className="text-sm text-text-secondary">Analyze your business performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl p-1">
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="text-sm px-2 py-1 outline-none text-text-primary bg-transparent"
            />
            <span className="text-text-secondary text-sm">to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="text-sm px-2 py-1 outline-none text-text-primary bg-transparent"
            />
          </div>
          <button onClick={handleExportExcel} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
            <Download size={16}/> Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-text-secondary">Total Revenue</p>
                <div className="p-2 bg-primary-lighter text-primary rounded-lg"><IndianRupee size={18}/></div>
              </div>
              <h3 className="text-2xl font-bold text-text-primary">{formatCurrency(reportData?.summary?.totalRevenue)}</h3>
              <p className="text-xs text-text-secondary mt-1">In selected period</p>
            </div>
            
            <div className="card p-5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-text-secondary">Total Orders</p>
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><ShoppingBag size={18}/></div>
              </div>
              <h3 className="text-2xl font-bold text-text-primary">{formatNumber(reportData?.summary?.totalOrders)}</h3>
              <p className="text-xs text-text-secondary mt-1">Successfully completed</p>
            </div>
            
            <div className="card p-5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-text-secondary">Items Sold</p>
                <div className="p-2 bg-green-100 text-green-700 rounded-lg"><Package size={18}/></div>
              </div>
              <h3 className="text-2xl font-bold text-text-primary">{formatNumber(reportData?.summary?.totalItemsSold)}</h3>
              <p className="text-xs text-text-secondary mt-1">Total units dispatched</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales Table */}
            <div className="card p-5">
              <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary"/> Daily Breakdown</h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="table">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr>
                      <th>Date</th>
                      <th>Orders</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.dailySales?.map(day => (
                      <tr key={day._id}>
                        <td className="font-medium text-text-primary">{formatDate(day._id)}</td>
                        <td>{day.orders}</td>
                        <td className="text-right font-bold text-text-primary">{formatCurrency(day.revenue)}</td>
                      </tr>
                    ))}
                    {reportData?.dailySales?.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-text-secondary">No data in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Sales Table */}
            <div className="card p-5">
              <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2"><Package size={18} className="text-primary"/> Top Products</h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="table">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr>
                      <th>Product</th>
                      <th>Qty Sold</th>
                      <th className="text-right">Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.productSales?.map(prod => (
                      <tr key={prod.productId}>
                        <td>
                          <p className="font-medium text-text-primary text-sm line-clamp-1">{prod.name}</p>
                          <p className="text-xs text-text-secondary">{prod.sku}</p>
                        </td>
                        <td>{prod.quantitySold}</td>
                        <td className="text-right font-bold text-text-primary">{formatCurrency(prod.revenueGenerated)}</td>
                      </tr>
                    ))}
                    {reportData?.productSales?.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-text-secondary">No data in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
