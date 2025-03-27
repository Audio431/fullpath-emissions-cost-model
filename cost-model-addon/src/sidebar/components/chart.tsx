// chart.tsx
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DeviceIcon, NetworkIcon } from '../public/icons';

// Define types for our chart
export interface EmissionsChartProps {
  emissions: {
    device: number;
    network: number;
    total: number;
  };
  isTracking: boolean;
}

const EmissionsChart: React.FC<EmissionsChartProps> = ({ emissions, isTracking }) => {
  return (
    <Box sx={{ 
      width: '100%', 
      p: 1,
      textAlign: 'center', 
      borderRadius: 2,
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      boxShadow: "0 2px 8px rgba(76, 175, 80, 0.1)",
      border: "1px solid rgba(76, 175, 80, 0.2)",
    }}>
      <Typography variant="h6" sx={{ 
        mb: 2, 
        color: "#2e7d32", 
        fontSize: "1rem",
        fontWeight: "medium"
      }}>
        Carbon Source Distribution
        {isTracking && <span style={{ fontSize: "0.75rem", fontWeight: "normal", marginLeft: "8px", color: "#81c784" }}>(Live)</span>}
      </Typography>
      
      {/* Simple bar chart with better overflow handling */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 180, justifyContent: 'center', gap: 4, mb: 2, mt: 2, px: 2 }}>
        {/* Device emissions bar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 70, maxWidth: '30%' }}>
          <Box sx={{ 
            height: `${Math.min((emissions.device / (emissions.total || 1)) * 140, 140)}px`, 
            width: '100%', 
            backgroundColor: '#43a047',
            borderRadius: '8px 8px 0 0',
            position: 'relative',
            transition: 'height 0.5s ease-in-out',
            minHeight: '10px'
          }}>
            <Typography variant="body2" sx={{ 
              position: 'absolute', 
              top: -25, 
              left: '50%', 
              transform: 'translateX(-50%)',
              color: '#333',
              fontWeight: 'bold',
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              whiteSpace: 'nowrap'
            }}>
              {emissions.device}mg
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
            <Box sx={{ 
              display: { xs: 'none', sm: 'block' }
            }}>
              <DeviceIcon />
            </Box>
            <Typography variant="body2" sx={{ 
              color: '#333',
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}>
              Device
            </Typography>
          </Box>
        </Box>
        
        {/* Network emissions bar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 70, maxWidth: '30%' }}>
          <Box sx={{ 
            height: `${Math.min((emissions.network / (emissions.total || 1)) * 140, 140)}px`, 
            width: '100%', 
            backgroundColor: '#2196f3',
            borderRadius: '8px 8px 0 0',
            position: 'relative',
            transition: 'height 0.5s ease-in-out',
            minHeight: '10px'
          }}>
            <Typography variant="body2" sx={{ 
              position: 'absolute', 
              top: -25, 
              left: '50%', 
              transform: 'translateX(-50%)',
              color: '#333',
              fontWeight: 'bold',
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              whiteSpace: 'nowrap'
            }}>
              {emissions.network}mg
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
            <Box sx={{ 
              display: { xs: 'none', sm: 'block' }
            }}>
              <NetworkIcon />
            </Box>
            <Typography variant="body2" sx={{ 
              color: '#333',
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}>
              Network
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(EmissionsChart);