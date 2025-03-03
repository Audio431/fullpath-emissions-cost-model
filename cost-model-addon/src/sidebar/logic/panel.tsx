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
    <>
      <p>Tracking is {isTracking ? "ON" : "OFF"} </p>
      <Button variant="contained" onClick={handleTrackingButton}>
        <span>{isTracking ? "Stop Tracking" : "Start Tracking"}</span>
      </Button>
      <EventsBox />
    </>
  );
}
