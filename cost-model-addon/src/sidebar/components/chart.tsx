import React from 'react';
import { Box, Typography } from '@mui/material';

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
  // Convert values to milligrams for display
  const deviceMilligrams = emissions.device; // Values are already in mg from the parent component
  const networkMilligrams = emissions.network; // Values are already in mg from the parent component
  const totalMilligrams = emissions.total; // Values are already in mg from the parent component
  // Device icon
  const deviceIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" fill="#43a047"/>
    </svg>
  );
  
  // Network icon
  const networkIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill="#2196f3"/>
    </svg>
  );

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
              {deviceIcon}
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
              {networkIcon}
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

export default EmissionsChart;