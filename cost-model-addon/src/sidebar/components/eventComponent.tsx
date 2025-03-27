import React from 'react';
import Typography from '@mui/material/Typography';

export interface EventProps {
  title: string;
  description: string;
  category: string;
  source: "device" | "network";
}

const EventComponent: React.FC<EventProps> = (props) => {
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
};

export default React.memo(EventComponent);