import { List, ListItem, Card, CardContent, Typography, Box, Button, Collapse } from "@mui/material";
import * as React from "react";
import EmissionsChart from "./chart";

type CategoryType = "Browsing" | "System" | "Media";

interface EventProps {
  title: string;
  description: string;
  category: string;
  source: "device" | "network";
}

interface EmissionsData {
  aggregatedUsage: Record<string, {
    title: string;
    pid: number;
    outerWindowID: number;
    // Add any other properties needed
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
    // Add other regions as needed
  };
}

interface EventListProps {
  isTracking: boolean;
  hasResults?: boolean;
  emissionsData?: EmissionsData;
}

function EventComponent(props: EventProps) {
  // Color based on source type (device or network)
  const borderColor = props.source === "device" ? "#43a047" : "#2196f3";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start", 
      width: "100%", 
      position: "relative",
      paddingLeft: "10px",
      borderLeft: `3px solid ${borderColor}`
    }}>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
        {props.title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
        {props.description}
      </Typography>
    </div>
  );
}

export default function EventsBox({ isTracking = false, hasResults = false, emissionsData }: EventListProps) {
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

  // Function to generate events from emissions data
  const generateEventsFromData = (): EventProps[] => {
    if (!emissionsData) {
      return []; // Return empty array instead of default events
    }
    
    const events: EventProps[] = [];
    
    // CPU usage events (convert to milligrams for better readability)
    const cpuGrams = emissionsData.cpuCO2Emissions.actual;
    // Convert to milligrams (1g = 1000mg)
    const cpuMilligrams = cpuGrams * 1000;
    
    if (cpuMilligrams > 0) {
      events.push({
        title: "CPU Processing",
        description: `${cpuMilligrams.toFixed(2)}mg CO₂ from system processing`,
        category: "System",
        source: "device"
      });
    }
    
    // Add event for each active tab/site (without adding carbon emissions)
    if (emissionsData.aggregatedUsage) {
      Object.keys(emissionsData.aggregatedUsage).forEach(key => {
        const site = emissionsData.aggregatedUsage[key];
        const title = site.title.toLowerCase();
        
        // Try to categorize the site based on title keywords
        let category: CategoryType = "Browsing"; // Default category
        
        if (title.includes("youtube") || 
            title.includes("video") || 
            title.includes("stream") || 
            title.includes("netflix") ||
            title.includes("hulu") ||
            title.includes("music") ||
            title.includes("spotify")) {
          category = "Media";
        }
        
        events.push({
          title: `${site.title.substring(0, 30)}${site.title.length > 30 ? '...' : ''}`,
          description: "Active web page",
          category: category,
          source: "network" // Most emissions from browsing come from network
        });
      });
    }
    
    // Server emissions (convert to milligrams for better readability)
    if (emissionsData.serverCO2Emissions && emissionsData.serverCO2Emissions.actual > 0) {
      const serverGrams = emissionsData.serverCO2Emissions.actual;
      const serverMilligrams = serverGrams * 1000;
      events.push({
        title: "Server Processing",
        description: `${serverMilligrams.toFixed(2)}mg CO₂ from remote servers`,
        category: "System",
        source: "network"
      });
    }
    
    return events;
  };

  // Get the events, either from data or defaults
  const events = generateEventsFromData();

  // Group events by category
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, EventProps[]>);

  // Get unique categories
  const categories = Object.keys(groupedEvents);

  // Group data by source for chart view
  const deviceEvents = events.filter(e => e.source === "device");
  const networkEvents = events.filter(e => e.source === "network");
  
  // Calculate total CO2 emissions and breakdown by source
  const calculateTotalEmissions = () => {
    if (!emissionsData) return { total: 0, device: 0, network: 0 };
    
    // Get CPU emissions directly (convert to milligrams)
    const cpuMilligrams = emissionsData.cpuCO2Emissions.actual * 1000;
    
    // Get server emissions directly (convert to milligrams)
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
  };

  // Check if we have data to display (either actively tracking or have saved results)
  const showData = isTracking || hasResults;
  
  // Total emissions
  const emissions = calculateTotalEmissions();

  // Source icons
  const deviceIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" fill="#43a047"/>
    </svg>
  );
  
  const networkIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill="#2196f3"/>
    </svg>
  );
  
  const activityIcons = {
    "Browsing": (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#FF9800"/>
      </svg>
    ),
    "System": (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="#607D8B"/>
      </svg>
    ),
    "Media": (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21,3L3,10.53v0.98l6.84,2.65L12.48,21h0.98L21,3z" fill="#F44336"/>
      </svg>
    )
  };

  // Prepare chart data based on sources
  const chartData = [
    { category: "Device", value: emissions.device },
    { category: "Network", value: emissions.network }
  ];

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
            <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: "block" }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#43a047"/>
            </svg>
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
            <EmissionsChart 
              emissions={emissions}
              isTracking={isTracking}
            />
          ) : (
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
          )}
        </Collapse>
        
        {/* List View */}
        <Collapse in={!showChart} timeout={300}>
          <List sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 1.5,
            transition: "all 0.3s ease-in-out",
            transform: showData ? "translateY(0)" : "translateY(10px)",
          }}>
            {categories.length > 0 ? (
              categories.map((category) => (
                <Card key={category} sx={{ 
                  width: "100%", 
                  borderRadius: 2, 
                  overflow: "hidden",
                  transition: "box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out",
                  boxShadow: showData ? "0 2px 8px rgba(76, 175, 80, 0.15)" : "none",
                  border: "1px solid rgba(76, 175, 80, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  mb: 0.5
                }}>
                  <Button 
                    fullWidth
                    onClick={() => toggleCategory(category as CategoryType)}
                    sx={{ 
                      justifyContent: "space-between", 
                      padding: "8px 12px",
                      textTransform: "none",
                      fontWeight: "medium",
                      fontSize: "0.9rem",
                      color: "#1b5e20",
                      backgroundColor: expandedCategories[category as CategoryType] ? "rgba(76, 175, 80, 0.08)" : "transparent",
                      "&:hover": {
                        backgroundColor: expandedCategories[category as CategoryType] ? "rgba(76, 175, 80, 0.12)" : "rgba(76, 175, 80, 0.04)"
                      }
                    }}
                  >
                    <Typography sx={{ 
                      fontWeight: "medium", 
                      fontSize: "0.9rem", 
                      display: "flex", 
                      alignItems: "center",
                      gap: 1
                    }}>
                      {activityIcons[category as CategoryType]}
                      {category} ({groupedEvents[category].length})
                    </Typography>
                    <span>{expandedCategories[category as CategoryType] ? "▲" : "▼"}</span>
                  </Button>
                  <Collapse in={expandedCategories[category as CategoryType]} timeout={200}>
                    <List sx={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: 0.5, 
                      padding: "4px 6px",
                      my: 0
                    }}>
                      {groupedEvents[category].map((event, index) => (
                        <ListItem key={index} disablePadding sx={{ minHeight: "auto" }}>
                          <Card sx={{
                            width: "100%",
                            borderRadius: 1.5,
                            boxShadow: 1,
                            overflow: "hidden",
                            transition: "box-shadow 0.2s ease-in-out",
                            "&:hover": {
                              boxShadow: 2
                            }
                          }}>
                            <CardContent sx={{ 
                              padding: "8px 12px", 
                              "&:last-child": { paddingBottom: "8px" }
                            }}>
                              <EventComponent
                                title={event.title}
                                description={event.description}
                                category={event.category}
                                source={event.source}
                              />
                            </CardContent>
                          </Card>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Card>
              ))
            ) : (
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
            )}
          </List>
        </Collapse>
      </Collapse>
      
      {/* Only show this message when not tracking AND no results */}
      {!isTracking && !hasResults && (
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
      )}
    </Box>
  );
}