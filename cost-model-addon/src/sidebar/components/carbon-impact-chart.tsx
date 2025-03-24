import React, { useState } from 'react';
import Pie, { ProvidedProps, PieArcDatum } from '@visx/shape/lib/shapes/Pie';
import { scaleOrdinal } from '@visx/scale';
import { Group } from '@visx/group';
import { GradientLightgreenGreen } from '@visx/gradient';
import { animated, useTransition, to } from '@react-spring/web';
import { Typography, Box } from '@mui/material';

// Types for our carbon impact data
interface CarbonImpactData {
  category: string;
  impact: number;
  label: string;
}

// Default margin for the chart
const defaultMargin = { top: 20, right: 20, bottom: 20, left: 20 };

// Color scale for different categories
const getCategoryColor = scaleOrdinal({
  domain: ['Device Emissions', 'Network Footprint', 'Digital Activities'],
  range: [
    'rgba(67, 160, 71, 0.9)',  // Device Emissions - Green
    'rgba(3, 169, 244, 0.8)',  // Network Footprint - Blue
    'rgba(255, 160, 0, 0.8)',  // Digital Activities - Amber
  ],
});

// Color scale for impact levels within categories
const getImpactColor = scaleOrdinal({
  domain: ['high', 'medium', 'low'],
  range: [
    'rgba(229, 57, 53, 0.9)',   // High - Red
    'rgba(255, 160, 0, 0.8)',   // Medium - Amber
    'rgba(67, 160, 71, 0.7)',   // Low - Green
  ],
});

export type CarbonChartProps = {
  width: number;
  height: number;
  margin?: typeof defaultMargin;
  animate?: boolean;
  isTracking: boolean;
  events?: Array<{
    title: string;
    description: string;
    category: string;
    impact?: "high" | "medium" | "low";
  }>;
};

const CarbonImpactChart: React.FC<CarbonChartProps> = ({
  width,
  height,
  margin = defaultMargin,
  animate = true,
  isTracking,
  events = [],
}) => {
  
  // State for selected segment
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Prepare data for the chart
  const prepareCategoryData = (): CarbonImpactData[] => {
    const categoryData: Record<string, number> = {};
    
    // Use provided events if available, or show sample data
    const sourceEvents = events.length > 0 ? events : getSampleEvents();
    
    sourceEvents.forEach(event => {
      if (!categoryData[event.category]) {
        categoryData[event.category] = 0;
      }
      
      // Extract numeric value from description (e.g., "200g CO₂ from...")
      const match = event.description.match(/(\d+)g CO₂/);
      if (match && match[1]) {
        categoryData[event.category] += parseInt(match[1], 10);
      } else {
        // Fallback if no match found
        categoryData[event.category] += 10;
      }
    });
    
    // Convert to array format for the chart
    return Object.keys(categoryData).map(category => ({
      category,
      impact: categoryData[category],
      label: `${category}: ${categoryData[category]}g`
    }));
  };
  
  // Prepare impact level data (high/medium/low)
  const prepareImpactData = (): CarbonImpactData[] => {
    const impactData: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    // Use provided events if available, or show sample data
    const sourceEvents = events.length > 0 ? events : getSampleEvents();
    
    sourceEvents.forEach(event => {
      if (event.impact && impactData[event.impact] !== undefined) {
        // Extract numeric value from description
        const match = event.description.match(/(\d+)g CO₂/);
        if (match && match[1]) {
          impactData[event.impact] += parseInt(match[1], 10);
        } else {
          // Fallback
          impactData[event.impact] += 10;
        }
      }
    });
    
    // Convert to array format
    return Object.keys(impactData).map(impact => ({
      category: impact,
      impact: impactData[impact],
      label: `${impact}: ${impactData[impact]}g`
    }));
  };
  
  // Sample events for when no real data is available
  const getSampleEvents = () => {
    return [
      {
        title: "CPU Usage Spike",
        description: "200g CO₂ from increased processing",
        category: "Device Emissions",
        impact: "high"
      },
      {
        title: "Standby Power",
        description: "15g CO₂ from system idle",
        category: "Device Emissions",
        impact: "low"
      },
      {
        title: "Video Streaming",
        description: "75g CO₂ from data transfer",
        category: "Network Footprint",
        impact: "medium"
      },
      {
        title: "Cloud Storage",
        description: "30g CO₂ from file sync",
        category: "Network Footprint",
        impact: "low"
      },
      {
        title: "Online Meeting",
        description: "120g CO₂ from video conferencing",
        category: "Digital Activities",
        impact: "medium"
      },
      {
        title: "Social Media",
        description: "45g CO₂ from continuous scrolling",
        category: "Digital Activities",
        impact: "low"
      }
    ];
  };
  
  // Prepare data sets
  const categoryData = prepareCategoryData();
  const impactData = prepareImpactData();
  
  if (width < 10) return null;

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;
  const donutThickness = 50;

  // Get total emissions for center text
  const totalEmissions = categoryData.reduce((sum, d) => sum + d.impact, 0);

  return (
    <Box sx={{ 
      width: '100%', 
      p: 1,
      textAlign: 'center', 
      borderRadius: 2,
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
      opacity: 1, // Always visible when shown (removed opacity toggle based on isTracking)
      transform: "translateY(0)", // Always properly positioned (removed conditional transform)
      boxShadow: "0 2px 8px rgba(76, 175, 80, 0.1)",
      border: "1px solid rgba(76, 175, 80, 0.2)",
    }}>
      <Typography variant="h6" sx={{ 
        mb: 1, 
        color: "#2e7d32", 
        fontSize: "1rem",
        fontWeight: "medium"
      }}>
        Carbon Impact Distribution
        {isTracking && <span style={{ fontSize: "0.75rem", fontWeight: "normal", marginLeft: "8px", color: "#81c784" }}>(Live)</span>}
      </Typography>
      
      <svg width={width} height={height}>
        <GradientLightgreenGreen id="carbon-pie-gradient" />
        <rect 
          rx={14} 
          width={width} 
          height={height} 
          fill="rgba(245, 249, 245, 0.8)" 
        />
        
        {/* Total emissions in center */}
        <text
          x={centerX + margin.left}
          y={centerY + margin.top}
          textAnchor="middle"
          fill="#1b5e20"
          fontSize={16}
          fontWeight="bold"
          dominantBaseline="middle"
        >
          {totalEmissions}g
        </text>
        <text
          x={centerX + margin.left}
          y={centerY + margin.top + 20}
          textAnchor="middle"
          fill="#1b5e20"
          fontSize={12}
          dominantBaseline="middle"
        >
          CO₂
        </text>
        
        {/* Categories pie chart (outer) */}
        <Group top={centerY + margin.top} left={centerX + margin.left}>
          <Pie
            data={categoryData}
            pieValue={(d) => d.impact}
            outerRadius={radius}
            innerRadius={radius - donutThickness}
            cornerRadius={3}
            padAngle={0.01}
          >
            {(pie) => (
              <AnimatedPie
                {...pie}
                animate={animate}
                getKey={(arc) => arc.data.category}
                onClickDatum={({ data: { category } }) =>
                  animate &&
                  setSelectedCategory(selectedCategory && selectedCategory === category ? null : category)
                }
                getColor={(arc) => getCategoryColor(arc.data.category)}
                getLabelText={(arc) => `${arc.data.category}: ${arc.data.impact}g`}
              />
            )}
          </Pie>
          
          {/* Impact level pie chart (inner) */}
          <Pie
            data={impactData}
            pieValue={(d) => d.impact}
            outerRadius={radius - donutThickness * 1.3}
            innerRadius={radius - donutThickness * 2.1}
            cornerRadius={2}
            padAngle={0.01}
          >
            {(pie) => (
              <AnimatedPie
                {...pie}
                animate={animate}
                getKey={(arc) => arc.data.category}
                onClickDatum={() => {}}
                getColor={(arc) => getImpactColor(arc.data.category)}
                getLabelText={(arc) => `${arc.data.category}: ${arc.data.impact}g`}
              />
            )}
          </Pie>
        </Group>
        
        {animate && (
          <text
            textAnchor="middle"
            x={width / 2}
            y={height - 12}
            fill="#2e7d32"
            fontSize={10}
            fontWeight={300}
            pointerEvents="none"
          >
            Click segments for details
          </text>
        )}
      </svg>
    </Box>
  );
};

