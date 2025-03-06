import * as React from "react";
import { MessageType, Action } from "../../common/message.types";

// Define interface for tracked events
interface TrackedEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  timestamp: Date;
  impact: "high" | "medium" | "low";
}

// Context to share events across components
export const EventContext = React.createContext<{
  events: TrackedEvent[];
  addEvent: (event: TrackedEvent) => void;
}>({
  events: [],
  addEvent: () => {},
});

// Provider component
export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = React.useState<TrackedEvent[]>([]);
  
  // Function to add a new event
  const addEvent = (event: TrackedEvent) => {
    setEvents(prevEvents => [event, ...prevEvents].slice(0, 100)); // Keep latest 100 events
  };

  // Set up message listener when component mounts
  React.useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === MessageType.EVENT_LISTENER) {
        processEvent(message.payload);
      }
    };

    // Process incoming events
    const processEvent = (payload: EventPayload<Action>) => {
      const newEvent = mapEventToTrackedEvent(payload);
      if (newEvent) {
        addEvent(newEvent);
      }
    };

    // Add listener
    browser.runtime.onMessage.addListener(handleMessage);
    
    // Clean up
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Map raw events to formatted tracked events
  const mapEventToTrackedEvent = (payload: EventPayload<Action>): TrackedEvent | null => {
    let category = "Digital Activities";
    let impact: "high" | "medium" | "low" = "low";
    let title = "";
    let description = "";
    
    switch (payload.event) {
      case Action.CLICK_EVENT:
        const elementTag = payload.elementDetails?.target?.tagName?.toLowerCase() || "element";
        title = "User Interaction";
        description = `${calculateClickImpact(payload)}g CO₂ from clicking ${elementTag}`;
        impact = determineImpact(payload);
        break;
        
      case Action.SCROLL_EVENT:
        title = "Page Scrolling";
        description = `${calculateScrollImpact(payload)}g CO₂ from scrolling activity`;
        impact = determineImpact(payload);
        break;
        
      default:
        return null;
    }
    
    return {
      id: generateEventId(),
      title,
      description,
      category,
      timestamp: new Date(),
      impact
    };
  };

  // Helper functions for carbon impact calculations
  const calculateClickImpact = (payload: ClickEventPayload): number => {
    // Simplified calculation - replace with actual logic
    // Different elements might have different carbon impacts
    return Math.floor(Math.random() * 20) + 5;
  };
  
  const calculateScrollImpact = (payload: ScrollEventPayload): number => {
    // Simplified calculation - replace with actual logic
    // Continuous scrolling has a higher impact based on scrollY value
    const scrollAmount = payload.scrollY / 100; // Normalize scroll amount
    return Math.floor(Math.random() * 10 + scrollAmount) + 10;
  };
  
  const determineImpact = (payload: EventPayload<Action>): "high" | "medium" | "low" => {
    // More realistic logic to determine impact level
    if (payload.event === Action.CLICK_EVENT) {
      // Clicks on interactive elements like buttons might have higher impact
      const target = payload.elementDetails.target;
      if (target.tagName === 'BUTTON' || target.tagName === 'VIDEO' || 
          target.tagName === 'IFRAME' || target.tagName === 'CANVAS') {
        return "high";
      } else if (target.tagName === 'A' || target.tagName === 'INPUT' || 
                target.tagName === 'SELECT') {
        return "medium";
      }
    } else if (payload.event === Action.SCROLL_EVENT) {
      // Long scrolls have higher impact
      if (payload.scrollY > 2000) return "high";
      if (payload.scrollY > 800) return "medium";
    }
    
    return "low";
  };
  
  const generateEventId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };
  
  return (
    <EventContext.Provider value={{ events, addEvent }}>
      {children}
    </EventContext.Provider>
  );
};

// Hook to use events in components
export const useEvents = () => {
  return React.useContext(EventContext);
};

