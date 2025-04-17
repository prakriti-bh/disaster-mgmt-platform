'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Chip, Stack, IconButton, Tooltip } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Add as ZoomInIcon, Remove as ZoomOutIcon, MyLocation } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import ResourceMarker from './ResourceMarker';
import ReportMarker from './ReportMarker';

function LocationUpdater({ position }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [map, position]);
  
  return null;
}

function MapControls({ onZoomIn, onZoomOut, onLocate }) {
  const { t } = useTranslation();
  
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 10,
        top: 10,
        zIndex: 1000,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
      }}
      role="toolbar"
      aria-label={t('map.controls')}
    >
      <Tooltip title={t('map.zoomIn')} placement="right">
        <IconButton onClick={onZoomIn} aria-label={t('map.zoomIn')}>
          <ZoomInIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('map.zoomOut')} placement="right">
        <IconButton onClick={onZoomOut} aria-label={t('map.zoomOut')}>
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('map.myLocation')} placement="right">
        <IconButton onClick={onLocate} aria-label={t('map.myLocation')}>
          <MyLocation />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default function ResourceMap() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const resources = useSelector(state => state.resources.items);
  const reports = useSelector(state => state.reports.items);
  const [position, setPosition] = useState(null);
  const [map, setMap] = useState(null);
  const [filters, setFilters] = useState({
    resourceType: 'all',
    status: 'all',
  });
  const [mapLayers, setMapLayers] = useState({
    resources: true,
    reports: true,
  });

  // Fix Leaflet icon issue
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/images/marker-icon-2x.png',
      iconUrl: '/images/marker-icon.png',
      shadowUrl: '/images/marker-shadow.png',
    });
  }, []);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchResources());
    dispatch(fetchReports());
  }, [dispatch]);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setPosition([newPos.lat, newPos.lng]);
          map?.flyTo([newPos.lat, newPos.lng], 13);
        },
        () => {
          // Default to Bhubaneswar coordinates if geolocation fails
          const defaultPos = { lat: 20.296059, lng: 85.824539 };
          setPosition([defaultPos.lat, defaultPos.lng]);
        },
        { enableHighAccuracy: true }
      );
    } else {
      // Default to Bhubaneswar coordinates
      const defaultPos = { lat: 20.296059, lng: 85.824539 };
      setPosition([defaultPos.lat, defaultPos.lng]);
    }
  }, [map]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  const handleLayerToggle = (layer) => {
    setMapLayers({
      ...mapLayers,
      [layer]: !mapLayers[layer],
    });
  };

  const handleZoomIn = () => {
    map?.zoomIn();
  };

  const handleZoomOut = () => {
    map?.zoomOut();
  };

  // Memoize filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      if (filters.resourceType !== 'all' && resource.category !== filters.resourceType) return false;
      if (filters.status !== 'all' && resource.operationalStatus !== filters.status) return false;
      return true;
    });
  }, [resources, filters]);

  if (!position) return <Typography>{t('common.loading')}</Typography>;

  return (
    <Box sx={{ height: '70vh', width: '100%', position: 'relative' }}>
      <Box 
        sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
        role="complementary"
        aria-label={t('map.filters')}
      >
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('map.filters')}
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="resource-type-label">{t('map.resourceType')}</InputLabel>
            <Select
              labelId="resource-type-label"
              id="resource-type"
              name="resourceType"
              value={filters.resourceType}
              label={t('map.resourceType')}
              onChange={handleFilterChange}
              aria-label={t('map.selectResourceType')}
            >
              <MenuItem value="all">{t('map.allResources')}</MenuItem>
              <MenuItem value="shelter">{t('resources.shelter')}</MenuItem>
              <MenuItem value="hospital">{t('resources.hospital')}</MenuItem>
              <MenuItem value="pharmacy">{t('resources.pharmacy')}</MenuItem>
              <MenuItem value="food">{t('resources.food')}</MenuItem>
              <MenuItem value="water">{t('resources.water')}</MenuItem>
              <MenuItem value="fuel">{t('resources.fuel')}</MenuItem>
              <MenuItem value="atm">{t('resources.atm')}</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="status-label">{t('map.status')}</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={filters.status}
              label={t('map.status')}
              onChange={handleFilterChange}
              aria-label={t('map.selectStatus')}
            >
              <MenuItem value="all">{t('map.allStatuses')}</MenuItem>
              <MenuItem value="operational">{t('status.operational')}</MenuItem>
              <MenuItem value="limited">{t('status.limited')}</MenuItem>
              <MenuItem value="closed">{t('status.closed')}</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>
            {t('map.layers')}
          </Typography>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip 
              label={t('map.resources')}
              color={mapLayers.resources ? 'primary' : 'default'}
              onClick={() => handleLayerToggle('resources')}
              onKeyPress={(e) => e.key === 'Enter' && handleLayerToggle('resources')}
              size="small"
              role="switch"
              aria-checked={mapLayers.resources}
              tabIndex={0}
            />
            <Chip 
              label={t('map.reports')}
              color={mapLayers.reports ? 'primary' : 'default'}
              onClick={() => handleLayerToggle('reports')}
              onKeyPress={(e) => e.key === 'Enter' && handleLayerToggle('reports')}
              size="small"
              role="switch"
              aria-checked={mapLayers.reports}
              tabIndex={0}
            />
          </Stack>
        </Paper>
      </Box>

      <MapControls 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={getCurrentLocation}
      />
      
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
        role="application"
        aria-label={t('map.mainMap')}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationUpdater position={position} />
        
        {/* User's location */}
        <Marker 
          position={position}
          role="img"
          aria-label={t('map.yourLocation')}
        >
          <Popup>{t('map.yourLocation')}</Popup>
        </Marker>
        
        {/* Resource markers */}
        {mapLayers.resources && filteredResources.map(resource => (
          <ResourceMarker 
            key={resource.resourceId} 
            resource={resource}
          />
        ))}
        
        {/* Report markers */}
        {mapLayers.reports && reports.map(report => (
          <ReportMarker 
            key={report.reportId} 
            report={report}
          />
        ))}
      </MapContainer>

      {/* Screen reader only summary */}
      <div className="sr-only" role="status" aria-live="polite">
        {t('map.summary', {
          resourceCount: filteredResources.length,
          reportCount: mapLayers.reports ? reports.length : 0
        })}
      </div>
    </Box>
  );
}