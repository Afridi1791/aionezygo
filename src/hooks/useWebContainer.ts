import { useRef, useCallback, type Dispatch } from 'react';
import { WebContainer, type FileSystemTree } from '@webcontainer/api';

type Dispatcher = Dispatch<any>;

// Singleton across all hook instances to avoid "Only a single WebContainer instance can be booted"
let webContainerSingleton: WebContainer | null = null;
let bootingPromise: Promise<WebContainer> | null = null;

// Error debouncing to prevent spam
let lastErrorTime = 0;
let lastErrorMessage = '';

export const useWebContainer = (dispatch: Dispatcher) => {
  const webContainerRef = useRef<WebContainer | null>(null);
  const runningProcessRef = useRef<any>(null);
  const inputWriterRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const lastSizeRef = useRef<{ cols: number; rows: number } | null>(null);

  const bootWebContainer = useCallback(async () => {
    // Reuse singleton if already booted
    if (webContainerSingleton) {
      webContainerRef.current = webContainerSingleton;
      console.log('WebContainer singleton already exists, reusing instance');
      return webContainerRef.current;
    }
    // If a boot is in progress, await it
    if (bootingPromise) {
      const wc = await bootingPromise;
      webContainerRef.current = wc;
      return wc;
    }
    if (webContainerRef.current) {
      console.log('WebContainer already exists, reusing instance');
      return webContainerRef.current;
    }
    
    // Guard: WebContainer requires cross-origin isolation (COOP/COEP)
    if (!(globalThis as any).crossOriginIsolated) {
      const msg = 'SharedArrayBuffer is unavailable. Please run with COOP/COEP headers enabled. (crossOriginIsolated=false)';
      console.warn(msg);
      dispatch({ type: 'SET_WEBCONTAINER_ERROR', payload: { error: { message: msg } } });
      dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[31m${msg}\x1b[0m\r\n` } });
      return null;
    }
    
    try {
      dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: 'Booting WebContainer...\r\n' } });
      bootingPromise = WebContainer.boot();
      const wc = await bootingPromise;
      webContainerRef.current = wc;
      webContainerSingleton = wc;
      console.log('WebContainer booted successfully');
      bootingPromise = null;

      wc.on('error', (error) => {
          console.error('WebContainer Error:', error);
          dispatch({ type: 'SET_WEBCONTAINER_ERROR', payload: { error: { message: error.message } } });
          dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[31mError: ${error.message}\x1b[0m\r\n` } });
      });

      wc.on('server-ready', (port, url) => {
          console.log(`Server ready at ${url}`);
          dispatch({ type: 'SET_WEBCONTAINER_URL', payload: { url } });
          dispatch({ type: 'SET_WEBCONTAINER_STATUS', payload: { status: 'running' } });
          dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[32mServer is live at: ${url}\x1b[0m\r\n` } });
      });

      return wc;
    } catch (error) {
      bootingPromise = null;
      console.error('Failed to boot WebContainer:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while booting WebContainer';
      dispatch({ type: 'SET_WEBCONTAINER_ERROR', payload: { error: { message: errorMsg } } });
      dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[31mFailed to boot WebContainer: ${errorMsg}\x1b[0m\r\n` } });
      return null;
    }

  }, [dispatch]);

  const mountFiles = useCallback(async (fileContents: Record<string, string>) => {
    if (!webContainerRef.current) {
      const wc = await bootWebContainer();
      if (!wc) return;
    }
    if (!webContainerRef.current) return;

    const files: FileSystemTree = {};
    for (const [path, content] of Object.entries(fileContents)) {
      const pathParts = path.split('/');
      let current = files;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = (current[part] as { directory: FileSystemTree }).directory!;
      }
      
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = { file: { contents: content } };
    }

    try {
      await webContainerRef.current.mount(files);
      console.log('Files mounted successfully');
      // After mounting, set status to idle so callers know container is ready for commands
      dispatch({ type: 'SET_WEBCONTAINER_STATUS', payload: { status: 'idle' } });
    } catch (error) {
      console.error('Failed to mount files:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while mounting files';
      dispatch({ type: 'SET_WEBCONTAINER_ERROR', payload: { error: { message: errorMsg } } });
      dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[31mFailed to mount files: ${errorMsg}\x1b[0m\r\n` } });
    }
  }, [bootWebContainer, dispatch]);

  // Internal: spawn an interactive shell so users can type commands manually (old terminal parity)
  const spawnInteractiveShell = useCallback(async () => {
    try {
      // Ensure container exists
      if (!webContainerRef.current) {
        const wc = await bootWebContainer();
        if (!wc) return null;
      }
      if (!webContainerRef.current) return null;

      // If a process already running, do nothing
      if (runningProcessRef.current) return runningProcessRef.current;

      // Launch shell (prefer bash/sh like old terminal; fallback to jsh)
      const shellCandidates = ['bash', 'sh', 'jsh'];
      let process: any = null;
      const spawnOpts: any = lastSizeRef.current ? { terminal: { cols: lastSizeRef.current.cols, rows: lastSizeRef.current.rows } } : undefined;
      for (const cmd of shellCandidates) {
        try {
          process = await (spawnOpts
            ? (webContainerRef.current as any).spawn(cmd, [], spawnOpts)
            : webContainerRef.current.spawn(cmd, []));
          if (process) break;
        } catch (e) {
          // try next shell
        }
      }
      if (!process) {
        dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[31mNo shell available (jsh/bash/sh)\x1b[0m\r\n` } });
        return null;
      }

      runningProcessRef.current = process;
      try { inputWriterRef.current?.releaseLock?.(); } catch {}
      inputWriterRef.current = null;

      // Pipe shell output to terminal
      process.output.pipeTo(new WritableStream({
        write(data) {
          dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: data } });
        },
      }));

      // When shell exits, clear refs
      (async () => {
        const code = await process.exit;
        if (runningProcessRef.current === process) {
          runningProcessRef.current = null;
          try { inputWriterRef.current?.releaseLock?.(); } catch {}
          inputWriterRef.current = null;
          // No noisy exit banner to mirror old terminal behavior
        }
      })();

      return process;
    } catch (e) {
      return null;
    }
  }, [bootWebContainer, dispatch]);

  // Write data to the current process stdin (if available)
  const writeToTerminal = useCallback(async (data: string) => {
    try {
      // If no running process, spawn an interactive shell automatically
      if (!runningProcessRef.current) {
        const proc = await spawnInteractiveShell();
        if (!proc) return;
      }
      if (!inputWriterRef.current && runningProcessRef.current?.input?.getWriter) {
        inputWriterRef.current = runningProcessRef.current.input.getWriter();
      }
      await inputWriterRef.current?.write?.(data);
    } catch (e) {
      // ignore transient writer errors
    }
  }, [spawnInteractiveShell]);

  // Resize current PTY if supported
  const resizeTerminal = useCallback((cols: number, rows: number) => {
    lastSizeRef.current = { cols, rows };
    try {
      const proc = runningProcessRef.current;
      if (!proc) return;
      // Some versions expose resize or resizeTTY; use whichever exists.
      if (typeof proc.resize === 'function') {
        proc.resize({ cols, rows });
      } else if (typeof proc.resizeTTY === 'function') {
        proc.resizeTTY({ cols, rows });
      }
    } catch {}
  }, []);

  const runCommand = useCallback(async (command: string, args: string[], clearTerminal: boolean = false) => {
    if (!webContainerRef.current) {
      console.error("WebContainer not available.");
      return false;
    }

    // Kill any existing dev server process before starting new command
    if (runningProcessRef.current && (command === 'npm' && args.includes('dev'))) {
      try {
        await runningProcessRef.current.kill();
        runningProcessRef.current = null;
        // Wait a bit for process to fully terminate
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log('Previous process already terminated');
      }
    }

    // Clear terminal if requested (for clean output) and always clear preview URL before a new command
    if (clearTerminal) {
      dispatch({ type: 'CLEAR_TERMINAL_OUTPUT' });
    }
    // Always clear the preview URL to avoid showing stale server between projects/commands
    dispatch({ type: 'SET_WEBCONTAINER_URL', payload: { url: null } });

    // Clear any previous error when starting a new command
    dispatch({ type: 'CLEAR_WEBCONTAINER_ERROR' });

    dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[33m$ ${command} ${args.join(' ')}\x1b[0m\r\n` } });
    // Collect output for error reporting if command fails
    let collected = '';
    // If we have last known terminal size, try to launch with TTY
    const spawnOpts: any = lastSizeRef.current ? { terminal: { cols: lastSizeRef.current.cols, rows: lastSizeRef.current.rows } } : undefined;
    const process = await (spawnOpts
      ? (webContainerRef.current as any).spawn(command, args, spawnOpts)
      : webContainerRef.current.spawn(command, args));
    
    // Track dev server process for proper cleanup
    if (command === 'npm' && args.includes('dev')) {
      runningProcessRef.current = process;
    }
    // Also track for any interactive command (best-effort)
    if (!runningProcessRef.current) {
      runningProcessRef.current = process;
    }
    // reset writer on new process
    try { inputWriterRef.current?.releaseLock?.(); } catch {}
    inputWriterRef.current = null;
    
    process.output.pipeTo(new WritableStream({
      write(data) {
        // data is string chunks
        collected += data;
        // Prevent unbounded growth (keep last ~20k chars)
        if (collected.length > 20000) {
          collected = collected.slice(collected.length - 20000);
        }
        
        // Only check for critical build/compilation errors that stop the process
        // Don't show error cards for runtime warnings or non-critical errors
        if (command === 'npm' && (args.includes('build') || args.includes('install'))) {
          // Look for critical build failure patterns that actually stop the process
          const criticalErrorPatterns = [
            /Failed to compile/gi,
            /Module not found/gi,
            /Cannot resolve module/gi,
            /Unexpected token/gi,
            /Parse error/gi,
            /✘ \[ERROR\]/gi,
            /ERROR in/gi,
            /Build failed/gi,
            /Compilation failed/gi
          ];
          
          for (const pattern of criticalErrorPatterns) {
            const matches = data.match(pattern);
            if (matches) {
              // Only store the error, don't dispatch it yet
              // We'll only show error card if the command actually fails (exit code !== 0)
              collected += `\n[CRITICAL ERROR DETECTED]: ${matches[0]}`;
              break;
            }
          }
        }
        
        dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: data } });
      },
    }));
    
    const exitCode = await process.exit;
    if (exitCode !== 0) {
      // Only show error card for critical commands that actually stop the terminal
      // Don't show for dev server warnings or non-critical errors
      const isCriticalCommand = (
        (command === 'npm' && args.includes('install')) ||
        (command === 'npm' && args.includes('build')) ||
        (command === 'npm' && args.includes('start'))
      );
      
      if (isCriticalCommand) {
        // Use tail of collected output as the error to fix
        const TAIL_CHARS = 3000;
        const errorTail = collected.slice(-TAIL_CHARS).trim() || `Command '${command} ${args.join(' ')}' failed with exit code ${exitCode}.`;
        
        // Only dispatch error card for critical command failures
        dispatch({ type: 'SET_WEBCONTAINER_ERROR', payload: { error: { message: errorTail } } });
      }
      
      dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[31mCommand failed with exit code ${exitCode}\x1b[0m\r\n` } });
      return false;
    }
    // For non-dev commands that complete, ensure status is idle
    if (!(command === 'npm' && args.includes('dev'))) {
      dispatch({ type: 'SET_WEBCONTAINER_STATUS', payload: { status: 'idle' } });
      // Clear interactive refs for completed processes
      runningProcessRef.current = null;
      try { inputWriterRef.current?.releaseLock?.(); } catch {}
      inputWriterRef.current = null;
    }
    return true;
  }, [dispatch]);

  const runInstall = useCallback(async (clearTerminal: boolean = true) => {
    dispatch({ type: 'SET_WEBCONTAINER_STATUS', payload: { status: 'installing' } });
    return await runCommand('npm', ['install'], clearTerminal);
  }, [dispatch, runCommand]);

  const runBuild = useCallback(async (clearTerminal: boolean = false) => {
    // Keep status unchanged; just emit to terminal
    return await runCommand('npm', ['run', 'build'], clearTerminal);
  }, [runCommand]);

  const runDevServer = useCallback(async (clearTerminal: boolean = false) => {
    return await runCommand('npm', ['run', 'dev'], clearTerminal);
  }, [runCommand]);

  // Full reset to avoid any state leakage between projects
  const resetContainer = useCallback(async () => {
    try {
      // Kill running dev server if any
      if (runningProcessRef.current) {
        try { await runningProcessRef.current.kill(); } catch {}
        runningProcessRef.current = null;
      }
      try { inputWriterRef.current?.releaseLock?.(); } catch {}
      inputWriterRef.current = null;
      // Clear UI state: terminal, url, error, status
      dispatch({ type: 'CLEAR_TERMINAL_OUTPUT' });
      dispatch({ type: 'SET_WEBCONTAINER_URL', payload: { url: null } });
      dispatch({ type: 'CLEAR_WEBCONTAINER_ERROR' });
      dispatch({ type: 'SET_WEBCONTAINER_STATUS', payload: { status: 'idle' } });

      // Teardown container instance if possible for a fresh FS
      const wc = webContainerRef.current;
      if (wc && typeof (wc as any).teardown === 'function') {
        try { await (wc as any).teardown(); } catch {}
      }
    } finally {
      // Drop references and singleton so next boot is a clean instance
      webContainerRef.current = null;
      webContainerSingleton = null;
      bootingPromise = null;
    }
  }, [dispatch]);

  return { mountFiles, runInstall, runBuild, runDevServer, resetContainer, writeToTerminal, resizeTerminal };
};
