import Button  from '@mui/material/Button';
import * as React from 'react';
import EventsBox from './eventBox';


export default function SideBar() {
  
  const [isTracking, setIsTracking] = React.useState(false);
  const handleTrackingButton = async () => {
    try {
      const response = await browser.runtime.sendMessage({ type: "TOGGLE_TRACKING" });
      setIsTracking(!isTracking);
      console.log("Response from background script:", response);
    } catch (error) {
      console.error("Error:", browser.runtime.lastError);
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