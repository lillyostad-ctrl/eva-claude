import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/estedad/400.css';
import '@fontsource/estedad/500.css';
import '@fontsource/estedad/600.css';
import '@fontsource/estedad/700.css';
import App from './mvp/App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
