import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShoppingBag, AlertTriangle, IndianRupee,
  Activity, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import API from '../api/axios';
import { formatCurrency, formatNumber } from '../utils/format';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes] = await Promise.all([
        API.get('/dashboard'),
        API.get('/dashboard/charts?period=30')
      ]);
      setStats(statsRes.data.data);
      setCharts(chartsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const COLORS = ['#7F44C2', '#159447', '#E83E6F', '#FFB020', '#1E1E2D'];

  const StatCard = ({ title, value, subtext, icon: Icon, color, linkTo }) => (
    <div className="card p-5 hover:shadow-card-hover transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <h3 className="text-2xl font-bold text-text-primary mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-text-secondary">{subtext}</span>
        {linkTo && (
          <Link to={linkTo} className="text-primary hover:underline font-medium flex items-center gap-1">
            View <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary">Overview of your store's performance</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary flex items-center gap-2">
          <Activity size={16} /> Refresh
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats?.totalSales)} 
          subtext="GST Exclusive"
          icon={IndianRupee} 
          color="bg-primary-lighter text-primary"
          linkTo="/reports"
        />
        <StatCard 
          title="Today's Sales" 
          value={formatCurrency(stats?.todaySales)} 
          subtext={`${stats?.todayOrders} orders today`}
          icon={TrendingUp} 
          color="bg-green-100 text-green-700"
          linkTo="/reports?period=today"
        />
        <StatCard 
          title="Active Orders" 
          value={formatNumber(stats?.newOrders)} 
          subtext="Pending processing"
          icon={ShoppingBag} 
          color="bg-blue-100 text-blue-700"
          linkTo="/orders"
        />
        <StatCard 
          title="Inventory Alerts" 
          value={formatNumber(stats?.lowStock + stats?.outOfStock)} 
          subtext={`${stats?.outOfStock} out of stock`}
          icon={AlertTriangle} 
          color="bg-red-100 text-red-700"
          linkTo="/stock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-lg font-bold text-text-primary mb-6">Sales Overview (Last 30 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.salesByDate || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7F44C2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7F44C2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDEDED" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                  labelStyle={{ color: '#71717A', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="totalSales" stroke="#7F44C2" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="card p-5">
          <h3 className="text-lg font-bold text-text-primary mb-6">Payment Methods</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.paymentBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="_id"
                >
                  {(charts?.paymentBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="capitalize text-text-secondary font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Pending Collections</span>
              <span className="font-bold text-discount">{stats?.pendingPayments} Orders</span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card p-5 lg:col-span-3">
          <h3 className="text-lg font-bold text-text-primary mb-6">Top Selling Products</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.productPerformance || []} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EDEDED" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 12, fill: '#18181B' }} />
                <Tooltip 
                  cursor={{ fill: '#FAFAFA' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="totalRevenue" fill="#7F44C2" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
