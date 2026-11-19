import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PriorityBadge, StatusBadge, CategoryIcon } from '../../components/StatusBadge';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  UserCheck, 
  Building, 
  Wrench, 
  ExternalLink,
  Loader2,
  X
} from 'lucide-react';

export const AllComplaints = () => {
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const [compRes, deptRes] = await api.all([
        api.get('/complaints'),
        api.get('/departments')
      ]);
      setComplaints(compRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When selectedDeptId changes in modal, load that department's staff members
  useEffect(() => {
    if (selectedDeptId) {
      api.get(`/departments/${selectedDeptId}/staff`)
        .then(res => setStaffList(res.data))
        .catch(() => setStaffList([]));
    } else {
      setStaffList([]);
    }
  }, [selectedDeptId]);

  const openAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedDeptId(complaint.department_id ? complaint.department_id.toString() : '');
    setSelectedStaffId(complaint.assigned_staff_id ? complaint.assigned_staff_id.toString() : '');
    setSelectedPriority(complaint.priority || 'Medium');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsAssigning(true);

    try {
      await api.post(`/admin/assign-complaint/${selectedComplaint.id}`, {
        department_id: selectedDeptId ? parseInt(selectedDeptId) : undefined,
        assigned_staff_id: selectedStaffId ? parseInt(selectedStaffId) : undefined,
        priority: selectedPriority || undefined
      });
      success(`Complaint #${selectedComplaint.id} assigned successfully!`);
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      error("Assignment failed");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete complaint #${id}?`)) return;
    try {
      await api.delete(`/complaints/${id}`);
      success(`Complaint #${id} deleted.`);
      fetchData();
    } catch (err) {
      error("Could not delete complaint");
    }
  };

  const handleExportCSV = () => {
    window.open('/api/reports/export?format=csv', '_blank');
  };

  const filtered = complaints.filter((c) => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = c.title.toLowerCase().includes(q) ||
                    c.description.toLowerCase().includes(q) ||
                    (c.student_name && c.student_name.toLowerCase().includes(q)) ||
                    (c.building_name && c.building_name.toLowerCase().includes(q)) ||
                    c.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Complaint Directory</h1>
          <p className="text-xs text-slate-500">Comprehensive database of all university maintenance reports and assignments</p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-brand-600" /> Export CSV Report
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, location, student..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REOPENED">Reopened</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Internet and IT">Internet & IT</option>
            <option value="Civil Maintenance">Civil</option>
            <option value="Furniture">Furniture</option>
            <option value="Security">Security</option>
          </select>
        </div>
      </div>

      {/* Main Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Ticket & Location</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assigned Staff</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">Loading complaints database...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">No complaints matching your filters.</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>#{c.id}</span>
                        <Link to={`/complaints/${c.id}`} className="hover:text-brand-600 truncate">
                          {c.title}
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        {c.building_name} ({c.location})
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <CategoryIcon category={c.category} />
                        {c.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={c.priority} />
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {c.assigned_staff_name || <span className="text-amber-600 font-normal">Unassigned</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.department_name}</div>
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openAssignModal(c)}
                          title="Assign Staff"
                          className="p-1.5 rounded-lg border border-slate-200 text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/complaints/${c.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          title="Delete Ticket"
                          className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Ticket #{selectedComplaint.id}
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-sm">{selectedComplaint.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Route Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Staff Technician
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  disabled={!selectedDeptId || staffList.length === 0}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  <option value="">{staffList.length === 0 ? "No technicians found in department" : "Select Technician..."}</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adjust Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs flex items-center gap-2"
                >
                  {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
