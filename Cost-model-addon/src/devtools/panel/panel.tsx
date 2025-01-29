import Button  from '@mui/material/Button';
import Switch from '@mui/material/Switch';

const label = { inputProps: { 'aria-label': 'Switch demo' } };

export function Panel() {
    const handleClick = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ data: "start testing performance" });
        console.log("Response from background script:", response);
      } catch (error) {
        console.error("Error:", chrome.runtime.lastError);
      }
    };
  return (
    <>
    <h1>Performance measuremet</h1>
      <Button variant="contained" onClick={handleClick}>
        Start
      </Button>
      <Switch {...label} defaultChecked />
    </>
  );
}