// react-spring transition definitions
type AnimatedStyles = { startAngle: number; endAngle: number; opacity: number };

const fromLeaveTransition = ({ endAngle }: PieArcDatum<any>) => ({
  startAngle: endAngle > Math.PI ? 2 * Math.PI : 0,
  endAngle: endAngle > Math.PI ? 2 * Math.PI : 0,
  opacity: 0,
});

const enterUpdateTransition = ({ startAngle, endAngle }: PieArcDatum<any>) => ({
  startAngle,
  endAngle,
  opacity: 1,
});

type AnimatedPieProps<Datum> = ProvidedProps<Datum> & {
  animate?: boolean;
  getKey: (d: PieArcDatum<Datum>) => string;
  getColor: (d: PieArcDatum<Datum>) => string;
  getLabelText: (d: PieArcDatum<Datum>) => string;
  onClickDatum: (d: PieArcDatum<Datum>) => void;
};

function AnimatedPie<Datum>({
  animate,
  arcs,
  path,
  getKey,
  getColor,
  getLabelText,
  onClickDatum,
}: AnimatedPieProps<Datum>) {
  const transitions = useTransition<PieArcDatum<Datum>, AnimatedStyles>(arcs, {
    from: animate ? fromLeaveTransition : enterUpdateTransition,
    enter: enterUpdateTransition,
    update: enterUpdateTransition,
    leave: animate ? fromLeaveTransition : enterUpdateTransition,
    keys: getKey,
  });
  
  return transitions((props, arc, { key }) => {
    const [centroidX, centroidY] = path.centroid(arc);
    const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.2;
    const arcPath = to(
      [props.startAngle, props.endAngle], 
      (startAngle, endAngle) => path({
        ...arc,
        startAngle,
        endAngle,
      })
    );

    return (
      <g key={key}>
        <animated.path
          d={arcPath}
          fill={getColor(arc)}
          onClick={() => onClickDatum(arc)}
          onTouchStart={() => onClickDatum(arc)}
          stroke="white"
          strokeWidth={1}
        />
        {hasSpaceForLabel && (
          <animated.g style={{ opacity: props.opacity }}>
            <text
              fill="white"
              x={centroidX}
              y={centroidY}
              dy=".33em"
              fontSize={9}
              textAnchor="middle"
              pointerEvents="none"
            >
              {getKey(arc)}
            </text>
          </animated.g>
        )}
      </g>
    );
  });
}

export default CarbonImpactChart;