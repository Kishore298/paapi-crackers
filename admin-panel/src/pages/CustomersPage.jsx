import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency, formatDate } from '../utils/format';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/customers');
      setCustomers(data.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Customers</h1>
        <p className="text-sm text-text-secondary">View customer database and their value</p>
      </div>

      <div className="card p-4">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name, Phone, or Email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer Details</th>
                  <th>Contact</th>
                  <th>Total Orders</th>
                  <th>Total Value</th>
                  <th>Joined On</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-lighter text-primary flex items-center justify-center font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{customer.name}</p>
                          {customer.gstin && <span className="badge bg-gray-100 text-[10px] mt-0.5">B2B: {customer.gstin}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm">{customer.phone}</p>
                      <p className="text-xs text-text-secondary">{customer.email || '-'}</p>
                    </td>
                    <td>
                      <span className="flex items-center gap-1">
                        <ShoppingBag size={14} className="text-text-secondary"/>
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="font-bold text-primary">{formatCurrency(customer.totalSpending || 0)}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 text-text-secondary">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
