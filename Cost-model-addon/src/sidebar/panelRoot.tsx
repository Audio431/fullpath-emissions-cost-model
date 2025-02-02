import * as ReactDOM from 'react-dom/client';
import SideBar from './panel';
import React from 'react';

browser.action.onClicked.addListener(() => {
  browser.sidebarAction.close();
});

const root = ReactDOM.createRoot(document.getElementById('sidebar-root')!);
root.render(<SideBar />);