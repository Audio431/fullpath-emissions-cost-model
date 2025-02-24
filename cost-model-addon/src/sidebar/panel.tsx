import Button  from '@mui/material/Button';
import * as React from 'react';
import EventsBox from './eventBox';

export default function SideBar() {
  
  const [isTracking, setIsTracking] = React.useState(false);

  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.close();
  });
  
  const handleTrackingButton = async () => {
    try {
      const response = await browser.runtime.sendMessage(
        { type: "TOGGLE_TRACKING", 
          from: "sidebar", 
          payload: { enabled: !isTracking }
        });
        
      setIsTracking(!isTracking);
      
    } catch (error) {
      console.error("Error:", error);
    }
  };



  return (
    <>
    <p>Tracking is {isTracking ? "ON": "OFF"} </p>
      <Button variant="contained" onClick={handleTrackingButton}>
        <span>
        {isTracking ? "Stop Tracking" : "Start Tracking"}
        </span>
      </Button>
     <EventsBox />
    </>
  );
}