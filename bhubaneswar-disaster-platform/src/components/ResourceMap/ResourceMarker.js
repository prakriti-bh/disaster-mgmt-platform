import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Chip, Button, Divider } from '@mui/material';
import { Phone, AccessTime, DirectionsWalk } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

// Custom SVG icons for different resource types
const createSvgIcon = (color) => L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
    <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Resource type icons with specific colors
const resourceIcons = {
  shelter: createSvgIcon('#FFA500'), // Orange
  hospital: createSvgIcon('#FF0000'), // Red
  pharmacy: createSvgIcon('#00FF00'), // Green
  food: createSvgIcon('#964B00'), // Brown
  water: createSvgIcon('#0000FF'), // Blue
  fuel: createSvgIcon('#800080'), // Purple
  atm: createSvgIcon('#FFD700'), // Gold
  default: new L.Icon.Default()
};

// Status colors for MUI chips
const statusColors = {
  operational: 'success',
  limited: 'warning',
  closed: 'error'
};

export default function ResourceMarker({ resource }) {
  const { t } = useTranslation();

  if (!resource) {
    return null;
  }

  const { 
    name, 
    category, 
    description, 
    address, 
    coordinates, 
    contactInfo, 
    operationalStatus,
    capacity,
    lastUpdated 
  } = resource;

  // Handle both coordinate formats (lat/lng and latitude/longitude)
  const lat = coordinates?.lat ?? coordinates?.latitude;
  const lng = coordinates?.lng ?? coordinates?.longitude;

  // Return null if coordinates are not valid
  if (!lat || !lng) {
    console.warn('Invalid coordinates for resource:', resource);
    return null;
  }

  const position = [lat, lng];
  const icon = resourceIcons[category] || resourceIcons.default;
  
  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <Box sx={{ minWidth: 200, maxWidth: 300 }}>
          <Typography variant="subtitle1">{name}</Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
            <Chip 
              label={t(`resources.${category}`)} 
              size="small" 
              color="primary"
            />
            <Chip 
              label={t(`status.${operationalStatus}`)} 
              size="small" 
              color={statusColors[operationalStatus]}
            />
          </Box>
          
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {description}
            </Typography>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="body2">
            <b>{t('resource.address')}:</b> {address}
          </Typography>
          
          {contactInfo?.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">{contactInfo.phone}</Typography>
            </Box>
          )}
          
          {capacity && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                <b>{t('resource.capacity')}:</b> {capacity.available}/{capacity.total}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="caption">
              {t('resource.lastUpdated')}: {new Date(lastUpdated).toLocaleString()}
            </Typography>
          </Box>
          
          <Button 
            variant="outlined" 
            fullWidth 
            startIcon={<DirectionsWalk />}
            sx={{ mt: 2 }}
            size="small"
          >
            {t('resource.directions')}
          </Button>
        </Box>
      </Popup>
    </Marker>
  );
}