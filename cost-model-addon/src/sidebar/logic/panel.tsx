import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import * as React from "react";
import EventsBox from "../components/eventBox";
import { MessageType } from "../../common/message.types";

export default function SideBar() {
  const [isTracking, setIsTracking] = React.useState(false);
  // Add state to track if we have results to display
  const [hasResults, setHasResults] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [showErrorBanner, setShowErrorBanner] = React.useState(false);

  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.close();
  });
  
  const handleTrackingButton = async () => {
    try {
      // Clear previous errors
      setErrors([]);
      setShowErrorBanner(false);
      
      // If we're stopping tracking, set hasResults to true to keep showing the data
      if (isTracking) {
        setHasResults(true);
      }

      const { payload } = await browser.runtime.sendMessage({
        type: MessageType.TOGGLE_TRACKING,
        from: "sidebar",
        payload: { enabled: !isTracking },
      });
  
      // Only validate payload when *enabling* tracking
      if (!isTracking) {
        const { contentNotified = false, devtoolsNotified = false, WebSocketConnected = false, CPUUsageMonitoring = false} = payload || {};
        const failures: string[] = [];

        if (!contentNotified) failures.push("Content script may not be injected");
        if (!devtoolsNotified) failures.push("Devtools may not be open");
        if (!WebSocketConnected) failures.push("WebSocket connection not established");
        if (!CPUUsageMonitoring) failures.push("CPU monitoring not started");
      
        if (failures.length) {
          failures.forEach(msg => console.error(`[Sidebar] Error: ${msg}`));
          setErrors(failures);
          setShowErrorBanner(true);
          return; // Don't continue if there are errors
        }
        
        // Only clear previous results if we're successfully starting tracking
        if (hasResults) {
          setHasResults(false);
        }
      }
  
      setIsTracking(prev => !prev);
    } catch (error) {
      console.error("[Sidebar] ToggleTracking failed:", error);
      setErrors(["An unexpected error occurred. Please try again."]);
      setShowErrorBanner(true);
    }
  };
  
  const handleCloseErrorBanner = () => {
    setShowErrorBanner(false);
  };
      
  return (
    <div style={{ 
      backgroundColor: "#f5f9f5", 
      height: "100vh",
      backgroundImage: "radial-gradient(#d7e7d7 0.5px, transparent 0.5px)",
      backgroundSize: "15px 15px",
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif", // MUI default font family
      position: "relative", // For positioning the banner
      overflow: "hidden" // Prevent scroll when banner appears
    }}>
      {/* Error Banner */}
      <Collapse in={showErrorBanner}>
        <Alert 
          severity="error"
          sx={{
            borderRadius: 0,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            '& .MuiAlert-message': { width: '100%' }
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleCloseErrorBanner}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>Unable to Start Monitoring</AlertTitle>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            {errors.map((error, index) => (
              <li key={index} style={{ fontSize: '0.85rem' }}>{error}</li>
            ))}
          </ul>

          { errors.includes("Devtools may not be open") && !errors.includes("Content script may not be injected") ? (
            <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'rgba(211, 47, 47, 0.7)' }}>
              Please ensure that the Devtools is open
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'rgba(211, 47, 47, 0.7)' }}>
              Please reload the page and try again
            </div>
          )}
          
        </Alert>
      </Collapse>

      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "12px",
        flexWrap: "wrap",
        gap: "10px",
        borderBottom: "1px solid rgba(76, 175, 80, 0.2)",
        backgroundColor: isTracking ? "rgba(76, 175, 80, 0.12)" : "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(5px)",
        transition: "background-color 0.3s ease-in-out"
      }}>
        <div style={{ minWidth: "150px", flex: 1 }}>
          <h2 style={{ 
            margin: "0 0 4px 0", 
            fontSize: "1rem", 
            color: "#2e7d32",
            fontWeight: "bold",
            fontFamily: "inherit", // Will inherit from parent
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            Carbon Monitor
          </h2>
          <p style={{ 
            margin: 0,
            fontSize: "0.75rem",
            color: isTracking ? "#2e7d32" : "#666",
            transition: "color 0.3s ease-in-out",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontFamily: "inherit", // Will inherit from parent
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {isTracking ? (
              <>
                <span style={{ 
                  display: "inline-block", 
                  width: "8px", 
                  height: "8px", 
                  backgroundColor: "#4caf50",
                  borderRadius: "50%",
                  animation: "pulse 1.5s infinite",
                  flexShrink: 0
                }}></span>
                <span style={{ display: "inline-block", verticalAlign: "middle" }}>
                  Actively tracking your carbon footprint
                </span>
              </>
            ) : hasResults ? (
              "Results available"
            ) : (
              "Monitoring paused"
            )}
          </p>
        </div>
        
        {/* Conditional rendering for the action button */}
        {isTracking ? (
          <Button 
            variant="contained" 
            onClick={handleTrackingButton}
            color="error"
            sx={{
              transition: "all 0.3s ease-in-out",
              borderRadius: "20px",
              boxShadow: "0 2px 8px rgba(244, 67, 54, 0.3)",
              textTransform: "none",
              padding: { xs: "4px 12px", sm: "6px 16px" },
              height: "36px",
              minWidth: { xs: "100px", sm: "140px" },
              fontSize: { xs: "0.85rem", sm: "0.875rem" },
              fontWeight: "medium",
              backgroundColor: "#e53935",
              "&:hover": {
                backgroundColor: "#c62828",
              }
            }}
          >
            <span style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "4px",
              height: "100%"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                   style={{ flexShrink: 0 }}>
                <path d="M6 6h12v12H6z" fill="white"/>
              </svg>
              <span style={{ transform: "translateY(1px)" }}>Stop Monitoring</span>
            </span>
          </Button>
        ) : hasResults ? (
          <Button 
            variant="contained" 
            onClick={handleTrackingButton}
            color="success"
            sx={{
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              borderRadius: "20px",
              boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
              textTransform: "none",
              padding: { xs: "4px 12px", sm: "6px 16px" },
              height: "36px",
              minWidth: { xs: "100px", sm: "140px" },
              fontSize: { xs: "0.85rem", sm: "0.875rem" },
              fontWeight: "medium",
              backgroundColor: "#43a047",
              "&:hover": {
                backgroundColor: "#2e7d32",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 8px rgba(76, 175, 80, 0.4)",
              },
              "&:active": {
                transform: "translateY(1px)",
              }
            }}
          >
            <span style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "4px",
              height: "100%"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                   style={{ flexShrink: 0 }}>
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 9h7V2l-2.35 2.35z" fill="white"/>
              </svg>
              <span style={{ transform: "translateY(1px)" }}>Start New Tracking</span>
            </span>
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleTrackingButton}
            color="success"
            sx={{
              transition: "all 0.3s ease-in-out",
              borderRadius: "20px",
              boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
              textTransform: "none",
              padding: { xs: "4px 12px", sm: "6px 16px" },
              height: "36px",
              minWidth: { xs: "100px", sm: "140px" },
              fontSize: { xs: "0.85rem", sm: "0.875rem" },
              fontWeight: "medium",
              backgroundColor: "#43a047",
              "&:hover": {
                backgroundColor: "#2e7d32",
              }
            }}
          >
            <span style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "4px",
              height: "100%"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                   style={{ flexShrink: 0 }}>
                <path d="M8 5v14l11-7z" fill="white"/>
              </svg>
              <span style={{ transform: "translateY(1px)" }}>Start Monitoring</span>
            </span>
          </Button>
        )}
      </div>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
      <EventsBox isTracking={isTracking} hasResults={hasResults} />
    </div>
  );
}