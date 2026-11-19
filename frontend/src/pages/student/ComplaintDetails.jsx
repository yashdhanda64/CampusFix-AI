import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PriorityBadge, StatusBadge, CategoryIcon } from '../../components/StatusBadge';
import { AIAnalysisCard } from '../../components/AIAnalysisCard';
import { 
  Building, 
  MapPin, 
  Calendar, 
  User, 
  Wrench, 
  Clock, 
  RotateCcw, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud, 
  Send,
  Loader2,
  ArrowLeft
} from 'lucide-react';

export const ComplaintDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status update modal state (Staff & Admin)
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [statusNote, setStatusNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImageUrl, setResolutionImageUrl] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Student Reopen state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Student Feedback Rating state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
      if (res.data.status) {
        setNewStatus(res.data.status === 'PENDING' ? 'IN_PROGRESS' : 'RESOLVED');
      }
    } catch (err) {
      error("Failed to load complaint details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Handle Staff/Admin status update
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/complaints/${id}/status`, {
        status: newStatus,
        note: statusNote,
        resolution_notes: newStatus === 'RESOLVED' ? resolutionNotes : undefined,
        resolution_image_url: newStatus === 'RESOLVED' ? resolutionImageUrl : undefined
      });
      success(`Complaint status updated to ${newStatus}`);
      setStatusNote('');
      fetchDetails();
    } catch (err) {
      error(err.response?.data?.detail || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Student Reopen
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason) {
      warning("Please provide a reason for reopening");
      return;
    }
    try {
      await api.patch(`/complaints/${id}/status`, {
        status: 'REOPENED',
        note: `Student reopened ticket: ${reopenReason}`
      });
      success("Ticket reopened for department review.");
      setShowReopenModal(false);
      setReopenReason('');
      fetchDetails();
    } catch (err) {
      error(err.response?.data?.detail || "Could not reopen ticket");
    }
  };

  // Handle Feedback Rating
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      await api.post(`/feedback/${id}`, {
        rating,
        comment: feedbackComment
      });
      success("Thank you for your feedback rating!");
      fetchDetails();
    } catch (err) {
      error("Feedback submission failed");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading ticket information...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="p-12 text-center text-xs text-rose-500 font-bold">
        Complaint #{id} not found.
      </div>
    );
  }

  const isStaffOrAdmin = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const isOwner = user?.id === complaint.student_id;
  const isResolved = complaint.status === 'RESOLVED';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={user?.role === 'ADMIN' ? '/admin/complaints' : user?.role === 'STAFF' ? '/department/complaints' : '/my-complaints'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Complaints
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400">TICKET #{complaint.id}</span>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
            {complaint.is_sla_violated && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                SLA Breached
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Reported on {new Date(complaint.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
          {complaint.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
          {complaint.description}
        </p>

        {/* Location & Personnel Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-400" />
              {complaint.building_name}
            </div>
            <div className="text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {complaint.location}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CategoryIcon category={complaint.category} />
              {complaint.category}
            </div>
            <div className="text-slate-500 mt-0.5">{complaint.department_name || 'General Administration'}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Personnel</div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              Reported by: {complaint.student_name}
            </div>
            <div className="text-slate-500 mt-0.5 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-slate-400" />
              Assigned: {complaint.assigned_staff_name || 'Unassigned'}
            </div>
          </div>
        </div>

        {/* Uploaded photo if present */}
        {complaint.image_url && (
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Attached Problem Photo:</div>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-72 flex items-center justify-center">
              <img src={complaint.image_url} alt="Problem Photo" className="max-h-72 object-contain" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timeline & Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Resolution Card if resolved */}
          {isResolved && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Resolved on {complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleDateString() : 'Recently'}
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowReopenModal(true)}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-600" /> Reopen Ticket
                  </button>
                )}
              </div>

              {complaint.resolution_notes && (
                <div className="text-xs text-emerald-900 leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-100">
                  <span className="font-bold block mb-0.5">Technician Resolution Note:</span>
                  {complaint.resolution_notes}
                </div>
              )}

              {/* Resolution Image */}
              {complaint.resolution_image_url && (
                <div className="rounded-xl overflow-hidden border border-emerald-200 bg-white max-h-56 flex items-center justify-center">
                  <img src={complaint.resolution_image_url} alt="Resolution Proof" className="max-h-56 object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Student Feedback section if resolved */}
          {isResolved && isOwner && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Rate Your Resolution Experience
              </h3>

              {complaint.feedback ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= complaint.feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{complaint.feedback.rating} / 5 Stars</span>
                  </div>
                  {complaint.feedback.comment && (
                    <p className="text-xs text-slate-600 italic">"{complaint.feedback.comment}"</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${num <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-slate-500 ml-2">({rating} Stars)</span>
                  </div>

                  <input
                    type="text"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Was the problem fixed properly? Any comments..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />

                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Rating
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Staff / Admin Status Update Action Form */}
          {isStaffOrAdmin && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Staff & Technician Action Panel
                </h3>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Update Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="IN_PROGRESS">Mark In Progress</option>
                      <option value="RESOLVED">Mark Resolved</option>
                      <option value="REJECTED">Close as Duplicate / Invalid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Update Note</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g. Electrician arrived at Lab 204"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {newStatus === 'RESOLVED' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                    <label className="block text-[11px] font-bold text-emerald-900">
                      Resolution Notes (Required for ticket signoff)
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="What repairs were conducted? e.g. Replaced faulty 16A circuit breaker and tested voltage."
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors flex items-center gap-2"
                >
                  {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Apply Status Update
                </button>
              </form>
            </div>
          )}

          {/* Timeline Audit Trail */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Audit Timeline & Activity History
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {complaint.updates && complaint.updates.length > 0 ? (
                complaint.updates.map((u) => (
                  <div key={u.id} className="relative group">
                    <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-brand-600 ring-4 ring-white"></span>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-800">
                        {u.new_status} &bull; <span className="font-normal text-slate-500">{u.actor_name} ({u.actor_role || 'System'})</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(u.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {u.note && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {u.note}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No timeline updates recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Gemini AI Card & Duplicates */}
        <div className="space-y-4">
          <AIAnalysisCard analysis={complaint.ai_analysis} />

          {/* Duplicates if matched */}
          {complaint.duplicate_matches && complaint.duplicate_matches.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Cross-Referenced Similar Tickets
              </div>
              <div className="space-y-2">
                {complaint.duplicate_matches.map((dm) => (
                  <div key={dm.complaint_id} className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100 text-xs">
                    <div className="font-semibold text-slate-800 truncate">
                      #{dm.complaint_id}: {dm.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-800 mt-1">
                      <span>{Math.round(dm.similarity_score * 100)}% Match</span>
                      <Link to={`/complaints/${dm.complaint_id}`} className="font-bold underline hover:text-amber-950">
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reopen Unresolved Ticket</h3>
            <p className="text-xs text-slate-500">
              Please explain why the issue is still not resolved so the technician can address it.
            </p>
            <textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. The leak started again when water was turned on this morning..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopenSubmit}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
              >
                Confirm Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
