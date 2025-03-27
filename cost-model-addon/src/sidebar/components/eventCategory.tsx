import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import { BrowsingIcon, SystemIcon, MediaIcon } from '../public/icons';
import EventComponent, { EventProps } from './eventComponent';

interface EventCategoryProps {
  category: string;
  events: EventProps[];
  expanded: boolean;
  onToggle: () => void;
}

const getActivityIcon = (category: string) => {
  switch(category) {
    case 'Browsing':
      return <BrowsingIcon />;
    case 'System':
      return <SystemIcon />;
    case 'Media':
      return <MediaIcon />;
    default:
      return <BrowsingIcon />;
  }
};

const EventCategory: React.FC<EventCategoryProps> = ({ category, events, expanded, onToggle }) => {
  return (
    <Card sx={{ 
      width: "100%", 
      borderRadius: 2, 
      overflow: "hidden",
      transition: "box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out",
      boxShadow: "0 2px 8px rgba(76, 175, 80, 0.15)",
      border: "1px solid rgba(76, 175, 80, 0.2)",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      mb: 0.5
    }}>
      <Button 
        fullWidth
        onClick={onToggle}
        sx={{ 
          justifyContent: "space-between", 
          padding: "8px 12px",
          textTransform: "none",
          fontWeight: "medium",
          fontSize: "0.9rem",
          color: "#1b5e20",
          backgroundColor: expanded ? "rgba(76, 175, 80, 0.08)" : "transparent",
          "&:hover": {
            backgroundColor: expanded ? "rgba(76, 175, 80, 0.12)" : "rgba(76, 175, 80, 0.04)"
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
          {getActivityIcon(category)}
          {category} ({events.length})
        </Typography>
        <span>{expanded ? "▲" : "▼"}</span>
      </Button>
      <Collapse in={expanded} timeout={200}>
        <List sx={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 0.5, 
          padding: "4px 6px",
          my: 0
        }}>
          {events.map((event, index) => (
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
  );
};

export default React.memo(EventCategory);