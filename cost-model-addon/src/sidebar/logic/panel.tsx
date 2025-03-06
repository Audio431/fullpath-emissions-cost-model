import Button from "@mui/material/Button";
import * as React from "react";
import EventsBox from "../components/eventBox";
import { MessageType } from "../../common/message.types";

export default function SideBar() {
  const [isTracking, setIsTracking] = React.useState(false);

  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.close();
  });

  const handleTrackingButton = async () => {
    try {
      const response = await browser.runtime.sendMessage({
        type: MessageType.TOGGLE_TRACKING,
        from: "sidebar",
        payload: { enabled: !isTracking },
      });

      setIsTracking(!isTracking);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ 
      backgroundColor: "#f5f9f5", 
      height: "100vh",
      backgroundImage: "radial-gradient(#d7e7d7 0.5px, transparent 0.5px)",
      backgroundSize: "15px 15px"
    }}>
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
            fontSize: "1.1rem", 
            color: "#2e7d32",
            fontWeight: 500
          }}>
            Carbon Monitor
          </h2>
          <p style={{ 
            margin: 0,
            fontSize: "0.85rem",
            color: isTracking ? "#2e7d32" : "#666",
            transition: "color 0.3s ease-in-out",
            display: "flex",
            alignItems: "center",
            gap: "4px"
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
                Actively tracking your carbon footprint
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
            textTransform: "none",
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