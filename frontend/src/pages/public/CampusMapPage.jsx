import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CampusMap } from '../../components/CampusMap';
import { Layers, MapPin, Building } from 'lucide-react';

export const CampusMapPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, bRes] = await api.all([
          api.get('/complaints'),
          api.get('/buildings')
        ]);
        setComplaints(cRes.data);
        setBuildings(bRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">University Campus Facility Map</h1>
        <p className="text-xs text-slate-500">Live geospatial view of reported issues across campus buildings</p>
      </div>

      <CampusMap complaints={complaints} buildings={buildings} height="650px" />
    </div>
  );
};
