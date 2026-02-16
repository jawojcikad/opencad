import React from 'react';
import { createRoot } from 'react-dom/client';

function hideLoadingIndicator(): void {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.classList.add('hidden');
    setTimeout(() => loadingIndicator.remove(), 300);
  }
}

async function bootstrap(): Promise<void> {
  const container = document.getElementById('root');
  try {
    if (!container) {
      throw new Error('Root element #root not found in document');
    }

    const [{ App, useAppStore }, { loadSampleSchematic, loadSamplePCB }] = await Promise.all([
      import('@opencad/ui'),
      import('./sample/sample-project-loader'),
    ]);

    // Load sample project data into the store before rendering
    try {
      const schDoc = loadSampleSchematic();
      const pcbDoc = loadSamplePCB();
      const store = useAppStore.getState();
      store.setSchematicDocument(schDoc);
      store.setPCBDocument(pcbDoc);
      store.setProjectName('555 Timer LED Blinker');
    } catch (err) {
      console.error('[OpenCAD] Failed to load sample project:', err);
    }

    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('[OpenCAD] Fatal startup error:', err);
    if (container) {
      container.textContent = 'OpenCAD failed to start. Check console for details.';
    }
  } finally {
    hideLoadingIndicator();
  }
}

void bootstrap();
