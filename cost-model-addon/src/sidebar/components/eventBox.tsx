import { List, ListItem, Card, CardContent, Typography, Box, Button, Collapse } from "@mui/material";
import * as React from "react";

interface EventProps {
  title: string;
  description: string;
  category: string;
  impact?: "high" | "medium" | "low";
}

interface EventListProps {
  isTracking: boolean;
}

function EventComponent(props: EventProps) {
  // Determine impact color
  const getImpactColor = () => {
    switch(props.impact) {
      case "high": return "#e53935";
      case "medium": return "#ffa000";
      case "low": return "#43a047";
      default: return "#43a047";
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start", 
      width: "100%", 
      position: "relative",
      paddingLeft: "10px",
      borderLeft: `3px solid ${getImpactColor()}`
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

export default function EventsBox({ isTracking = false }: EventListProps) {
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    "Device Emissions": true,
    "Network Footprint": false,
    "Digital Activities": false
  });

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Sample events data grouped by category
  const events: EventProps[] = [
    {
      title: "CPU Usage Spike",
      description: "200g CO₂ from increased processing",
      category: "Device Emissions",
      impact: "high"
    },
    {
      title: "Standby Power",
      description: "15g CO₂ from system idle",
      category: "Device Emissions",
      impact: "low"
    },
    {
      title: "Video Streaming",
      description: "75g CO₂ from data transfer",
      category: "Network Footprint",
      impact: "medium"
    },
    {
      title: "Cloud Storage",
      description: "30g CO₂ from file sync",
      category: "Network Footprint",
      impact: "low"
    },
    {
      title: "Online Meeting",
      description: "120g CO₂ from video conferencing",
      category: "Digital Activities",
      impact: "medium"
    },
    {
      title: "Social Media",
      description: "45g CO₂ from continuous scrolling",
      category: "Digital Activities",
      impact: "low"
    }
  ];

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

  return (
    <Box sx={{ 
      bgcolor: "transparent", 
      p: 2,
      transition: "all 0.3s ease-in-out",
      position: "relative"
    }}>

      <Typography variant="h5" sx={{ 
        mb: 2, 
        fontWeight: "bold",
        transition: "color 0.3s ease-in-out",
        color: "#2e7d32",
        display: "flex",
        alignItems: "center",
        gap: 1,
        fontSize: "1.1rem"
      }}>
        <div style={{width: "12px", height: "12px", backgroundColor: "#43a047", borderRadius: "9999px", flexShrink: "0"}} />
        Carbon Impact {isTracking && <span style={{ color: "#81c784", fontSize: "0.8em", fontWeight: "normal" }}>(Live Monitoring)</span>}
      </Typography>
      
      <Collapse in={isTracking} timeout={300}>
        <Box sx={{ mb: 2, px: 1, py: 1.5, bgcolor: "rgba(76, 175, 80, 0.08)", borderRadius: 1.5, border: "1px dashed #81c784" }}>
          <Typography variant="body2" sx={{ color: "#2e7d32", display: "flex", alignItems: "center", gap: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#43a047"/>
            </svg>
            Today's estimated emissions: <b>485g CO₂</b>
            <span style={{ color: "#e53935", fontWeight: "medium", fontSize: "0.85em", marginLeft: "auto" }}>
              +125g
            </span>
          </Typography>
        </Box>
        
        <List sx={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 1.5,
          transition: "all 0.3s ease-in-out",
          transform: isTracking ? "translateY(0)" : "translateY(10px)",
        }}>
          {categories.map((category) => (
            <Card key={category} sx={{ 
              width: "100%", 
              borderRadius: 2, 
              overflow: "hidden",
              transition: "box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out",
              boxShadow: isTracking ? "0 2px 8px rgba(76, 175, 80, 0.15)" : "none",
              border: "1px solid rgba(76, 175, 80, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              mb: 0.5
            }}>
              <Button 
                fullWidth
                onClick={() => toggleCategory(category)}
                sx={{ 
                  justifyContent: "space-between", 
                  padding: "8px 12px",
                  textTransform: "none",
                  fontWeight: "medium",
                  fontSize: "0.9rem",
                  color: "#1b5e20",
                  backgroundColor: expandedCategories[category] ? "rgba(76, 175, 80, 0.08)" : "transparent",
                  "&:hover": {
                    backgroundColor: expandedCategories[category] ? "rgba(76, 175, 80, 0.12)" : "rgba(76, 175, 80, 0.04)"
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
                  {category === "Device Emissions" && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" fill="#43a047"/>
                    </svg>
                  )}
                  {category === "Network Footprint" && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill="#43a047"/>
                    </svg>
                  )}
                  {category === "Digital Activities" && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z" fill="#43a047"/>
                    </svg>
                  )}
                  {category} ({groupedEvents[category].length})
                </Typography>
                <span>{expandedCategories[category] ? "▲" : "▼"}</span>
              </Button>
              <Collapse in={expandedCategories[category]} timeout={200}>
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
                          />
                        </CardContent>
                      </Card>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Card>
          ))}
        </List>
      </Collapse>
      
      {!isTracking && (
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
            Carbon impact monitoring is paused
          </Typography>
          <Typography variant="caption" sx={{ color: "#607d8b", display: "block" }}>
            Start monitoring to track your digital carbon footprint
          </Typography>
        </Box>
      )}
    </Box>
  );
}