'use client';

import { useSelector } from 'react-redux';
import { Box, List, ListItem, ListItemText, Typography, Chip, Divider, Avatar, Rating } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function RecentReports() {
  const { t } = useTranslation();
  const reports = useSelector(state => state.reports.items);

  // Sort reports by date (newest first) and take top 5
  const sortedReports = [...reports]
    .sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0))
    .slice(0, 5);

  if (sortedReports.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {t('reports.noReportsYet')}
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {sortedReports.map((report, index) => (
        <Box key={report.reportId || index}>
          {index > 0 && <Divider component="li" />}
          <ListItem alignItems="flex-start">
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2" sx={{ mr: 2 }}>
                    {report.title || `${t(`reports.types.${report.type}`)} Report`}
                  </Typography>
                  <Chip 
                    label={t(`reports.types.${report.type}`)} 
                    size="small" 
                    color="primary"
                  />
                </Box>
              }
              secondary={
                <>
                  <Box sx={{ mt: 1 }}>
                    <Rating value={report.severity} readOnly size="small" max={4} />
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                    {report.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {report.address || (report.coordinates && 
                        `${report.coordinates.latitude.toFixed(6)}, ${report.coordinates.longitude.toFixed(6)}`
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(report.createdAt || report.timestamp || Date.now()).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {report.isAnonymous ? (
                      <Typography variant="caption" color="text.secondary">
                        {t('reports.anonymous')}
                      </Typography>
                    ) : (
                      <>
                        <Avatar 
                          sx={{ width: 24, height: 24, mr: 1 }}
                          alt={report.contact?.name || report.user?.name || t('reports.unknownUser')}
                        >
                          {(report.contact?.name?.[0] || report.user?.name?.[0] || "U")}
                        </Avatar>
                        <Typography variant="caption">
                          {report.contact?.name || report.user?.name || t('reports.unknownUser')}
                        </Typography>
                      </>
                    )}
                  </Box>
                </>
              }
            />
          </ListItem>
        </Box>
      ))}
    </List>
  );
}