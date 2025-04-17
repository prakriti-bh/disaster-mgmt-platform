import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

// Custom SVG icons for different report types
const createSvgIcon = (color, type) => L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
    ${type === 'hazard' ? 
      `<path fill="${color}" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>` :
      `<path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>`
    }
  </svg>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Report type icons with specific colors
const reportIcons = {
  damage: createSvgIcon('#FF4444', 'damage'),
  flood: createSvgIcon('#4444FF', 'flood'),
  fire: createSvgIcon('#FF0000', 'hazard'),
  earthquake: createSvgIcon('#FF8800', 'hazard'),
  cyclone: createSvgIcon('#880088', 'hazard'),
  building_collapse: createSvgIcon('#884400', 'hazard'),
  default: new L.Icon.Default()
};

export default function ReportMarker({ report }) {
  const { t } = useTranslation();
  
  if (!report) {
    return null;
  }

  const { 
    type,
    title,
    description,
    coordinates,
    address,
    createdAt,
    updatedAt
  } = report;

  if (!coordinates?.latitude || !coordinates?.longitude) {
    console.warn('Invalid coordinates for report:', report);
    return null;
  }

  const position = [coordinates.latitude, coordinates.longitude];
  const icon = reportIcons[type] || reportIcons.default;

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <Box sx={{ minWidth: 200, maxWidth: 300 }}>
          <Box sx={{ mb: 1 }}>
            {title && (
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {title}
              </Typography>
            )}
            <Chip 
              label={t(`reports.types.${type}`)}
              color={type === 'hazard' ? 'error' : 'warning'}
              size="small"
            />
          </Box>

          <Typography variant="body2" sx={{ mb: 1 }}>
            {description}
          </Typography>

          {address && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {address}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            {new Date(createdAt || Date.now()).toLocaleString()}
          </Typography>
        </Box>
      </Popup>
    </Marker>
  );
}