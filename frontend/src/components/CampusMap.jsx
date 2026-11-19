import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { PriorityBadge, StatusBadge, CategoryIcon } from './StatusBadge';
import { Layers, Filter, Eye, AlertCircle, Building, CheckCircle2 } from 'lucide-react';

// Custom SVG Icons for Leaflet markers
const createPinIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        background-color: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const iconCritical = createPinIcon('#e11d48'); // Rose-600
const iconHigh = createPinIcon('#f59e0b'); // Amber-500
const iconMedium = createPinIcon('#2563eb'); // Blue-600
const iconLow = createPinIcon('#64748b'); // Slate-500
const iconResolved = createPinIcon('#10b981'); // Emerald-500
const iconBuilding = createPinIcon('#475569'); // Navy-slate

export const CampusMap = ({ complaints = [], buildings = [], height = "500px", onSelectComplaint }) => {
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showBuildingsOnly, setShowBuildingsOnly] = useState(false);

  // Default campus center coordinates (Science Block, New Delhi campus coordinate or standard)
  const defaultCenter = [28.5458, 77.1938];

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (filterPriority !== 'All' && c.priority !== filterPriority) return false;
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;
      if (filterCategory !== 'All' && c.category !== filterCategory) return false;
      return true;
    });
  }, [complaints, filterPriority, filterStatus, filterCategory]);

  const getMarkerIcon = (complaint) => {
    if (complaint.status === 'RESOLVED') return iconResolved;
    if (complaint.priority === 'Critical') return iconCritical;
    if (complaint.priority === 'High') return iconHigh;
    if (complaint.priority === 'Medium') return iconMedium;
    return iconLow;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Map Filter Controls Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-600 text-white">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Interactive Campus Facility Map</h3>
            <p className="text-xs text-slate-500">Live geospatial clustering of reported campus incidents</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Priority */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Toggle */}
          <button
            type="button"
            onClick={() => setShowBuildingsOnly(!showBuildingsOnly)}
            className={`px-3 py-1.5 rounded-xl font-medium border transition-colors flex items-center gap-1.5 ${
              showBuildingsOnly
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            {showBuildingsOnly ? 'Show All Issues' : 'Show Buildings'}
          </button>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-4 text-xs flex-wrap">
        <span className="font-semibold text-slate-600">Legend:</span>
        <span className="flex items-center gap-1.5 text-rose-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Critical ({complaints.filter(c => c.priority === 'Critical').length})
        </span>
        <span className="flex items-center gap-1.5 text-amber-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High ({complaints.filter(c => c.priority === 'High').length})
        </span>
        <span className="flex items-center gap-1.5 text-blue-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Medium/Low
        </span>
        <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Resolved ({complaints.filter(c => c.status === 'RESOLVED').length})
        </span>
        <span className="ml-auto text-slate-500 font-medium">
          Showing {filteredComplaints.length} markers
        </span>
      </div>

      {/* Map Frame */}
      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={defaultCenter}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render Campus Buildings circles */}
          {buildings.map((b) => (
            <React.Fragment key={`bld-${b.id}`}>
              <Circle
                center={[b.latitude, b.longitude]}
                radius={35}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#60a5fa',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              />
              {showBuildingsOnly && (
                <Marker position={[b.latitude, b.longitude]} icon={iconBuilding}>
                  <Popup>
                    <div className="p-1">
                      <div className="font-bold text-sm text-slate-900">{b.building_name}</div>
                      <div className="text-xs text-slate-500">Block Code: {b.block_code}</div>
                      <p className="text-xs text-slate-600 mt-1">{b.description}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          ))}

          {/* Render Complaint Markers */}
          {!showBuildingsOnly && filteredComplaints.map((c) => {
            if (!c.latitude || !c.longitude) return null;
            return (
              <Marker
                key={`comp-${c.id}`}
                position={[c.latitude, c.longitude]}
                icon={getMarkerIcon(c)}
              >
                <Popup>
                  <div className="p-2 space-y-2 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="font-bold text-sm text-slate-900 leading-snug">
                      #{c.id}: {c.title}
                    </div>
                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {c.building_name} ({c.location})
                    </div>
                    {c.ai_summary && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                        "{c.ai_summary}"
                      </p>
                    )}
                    <div className="pt-1 flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{c.category}</span>
                      <a
                        href={`/complaints/${c.id}`}
                        className="text-brand-600 hover:text-brand-700 font-bold hover:underline"
                      >
                        Inspect Details &rarr;
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
