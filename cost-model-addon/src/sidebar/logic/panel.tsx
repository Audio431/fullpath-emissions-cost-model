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
      
      const { payload } = await browser.runtime.sendMessage({
        type: MessageType.TOGGLE_TRACKING,
        from: "sidebar",
        payload: { enabled: !isTracking },
      });
  
      // Only validate payload when *enabling* tracking
      if (!isTracking) {
        const { contentNotified = false, devtoolsNotified = false, monitorEnabled = false } = payload || {};
        const failures: string[] = [];
  
        if (!contentNotified) failures.push("Content script may not be injected");
        if (!devtoolsNotified) failures.push("Devtools may not be open");
        if (!monitorEnabled) failures.push("WebSocket connection not established");
  
        if (failures.length) {
          failures.forEach(msg => console.error(`[Sidebar] Error: ${msg}`));
          setErrors(failures);
          setShowErrorBanner(true);
          return;
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
          <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'rgba(211, 47, 47, 0.7)' }}>
            Please reload the page and try again
          </div>
        </Alert>
      </Collapse>

      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "16px",
        borderBottom: "1px solid rgba(76, 175, 80, 0.2)",
        backgroundColor: isTracking ? "rgba(76, 175, 80, 0.12)" : "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(5px)",
        transition: "background-color 0.3s ease-in-out"
      }}>
        <div>
          <h2 style={{ 
            margin: "0 0 4px 0", 
            fontSize: "1rem", 
            color: "#2e7d32",
            fontWeight: "bold",
            fontFamily: "inherit" // Will inherit from parent
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
            fontFamily: "inherit" // Will inherit from parent
          }}>
            {isTracking ? (
              <>
                <span style={{ 
                  display: "inline-block", 
                  width: "8px", 
                  height: "8px", 
                  backgroundColor: "#4caf50",
                  borderRadius: "50%",
                  animation: "pulse 1.5s infinite"
                }}></span>
                <span style={{ display: "inline-block", verticalAlign: "middle" }}>
                  Actively tracking your carbon footprint
                </span>
              </>
            ) : (
              "Monitoring paused"
            )}
          </p>
        </div>
        <Button 
          variant="contained" 
          onClick={handleTrackingButton}
          color={isTracking ? "error" : "success"}
          sx={{
            transition: "all 0.3s ease-in-out",
            borderRadius: "20px",
            boxShadow: isTracking ? "0 2px 8px rgba(244, 67, 54, 0.3)" : "0 2px 8px rgba(76, 175, 80, 0.3)",
            textTransform: "none", // Prevent uppercase transformation
            padding: "6px 16px",
            fontWeight: "medium",
            backgroundColor: isTracking ? "#e53935" : "#43a047",
            "&:hover": {
              backgroundColor: isTracking ? "#c62828" : "#2e7d32",
            }
          }}
        >
          <span>{isTracking ? "Stop Monitoring" : "Start Monitoring"}</span>
        </Button>
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
      <EventsBox isTracking={isTracking} />
    </div>
  );
}