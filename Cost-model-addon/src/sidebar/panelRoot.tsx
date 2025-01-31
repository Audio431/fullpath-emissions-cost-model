import * as ReactDOM from 'react-dom/client';
import SideBar from './panel';
import React from 'react';
import Page from './App';

// const root = ReactDOM.createRoot(document.getElementById('sidebar-root')!);
// root.render(<SideBar />);

const root = ReactDOM.createRoot(document.getElementById('sidebar')!);
root.render(<SideBar />);