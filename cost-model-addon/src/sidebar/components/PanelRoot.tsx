import * as ReactDOM from 'react-dom/client';
<<<<<<<< HEAD:cost-model-addon/src/sidebar/PanelRoot.tsx
import SideBar from './logic/panel';
import * as React from 'react';
========
import SideBar from '../logic/panel';
>>>>>>>> 48003c7 (Style: revise bg tree):cost-model-addon/src/sidebar/components/PanelRoot.tsx

browser.action.onClicked.addListener(() => {
	browser.sidebarAction.close();
});

const root = ReactDOM.createRoot(document.getElementById('sidebar-root')!);
root.render(
	<React.StrictMode>
		<SideBar />
	</React.StrictMode>);