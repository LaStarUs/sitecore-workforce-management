import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LocalStorageRepository } from './data/repository';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App repository={new LocalStorageRepository()} />
  </StrictMode>,
);
