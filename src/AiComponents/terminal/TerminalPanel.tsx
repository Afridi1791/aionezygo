import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
export interface TerminalRef { reloadStyles: () => void }

interface TerminalProps {
  className?: string;
  readonly?: boolean;
  id: string;
  theme?: unknown;
  onTerminalReady?: (terminal: XTerm) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

// Exact old-model theme via CSS variables
const cssVar = (token: string) => {
  try {
    const style = getComputedStyle(document.documentElement);
    const v = style.getPropertyValue(token);
    return v || undefined;
  } catch {
    return undefined;
  }
};

const getTerminalTheme = (
  overrides?: Partial<NonNullable<XTerm['options']['theme']>>,
): NonNullable<XTerm['options']['theme']> => ({
  cursor: cssVar('--finova-elements-terminal-cursorColor'),
  cursorAccent: cssVar('--finova-elements-terminal-cursorColorAccent'),
  foreground: cssVar('--finova-elements-terminal-textColor'),
  background: cssVar('--finova-elements-terminal-backgroundColor'),
  selectionBackground: cssVar('--finova-elements-terminal-selection-backgroundColor'),
  selectionForeground: cssVar('--finova-elements-terminal-selection-textColor'),
  selectionInactiveBackground: cssVar('--finova-elements-terminal-selection-backgroundColorInactive'),
  black: cssVar('--finova-elements-terminal-color-black'),
  red: cssVar('--finova-elements-terminal-color-red'),
  green: cssVar('--finova-elements-terminal-color-green'),
  yellow: cssVar('--finova-elements-terminal-color-yellow'),
  blue: cssVar('--finova-elements-terminal-color-blue'),
  magenta: cssVar('--finova-elements-terminal-color-magenta'),
  cyan: cssVar('--finova-elements-terminal-color-cyan'),
  white: cssVar('--finova-elements-terminal-color-white'),
  brightBlack: cssVar('--finova-elements-terminal-color-brightBlack'),
  brightRed: cssVar('--finova-elements-terminal-color-brightRed'),
  brightGreen: cssVar('--finova-elements-terminal-color-brightGreen'),
  brightYellow: cssVar('--finova-elements-terminal-color-brightYellow'),
  brightBlue: cssVar('--finova-elements-terminal-color-brightBlue'),
  brightMagenta: cssVar('--finova-elements-terminal-color-brightMagenta'),
  brightCyan: cssVar('--finova-elements-terminal-color-brightCyan'),
  brightWhite: cssVar('--finova-elements-terminal-color-brightWhite'),
  ...(overrides || {}),
});

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className, readonly, id, theme, onTerminalReady, onTerminalResize }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm | null>(null);
      const [menu, setMenu] = useState<{ x: number; y: number; open: boolean }>({ x: 0, y: 0, open: false });

      useEffect(() => {
        const element = terminalElementRef.current!;

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        const terminal = new XTerm({
          cursorBlink: true,
          convertEol: true,
          disableStdin: readonly,
          theme: getTerminalTheme(readonly ? { cursor: '#00000000' } : {}),
          fontSize: 12,
          fontFamily: 'Menlo, courier-new, courier, monospace',
        });

        terminalRef.current = terminal;

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.open(element);

        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
          onTerminalResize?.(terminal.cols, terminal.rows);
        });

        resizeObserver.observe(element);

        // debug attach like old model
        try { console.debug(`[Terminal] Attach [${id}]`); } catch {}
        onTerminalReady?.(terminal);

        return () => {
          resizeObserver.disconnect();
          terminal.dispose();
        };
      }, []);

      useEffect(() => {
        const terminal = terminalRef.current!;
        terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});
        terminal.options.disableStdin = readonly;
      }, [theme, readonly]);

      useImperativeHandle(ref, () => ({
        reloadStyles: () => {
          const terminal = terminalRef.current!;
          terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});
        },
      }), [readonly]);

      // Context menu handlers
      useEffect(() => {
        const onGlobalClick = () => setMenu(m => ({ ...m, open: false }));
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(m => ({ ...m, open: false })); };
        window.addEventListener('click', onGlobalClick);
        window.addEventListener('contextmenu', onGlobalClick);
        window.addEventListener('keydown', onEsc);
        return () => {
          window.removeEventListener('click', onGlobalClick);
          window.removeEventListener('contextmenu', onGlobalClick);
          window.removeEventListener('keydown', onEsc);
        };
      }, []);

      const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY, open: true });
      };

      const doCopy = async () => {
        const term = terminalRef.current;
        const sel = term?.getSelection?.() ?? '';
        if (sel) {
          try { await navigator.clipboard.writeText(sel); } catch {}
        }
        setMenu(m => ({ ...m, open: false }));
      };
      const doClear = () => {
        try { terminalRef.current?.clear(); } catch {}
        setMenu(m => ({ ...m, open: false }));
      };
      const doSelectAll = () => {
        try { terminalRef.current?.selectAll(); } catch {}
        setMenu(m => ({ ...m, open: false }));
      };

      return (
        <div className={className} ref={terminalElementRef} onContextMenu={handleContextMenu}>
          {menu.open && (
            <div
              style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 9999 }}
              className="bg-neutral-900 border border-neutral-700 rounded-md shadow-lg text-sm text-neutral-200"
            >
              <button className="block px-3 py-1 hover:bg-neutral-800 w-full text-left" onClick={doCopy}>Copy</button>
              <button className="block px-3 py-1 hover:bg-neutral-800 w-full text-left" onClick={doClear}>Clear</button>
              <button className="block px-3 py-1 hover:bg-neutral-800 w-full text-left" onClick={doSelectAll}>Select All</button>
            </div>
          )}
        </div>
      );
    },
  ),
);

export default Terminal;
