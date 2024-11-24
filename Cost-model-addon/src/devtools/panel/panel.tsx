import Button  from '@mui/material/Button';
import Switch from '@mui/material/Switch';

const label = { inputProps: { 'aria-label': 'Switch demo' } };

export function Panel() {
    const handleClick = async () => {
        await browser.runtime.sendMessage({ data: "start testing performance" });
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