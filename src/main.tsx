import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DevWorld from './DevWorld';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevWorld />
  </StrictMode>,
);
