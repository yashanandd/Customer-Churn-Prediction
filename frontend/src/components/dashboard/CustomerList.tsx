import React, { useEffect, useState } from 'react';
import { getCustomers } from '../../services/api';
import { Search, ChevronLeft, ChevronRight, Filter, AlertTriangle, ShieldCheck, HelpCircle, Download } from 'lucide-react';

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filter and pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [riskSegment, setRiskSegment] = useState('');
  const [churnStatus, setChurnStatus] = useState('');

  const fetchCustomersList = async () => {
    setLoading(true);
    try {
      const data = await getCustomers(page, limit, search, riskSegment, churnStatus);
      setCustomers(data.customers);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch customer risk directories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, [page, riskSegment, churnStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomersList();
  };

  const handleResetFilters = () => {
    setSearch('');
    setRiskSegment('');
    setChurnStatus('');
    setPage(1);
    // Fetch immediately by clearing params
    setTimeout(() => {
      fetchCustomersList();
    }, 50);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const data = await getCustomers(1, 100000, search, riskSegment, churnStatus);
      const list = data.customers;
      if (list.length === 0) {
        alert("No records to export.");
        return;
      }
      
      const headers = ["Customer ID", "Tenure (Months)", "Contract Type", "Monthly Charges ($)", "Total Charges ($)", "Churn Probability", "Risk Segment", "Actual Churn"];
      const rows = list.map((c: any) => [
        c.id,
        c.tenure,
        c.contract,
        c.monthly_charges,
        c.total_charges,
        `${Math.round(c.probability * 100)}%`,
        c.risk_segment,
        c.actual_churn || "-"
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) => row.map(val => `"${val}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `churn_risk_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export dataset.");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Customer Churn Directory</h2>
          <p className="text-gray-400 text-sm">Analyze individual subscriber accounts and risk factors.</p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={exporting || customers.length === 0}
            className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            {exporting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export CSV Report
          </button>

          {/* Statistics count indicator */}
          <div className="bg-surface border border-white/5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-300">
            Total Records matched: <span className="text-primary font-bold">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer ID (e.g. 7590-VHVEG)..."
              className="form-input pl-10 pr-4 text-sm w-full py-2.5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary py-2 px-5 text-sm">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="form-input py-2 px-3 text-sm min-w-[130px] bg-background"
              value={riskSegment}
              onChange={(e) => { setRiskSegment(e.target.value); setPage(1); }}
            >
              <option value="">All Risks</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          <select
            className="form-input py-2 px-3 text-sm min-w-[150px] bg-background"
            value={churnStatus}
            onChange={(e) => { setChurnStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Yes">Churned (Yes)</option>
            <option value="No">Retained (No)</option>
          </select>

          {(search || riskSegment || churnStatus) && (
            <button
              onClick={handleResetFilters}
              className="btn-secondary py-2 px-4 text-xs font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-surface/20 border border-white/5 rounded-2xl min-h-[300px]">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm">Calculating subscriber risk indicators...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-center font-medium">
          {error}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center p-20 bg-surface/10 border border-white/5 rounded-2xl">
          <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Customers Matched</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Try adjusting your search query or selecting a different segment combination.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-surface/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-surface/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Customer ID</th>
                  <th className="py-4 px-6">Tenure</th>
                  <th className="py-4 px-6">Contract</th>
                  <th className="py-4 px-6">Monthly Charges</th>
                  <th className="py-4 px-6">Total Charges</th>
                  <th className="py-4 px-6 text-center">Churn Probability</th>
                  <th className="py-4 px-6 text-center">Risk Segment</th>
                  <th className="py-4 px-6 text-center">Actual Churn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300 text-sm">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-white">{cust.id}</td>
                    <td className="py-4 px-6">{cust.tenure} months</td>
                    <td className="py-4 px-6 text-xs font-medium text-gray-400">
                      <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        {cust.contract}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold">${cust.monthly_charges.toFixed(2)}</td>
                    <td className="py-4 px-6 font-semibold">${cust.total_charges.toFixed(2)}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-white/5 rounded-full h-1.5 overflow-hidden shrink-0 border border-white/5">
                          <div 
                            className={`h-full rounded-full ${
                              cust.probability >= 0.7 ? 'bg-danger' : cust.probability >= 0.3 ? 'bg-warning' : 'bg-secondary'
                            }`}
                            style={{ width: `${cust.probability * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold w-10 text-right">
                          {Math.round(cust.probability * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        cust.risk_segment === 'High' 
                          ? 'bg-danger/10 text-danger border border-danger/20' 
                          : cust.risk_segment === 'Medium' 
                            ? 'bg-warning/10 text-warning border border-warning/20' 
                            : 'bg-secondary/10 text-secondary border border-secondary/20'
                      }`}>
                        {cust.risk_segment === 'High' ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        {cust.risk_segment}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {cust.actual_churn ? (
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                          cust.actual_churn === 'Yes' ? 'text-danger bg-danger/10' : 'text-secondary bg-secondary/10'
                        }`}>
                          {cust.actual_churn}
                        </span>
                      ) : (
                        <span className="text-gray-500 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 glass-card">
              <span className="text-gray-400 text-xs md:text-sm">
                Showing <span className="text-white font-semibold">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="text-white font-semibold">
                  {Math.min(page * limit, total)}
                </span>{' '}
                of <span className="text-white font-semibold">{total.toLocaleString()}</span> customers
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {/* Visual indicator of page */}
                <div className="flex items-center px-4 text-sm font-semibold text-gray-300 border border-white/5 rounded-lg bg-surface/30">
                  Page {page} of {totalPages}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="btn-secondary p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerList;
