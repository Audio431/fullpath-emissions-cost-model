import * as React from 'react';
import { List, ListItem, Card, CardContent, Typography, Box } from "@mui/material";


interface EventProps {
    title: string;
    description: string;
}


// export default function EventsBox() {

//     const dummy_tasks = [
//         {
//             title: "Event 1",
//             description: "This is the first task"
//         },
//         {
//             title: "Event 2",
//             description: "This is the second task"
//         },
//         {
//             title: "Event 3",
//             description: "This is the third task"
//         }
  
//     ];

//     return (
//         <>
//             <h2>Events</h2>
//             <List sx={{ width: '100%', maxWidth: 360, bgcolor: '#f0f0f0' }}>
//                 {dummy_tasks.map((task, index) => (
//                     <ListItem key={index} sx={{ bgcolor: "grey.100", mb: 1, borderRadius: 1 }}>
//                             <EventComponent title={task.title} description={task.description} />
//                     </ListItem>
//                 ))}
//             </List> 
//         </>
//     );
// }


function EventComponent(props: EventProps) {
    return (
        <div  style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start", 
            padding: "0 16px", 
            width: "100%", 
            }}>
            <h3>{props.title}</h3>
            <p>{props.description}</p>
        </div>
    );
}

export default function EventList() {


    const events = [
        {
            title: "Event 1",
            description: "This is the first task"
        },
        {
            title: "Event 2",
            description: "This is the second task"
        },
        {
            title: "Event 3",
            description: "This is the third task"
        }
    ];

    return (
      <Box sx={{ width: "100%", maxWidth: 400, bgcolor: "background.default", p: 2}}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Events
        </Typography>
        <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {events.map((event: EventProps, index: number) => (
            <ListItem key={index} disablePadding>
              <Card sx={{ width: "100%",
                        borderRadius: 2,
                        boxShadow: 3,
                        overflow: "hidden"}}>
                <CardContent sx={{ padding: "12px 16px", borderRight: "1px solid #f0f0f0" }}>
                  <EventComponent title={event.title} description={event.description} />
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }