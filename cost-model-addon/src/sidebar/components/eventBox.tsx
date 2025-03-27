import React, { memo, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import { lazy, Suspense } from 'react';
import EventCategory from './eventCategory';
import { EventProps } from './eventComponent';
import { InfoIcon } from '../public/icons';

// Lazy load chart component to reduce initial load
const EmissionsChart = lazy(() => import('./chart'));

// Define types
type CategoryType = "Browsing" | "System" | "Media";

interface EmissionsData {
  aggregatedUsage: Record<string, {
    title: string;
    pid: number;
    outerWindowID: number;
  }>;
  cpuCO2Emissions: {
    actual: number;
  };
  serverCO2Emissions: {
    actual: number;
    "North Scotland": number;
    "South Scotland": number;
    England: number;
    GB: number;
  };
}

interface EventListProps {
  isTracking: boolean;
  hasResults?: boolean;
  emissionsData?: EmissionsData;
}

// Loading fallback for chart
const ChartLoadingFallback = () => (
  <Box sx={{ 
    p: 3, 
    textAlign: "center", 
    border: "1px dashed #81c784",
    borderRadius: 2,
    opacity: 0.8,
    backgroundColor: "rgba(255, 255, 255, 0.5)"
  }}>
    <Typography variant="body2" sx={{ color: "#2e7d32" }}>
      Loading chart...
    </Typography>
  </Box>
);

// No data message component
const NoDataMessage = () => (
  <Box sx={{ 
    p: 3, 
    textAlign: "center", 
    border: "1px dashed #81c784",
    borderRadius: 2,
    opacity: 0.8,
    backgroundColor: "rgba(255, 255, 255, 0.5)"
  }}>
    <Typography variant="body2" sx={{ color: "#2e7d32", mb: 1 }}>
      No emission data available
    </Typography>
    <Typography variant="caption" sx={{ color: "#607d8b", display: "block" }}>
      Continue monitoring to gather data
    </Typography>
  </Box>
);

// Start monitoring message component
const StartMonitoringMessage = () => (
  <Box sx={{ 
    my: 3, 
    p: 3, 
    textAlign: "center", 
    border: "1px dashed #81c784",
    borderRadius: 2,
    opacity: 0.8,
    backgroundColor: "rgba(255, 255, 255, 0.5)"
  }}>
    <svg width="40" height="40" viewBox="0 0 24 24" style={{ margin: "0 auto", display: "block", marginBottom: "15px" }} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1-6c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1s1 .45 1 1v5z" fill="#81c784"/>
    </svg>
    <Typography variant="body2" sx={{ color: "#2e7d32", mb: 1 }}>
      Currently no result
    </Typography>
    <Typography variant="caption" sx={{ color: "#607d8b", display: "block" }}>
      Start monitoring to view carbon impact data
    </Typography>
  </Box>
);

function EventsBox({ isTracking = false, hasResults = false, emissionsData }: EventListProps) {
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = React.useState<Record<CategoryType, boolean>>({
    "Browsing": true,
    "System": false,
    "Media": false
  });
  
  // State to toggle between chart and list view
  const [showChart, setShowChart] = React.useState(true);

  // Toggle category expansion
  const toggleCategory = (category: CategoryType) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Generate events from emissions data
  const events = useMemo(() => {
    if (!emissionsData) {
      return []; 
    }
    
    const result: EventProps[] = [];
    
    // CPU usage events
    const cpuMilligrams = emissionsData.cpuCO2Emissions.actual * 1000;
    
    if (cpuMilligrams > 0) {
      result.push({
        title: "CPU Processing",
        description: `${cpuMilligrams.toFixed(2)}mg CO₂ from system processing`,
        category: "System",
        source: "device"
      });
    }
    
    // Add event for each active tab/site
    if (emissionsData.aggregatedUsage) {
      Object.keys(emissionsData.aggregatedUsage).forEach(key => {
        const site = emissionsData.aggregatedUsage[key];
        const title = site.title.toLowerCase();
        
        // Categorize the site based on title keywords
        let category: CategoryType = "Browsing"; // Default
        
        if (title.includes("youtube") || 
            title.includes("video") || 
            title.includes("stream") || 
            title.includes("netflix") ||
            title.includes("hulu") ||
            title.includes("music") ||
            title.includes("spotify")) {
          category = "Media";
        }
        
        result.push({
          title: `${site.title.substring(0, 30)}${site.title.length > 30 ? '...' : ''}`,
          description: "Active web page",
          category: category,
          source: "network"
        });
      });
    }
    
    // Server emissions
    if (emissionsData.serverCO2Emissions && emissionsData.serverCO2Emissions.actual > 0) {
      const serverMilligrams = emissionsData.serverCO2Emissions.actual * 1000;
      result.push({
        title: "Server Processing",
        description: `${serverMilligrams.toFixed(2)}mg CO₂ from remote servers`,
        category: "System",
        source: "network"
      });
    }
    
    return result;
  }, [emissionsData]);

  // Group events by category
  const groupedEvents = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    }, {} as Record<string, EventProps[]>);
  }, [events]);

  // Get unique categories
  const categories = useMemo(() => Object.keys(groupedEvents), [groupedEvents]);

  // Calculate total emissions
  const emissions = useMemo(() => {
    if (!emissionsData) return { total: 0, device: 0, network: 0 };
    
    // Get CPU emissions (convert to milligrams)
    const cpuMilligrams = emissionsData.cpuCO2Emissions.actual * 1000;
    
    // Get server emissions (convert to milligrams)
    const serverMilligrams = emissionsData.serverCO2Emissions.actual * 1000;
    
    // Only count measured emissions
    const deviceTotal = cpuMilligrams;
    const networkTotal = serverMilligrams;
    const total = deviceTotal + networkTotal;
    
    return {
      total: parseFloat(total.toFixed(2)) || 0,
      device: parseFloat(deviceTotal.toFixed(2)) || 0,
      network: parseFloat(networkTotal.toFixed(2)) || 0
    };
  }, [emissionsData]);

  // Check if we have data to display
  const showData = isTracking || hasResults;

  return (
    <Box sx={{ 
      bgcolor: "transparent", 
      p: { xs: 1, sm: 2 },
      transition: "all 0.3s ease-in-out",
      position: "relative"
    }}>
      <Typography variant="h5" sx={{ 
        mb: 1.5, 
        fontWeight: "bold",
        transition: "color 0.3s ease-in-out",
        color: "#2e7d32",
        display: "flex",
        alignItems: "center",
        gap: 1,
        fontSize: { xs: "0.95rem", sm: "1.1rem" },
        flexWrap: "wrap"
      }}>
        Carbon Impact {isTracking && <span style={{ color: "#81c784", fontSize: "0.8em", fontWeight: "normal" }}>(Live)</span>}
        {!isTracking && hasResults && <span style={{ color: "#ffa000", fontSize: "0.8em", fontWeight: "normal" }}>(Results)</span>}
      </Typography>
      
      {/* Show data if tracking or if we have results */}
      <Collapse in={showData} timeout={300}>
        <Box sx={{ mb: 1.5, px: 1, py: 1.5, bgcolor: "rgba(76, 175, 80, 0.08)", borderRadius: 1.5, border: "1px dashed #81c784" }}>
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1,
            color: "#2e7d32", 
            fontSize: { xs: "0.7rem", sm: "0.75rem" }
          }}>
            <InfoIcon />
            <Typography style={{ transform: "translateY(1px)" }} variant="body2" component="span">
              Total emissions: <b>{emissions.total}mg CO₂</b>
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: "flex", 
            justifyContent: { xs: "center", sm: "space-between" },
            mt: 0.5,
            fontSize: "0.65rem",
            color: "#616161"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
              <Box sx={{ 
                width: "8px", 
                height: "8px", 
                bgcolor: "#43a047", 
                borderRadius: "50%", 
                flexShrink: 0,
                display: "block"
              }} />
              <Typography style={{ transform: "translateY(1px)" }} variant="caption" component="span">
                Device: {emissions.device}mg
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ 
                width: "8px", 
                height: "8px", 
                bgcolor: "#2196f3", 
                borderRadius: "50%", 
                flexShrink: 0,
                display: "block"
              }} />
              <Typography style={{ transform: "translateY(1px)" }} variant="caption" component="span">
                Network: {emissions.network}mg
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* View toggle buttons */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5, gap: 1 }}>
          <Button 
            variant={showChart ? "contained" : "outlined"} 
            size="small"
            onClick={() => setShowChart(true)}
            sx={{ 
              borderRadius: "20px",
              textTransform: "none",
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              padding: { xs: "3px 8px", sm: "4px 12px" },
              minWidth: { xs: "60px", sm: "auto" },
              color: showChart ? "white" : "#2e7d32",
              backgroundColor: showChart ? "#43a047" : "transparent",
              borderColor: "#43a047",
              "&:hover": {
                backgroundColor: showChart ? "#2e7d32" : "rgba(76, 175, 80, 0.1)",
              }
            }}
          >
            Chart
          </Button>
          <Button 
            variant={!showChart ? "contained" : "outlined"} 
            size="small"
            onClick={() => setShowChart(false)}
            sx={{ 
              borderRadius: "20px",
              textTransform: "none",
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              padding: { xs: "3px 8px", sm: "4px 12px" },
              minWidth: { xs: "60px", sm: "auto" },
              color: !showChart ? "white" : "#2e7d32",
              backgroundColor: !showChart ? "#43a047" : "transparent",
              borderColor: "#43a047",
              "&:hover": {
                backgroundColor: !showChart ? "#2e7d32" : "rgba(76, 175, 80, 0.1)",
              }
            }}
          >
            List
          </Button>
        </Box>
        
        {/* Chart View */}
        <Collapse in={showChart} timeout={300}>
          {events.length > 0 ? (
            <Suspense fallback={<ChartLoadingFallback />}>
              <EmissionsChart 
                emissions={emissions}
                isTracking={isTracking}
              />
            </Suspense>
          ) : (
            <NoDataMessage />
          )}
        </Collapse>
        
        {/* List View */}
        <Collapse in={!showChart} timeout={300}>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 1.5,
            transition: "all 0.3s ease-in-out",
            transform: showData ? "translateY(0)" : "translateY(10px)",
          }}>
            {categories.length > 0 ? (
              categories.map((category) => (
                <EventCategory 
                  key={category}
                  category={category}
                  events={groupedEvents[category]}
                  expanded={expandedCategories[category as CategoryType] || false}
                  onToggle={() => toggleCategory(category as CategoryType)}
                />
              ))
            ) : (
              <NoDataMessage />
            )}
          </Box>
        </Collapse>
      </Collapse>
      
      {/* Only show this message when not tracking AND no results */}
      {!isTracking && !hasResults && <StartMonitoringMessage />}
    </Box>
  );
}

// Use memo to prevent unnecessary re-renders
export default memo(EventsBox);