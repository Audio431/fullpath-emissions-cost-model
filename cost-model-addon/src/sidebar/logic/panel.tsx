// panel.tsx
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import * as React from "react";
import { Suspense, lazy } from "react";
import { MessageType } from "../../common/message.types";
import { PlayIcon, StopIcon, RestartIcon, InfoIcon } from "../public/icons";

// Lazy load components
const EventsBox = lazy(() => import("../components/eventBox"));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    padding: "20px", 
    textAlign: "center", 
    color: "#2e7d32",
    backgroundColor: "rgba(76, 175, 80, 0.05)",
    borderRadius: "4px",
    margin: "16px",
    boxShadow: "inset 0 0 0 1px rgba(76, 175, 80, 0.2)"
  }}>
    <div style={{ marginBottom: "12px" }}>
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: "rotate 1.5s linear infinite" }}>
        <path fill="#2e7d32" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
      </svg>
    </div>
    <div>Loading emissions data...</div>
  </div>
);

// Styles defined as a separate object to avoid recreation
const styles = {
  container: { 
    backgroundColor: "#f5f9f5", 
    height: "100vh",
    backgroundImage: "radial-gradient(#d7e7d7 0.5px, transparent 0.5px)",
    backgroundSize: "15px 15px",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    position: "relative" as const,
    overflow: "hidden"
  },
  header: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between",
    padding: "12px",
    flexWrap: "wrap" as const,
    gap: "10px",
    borderBottom: "1px solid rgba(76, 175, 80, 0.2)"
  },
  title: { 
    margin: "0 0 4px 0", 
    fontSize: "1rem", 
    color: "#2e7d32",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  status: {
    margin: 0,
    fontSize: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  pulsingDot: { 
    display: "inline-block", 
    width: "8px", 
    height: "8px", 
    backgroundColor: "#4caf50",
    borderRadius: "50%",
    animation: "pulse 1.5s infinite",
    flexShrink: 0
  }
};

// Define emissions data interface
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

export default function SideBar() {
  const [isTracking, setIsTracking] = React.useState(false);
  const [hasResults, setHasResults] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [showErrorBanner, setShowErrorBanner] = React.useState(false);
  const [emissionsData, setEmissionsData] = React.useState<EmissionsData | undefined>(undefined);

  React.useEffect(() => {
    // Setup message listeners
    const messageHandler = (message: any, sender: any, sendResponse: any) => {
      if (message.type === MessageType.CPU_USAGE && message.from === "background") {
        console.log("[Sidebar] CPU Usage:", message.payload);
        
        try {
          setEmissionsData(message.payload);
          sendResponse({ success: true });
        } catch (error: unknown) {
          console.error("[Sidebar] Error handling CPU_USAGE message:", error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      // Return true for asynchronous response
      return true;
    };

    browser.runtime.onMessage.addListener(messageHandler);

    // Cleanup listener on unmount
    return () => {
      browser.runtime.onMessage.removeListener(messageHandler);
    };
  }, []);

  React.useEffect(() => {
    // Setup sidebar close handler
    const handleSidebarClose = () => {
      browser.sidebarAction.close();
    };

    browser.action.onClicked.addListener(handleSidebarClose);

    // Cleanup listener on unmount
    return () => {
      browser.action.onClicked.removeListener(handleSidebarClose);
    };
  }, []);
  
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

  // Determine button style and icon based on state
  const getButtonProps = () => {
    if (isTracking) {
      return {
        icon: <StopIcon />,
        text: "Stop Monitoring",
        color: "error" as const,
        backgroundColor: "#e53935",
        hoverColor: "#c62828"
      };
    } else if (hasResults) {
      return {
        icon: <RestartIcon />,
        text: "Start New Tracking",
        color: "success" as const,
        backgroundColor: "#43a047",
        hoverColor: "#2e7d32"
      };
    } else {
      return {
        icon: <PlayIcon />,
        text: "Start Monitoring",
        color: "success" as const,
        backgroundColor: "#43a047",
        hoverColor: "#2e7d32"
      };
    }
  };

  const buttonProps = getButtonProps();

  // Dynamically determine header background color
  const headerStyle = {
    ...styles.header,
    backgroundColor: isTracking ? "rgba(76, 175, 80, 0.12)" : "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(5px)",
    transition: "background-color 0.3s ease-in-out"
  };

  return (
    <div style={styles.container}>
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

      <div style={headerStyle}>
        <div style={{ minWidth: "150px", flex: 1 }}>
          <h2 style={styles.title}>
            Carbon Monitor
          </h2>
          <p style={{
            ...styles.status,
            color: isTracking ? "#2e7d32" : "#666",
            transition: "color 0.3s ease-in-out"
          }}>
            {isTracking ? (
              <>
                <span style={styles.pulsingDot}></span>
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
        
        <Button 
          variant="contained" 
          onClick={handleTrackingButton}
          color={buttonProps.color}
          sx={{
            transition: "all 0.3s ease-in-out",
            borderRadius: "20px",
            boxShadow: `0 2px 8px ${isTracking ? "rgba(244, 67, 54, 0.3)" : "rgba(76, 175, 80, 0.3)"}`,
            textTransform: "none",
            padding: { xs: "4px 12px", sm: "6px 16px" },
            height: "36px",
            minWidth: { xs: "100px", sm: "140px" },
            fontSize: { xs: "0.85rem", sm: "0.875rem" },
            fontWeight: "medium",
            backgroundColor: buttonProps.backgroundColor,
            "&:hover": {
              backgroundColor: buttonProps.hoverColor,
              ...(hasResults && !isTracking ? {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 8px rgba(76, 175, 80, 0.4)",
              } : {})
            },
            "&:active": {
              ...(hasResults && !isTracking ? {
                transform: "translateY(1px)",
              } : {})
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
            {buttonProps.icon}
            <span style={{ transform: "translateY(1px)" }}>{buttonProps.text}</span>
          </span>
        </Button>
      </div>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Wrap EventsBox with Suspense */}
      <Suspense fallback={<LoadingFallback />}>
        <EventsBox isTracking={isTracking} hasResults={hasResults} emissionsData={emissionsData} />
      </Suspense>
    </div>
  );
}