// Middleware component that listens for DOM events directly
export const EventMiddleware: React.FC = () => {
  const { addEvent } = useEvents();
  
  React.useEffect(() => {
    // Direct DOM event listeners
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Create payload manually for direct DOM events
      const clickPayload: ClickEventPayload = {
        event: Action.CLICK_EVENT,
        elementDetails: {
          target: target
        }
      };
      
      // Instead of sending to runtime, process directly
      const newEvent = mapEventToTrackedEvent(clickPayload);
      if (newEvent) {
        addEvent(newEvent);
      }
    };
    
    // Listen for scroll events with debounce
    let scrollTimeout: number | null = null;
    const handleScroll = () => {
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = window.setTimeout(() => {
        const scrollPayload: ScrollEventPayload = {
          event: Action.SCROLL_EVENT,
          scrollY: window.scrollY
        };
        
        const newEvent = mapEventToTrackedEvent(scrollPayload);
        if (newEvent) {
          addEvent(newEvent);
        }
      }, 300); // Debounce scroll events
    };
    
    // Helper function duplicated from above (in actual code, refactor to avoid duplication)
    const mapEventToTrackedEvent = (payload: EventPayload<Action>): TrackedEvent | null => {
      let category = "Digital Activities";
      let impact: "high" | "medium" | "low" = "low";
      let title = "";
      let description = "";
      
      switch (payload.event) {
        case Action.CLICK_EVENT:
          const elementTag = payload.elementDetails?.target?.tagName?.toLowerCase() || "element";
          title = "User Interaction";
          description = `${calculateClickImpact(payload)}g CO₂ from clicking ${elementTag}`;
          impact = determineImpact(payload);
          break;
          
        case Action.SCROLL_EVENT:
          title = "Page Scrolling";
          description = `${calculateScrollImpact(payload)}g CO₂ from scrolling activity`;
          impact = determineImpact(payload);
          break;
          
        default:
          return null;
      }
      
      return {
        id: generateEventId(),
        title,
        description,
        category,
        timestamp: new Date(),
        impact
      };
    };
    
    const calculateClickImpact = (payload: ClickEventPayload): number => {
      // More sophisticated calculation based on element type
      const target = payload.elementDetails.target;
      if (target.tagName === 'VIDEO') return Math.floor(Math.random() * 30) + 20; // Video has higher impact
      if (target.tagName === 'IFRAME') return Math.floor(Math.random() * 25) + 15; // iframes (embeds) have high impact
      if (target.tagName === 'IMG') return Math.floor(Math.random() * 15) + 10; // Images medium impact
      return Math.floor(Math.random() * 10) + 5; // Basic elements have lower impact
    };
    
    const calculateScrollImpact = (payload: ScrollEventPayload): number => {
      const scrollAmount = payload.scrollY / 100; // Normalize scroll amount
      return Math.floor(Math.random() * 10 + scrollAmount) + 10;
    };
    
    const determineImpact = (payload: EventPayload<Action>): "high" | "medium" | "low" => {
      if (payload.event === Action.CLICK_EVENT) {
        // Clicks on interactive elements like buttons might have higher impact
        const target = payload.elementDetails.target;
        if (target.tagName === 'BUTTON' || target.tagName === 'VIDEO' || 
            target.tagName === 'IFRAME' || target.tagName === 'CANVAS') {
          return "high";
        } else if (target.tagName === 'A' || target.tagName === 'INPUT' || 
                  target.tagName === 'SELECT') {
          return "medium";
        }
      } else if (payload.event === Action.SCROLL_EVENT) {
        // Long scrolls have higher impact
        if (payload.scrollY > 2000) return "high";
        if (payload.scrollY > 800) return "medium";
      }
      
      return "low";
    };
    
    const generateEventId = (): string => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };
    
    // Add event listeners
    document.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [addEvent]);
  
  // This component doesn't render anything
  return null;
};

// Main content component that wraps everything
export default function Content() {
  return (
    <EventProvider>
      <EventMiddleware />
      {/* Your other content components go here */}
    </EventProvider>
  );
}