import React, { useEffect, useRef } from 'react';
import { useWebContainer } from '../../hooks/useWebContainer';
import { ProjectState } from '../types';

interface WebContainerManagerProps {
  projectState: ProjectState;
  dispatch: React.Dispatch<any>;
}

export const WebContainerManager: React.FC<WebContainerManagerProps> = ({ projectState, dispatch }) => {
  const { mountFiles, runInstall, runBuild, runDevServer } = useWebContainer(dispatch);

  useEffect(() => {
    const startWebContainer = async () => {
      // Don't start if project isn't loaded or webcontainer is already busy
      if (!projectState.projectLoaded || projectState.webContainerState.status !== 'booting') {
          return;
      }
      
      try {
        console.log('Starting WebContainer process...');
        await mountFiles(projectState.fileContents);
        const installSuccess = await runInstall();
        if (!installSuccess) return;
        const buildSuccess = await runBuild();
        if (!buildSuccess) return;
        await runDevServer();
      } catch (error) {
        console.error('WebContainer startup error:', error);
        dispatch({ type: 'SET_WEBCONTAINER_ERROR', payload: { error: { message: error instanceof Error ? error.message : 'Unknown error' } } });
      }
    };

    startWebContainer();
  }, [projectState.projectLoaded, projectState.webContainerState.status]);


  // Auto-install and build when package.json changes (AI may add recommended deps)
  const prevPkgRef = useRef<string | null>(null);
  const runningRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const pkgJson = projectState.fileContents['package.json'];
    if (!pkgJson) return; // No package.json available

    // Initialize previous value on first run
    if (prevPkgRef.current === null) {
      prevPkgRef.current = pkgJson;
      return;
    }

    // If unchanged, do nothing
    if (prevPkgRef.current === pkgJson) return;
    prevPkgRef.current = pkgJson;

    const startAutoInstall = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        // Only run if container is in a stable state (running or idle)
        const status = projectState.webContainerState.status;
        if (status === 'booting' || status === 'installing') return;

        console.log('[WebContainer] Detected package.json change. Running install + build...');
        const okInstall = await runInstall();
        if (!okInstall || cancelled) return;
        const okBuild = await runBuild();
        if (!okBuild || cancelled) return;
        // If dev server isn't running, start it
        const statusAfter = projectState.webContainerState.status;
        const url = projectState.webContainerState.serverUrl;
        if ((statusAfter !== 'running' || !url) && !cancelled) {
          await runDevServer();
        }
      } finally {
        runningRef.current = false;
      }
    };

    startAutoInstall();

    return () => { cancelled = true; };
  }, [projectState.fileContents['package.json'], projectState.webContainerState.status, runInstall, runBuild]);

  
  return null; // This component does not render anything
};
