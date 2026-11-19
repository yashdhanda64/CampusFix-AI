import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { AIAnalysisCard } from '../../components/AIAnalysisCard';
import { DuplicateWarningModal } from '../../components/DuplicateWarningModal';
import { 
  Sparkles, 
  UploadCloud, 
  Image as ImageIcon, 
  MapPin, 
  Building, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react';

export const CreateComplaint = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  const [buildings, setBuildings] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [buildingId, setBuildingId] = useState('');
  
  // Optional category/priority override
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');

  // Media
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // AI & Duplicates
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await api.get('/buildings');
        setBuildings(res.data);
        if (res.data.length > 0) {
          setBuildingId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to fetch buildings", err);
      }
    };
    fetchBuildings();
  }, []);

  // Handle Image Upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingImage(true);

    try {
      const res = await api.post('/ai/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(res.data.url);
      success("Image uploaded successfully");
    } catch (err) {
      error("Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
  };

  // Run AI Pre-Analysis
  const handleRunAIAnalysis = async () => {
    if (!title || !description) {
      warning("Please provide title and description first");
      return;
    }
    setIsAnalyzing(true);
    try {
      const selectedBuilding = buildings.find(b => b.id.toString() === buildingId);
      const res = await api.post('/ai/analyze', {
        title,
        description,
        location: `${selectedBuilding?.building_name || ''} - ${location}`,
        building_id: buildingId ? parseInt(buildingId) : undefined
      });
      setAiAnalysis(res.data);
      success("AI Analysis generated!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit flow
  const handleCheckAndSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!title || !description || !location || !buildingId) {
      error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    // 1. Check for duplicates first
    try {
      const dupRes = await api.post('/ai/detect-duplicates', {
        title,
        description,
        building_id: parseInt(buildingId),
        category: category || undefined
      });

      if (dupRes.data.is_duplicate_suspected && dupRes.data.matches.length > 0) {
        setDuplicateMatches(dupRes.data.matches);
        setShowDuplicateModal(true);
        setIsSubmitting(false);
        return;
      }
    } catch (dupErr) {
      console.warn("Duplicate check error:", dupErr);
    }

    // 2. If no duplicates, submit directly
    await executeSubmission();
  };

  const executeSubmission = async () => {
    setIsSubmitting(true);
    setShowDuplicateModal(false);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        building_id: parseInt(buildingId),
        category: category || undefined,
        priority: priority || undefined,
        image_url: imageUrl || undefined
      };

      const res = await api.post('/complaints', payload);
      
      // Celebrate with confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      success("Complaint filed successfully! AI has routed your ticket.");
      navigate(`/complaints/${res.data.id}`);
    } catch (err) {
      error(err.response?.data?.detail || "Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ai-50 border border-ai-200 text-ai-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-ai-600 animate-spin-slow" />
          <span>Automated Facility Triage</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Report a Campus Issue</h1>
        <p className="text-xs text-slate-500">
          Describe the problem, upload photos, or speak in Hindi/English. Our AI will classify and route it to the right team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleCheckAndSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Electric spark from switchboard near Lab 204"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Building & Specific Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Campus Building <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={buildingId}
                    onChange={(e) => setBuildingId(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    required
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.building_name} ({b.block_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Room / Floor / Area <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. 2nd Floor, Room 204"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Voice Recorder Component */}
            <div>
              <VoiceRecorder
                onTranscriptionComplete={(text) => {
                  setDescription((prev) => (prev ? `${prev} ${text}` : text));
                  success("Voice transcript inserted into description!");
                }}
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing || !title}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-ai-700 hover:text-ai-800 disabled:opacity-40"
                >
                  <Sparkles className="w-3 h-3 text-ai-600" />
                  {isAnalyzing ? "Analyzing..." : "Preview AI Diagnosis"}
                </button>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is broken, safety hazards, or affected students. You can also use the voice recorder above."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all leading-relaxed"
                required
              />
            </div>

            {/* Image Upload Drag/Drop */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Upload Photo / Proof (Optional)
              </label>

              {!imagePreview ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Click to upload photo of the issue</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or WEBP up to 25MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48 flex items-center justify-center">
                  <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading image...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI Analyzing & Routing Ticket...
                  </>
                ) : (
                  <>
                    Submit Complaint with AI Triage
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: AI Preview & Help */}
        <div className="space-y-4">
          {aiAnalysis ? (
            <AIAnalysisCard analysis={aiAnalysis} />
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-ai-50 via-white to-brand-50/40 border border-ai-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-ai-700">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">AI Intelligent Triage</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                As soon as you submit, Gemini AI automatically:
              </p>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>Detects category (Electrical, Plumbing, IT, etc.)</li>
                <li>Assigns dynamic SLA (4h for Critical, 24h for High)</li>
                <li>Identifies potential safety risks & hazards</li>
                <li>Prevents repetitive duplicate submissions</li>
              </ul>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-500">
                Tip: You can click "Preview AI Diagnosis" anytime while typing to test the classification.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={showDuplicateModal}
        matches={duplicateMatches}
        onClose={() => setShowDuplicateModal(false)}
        onProceed={executeSubmission}
      />
    </div>
  );
};
