export const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // The result is a data URL: "data:[<mime-type>];base64,[<data>]"
            const [header, data] = result.split(',');
            if (!header || !data) {
                return reject(new Error("Invalid data URL format."));
            }
            const mimeTypeMatch = header.match(/:(.*?);/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
            resolve({ data, mimeType });
        };
        reader.onerror = error => reject(error);
    });
};

export const processFileList = async (files: FileList): Promise<{ path: string; content: string }[]> => {
    const fileEntries = Array.from(files);
    if (fileEntries.length === 0) return [];
    
    // Enhanced ignore patterns based on user requirements
    const shouldIgnoreFile = (filePath: string): boolean => {
        const path = filePath.toLowerCase();
        
        // Ignore directories and files
        const ignorePatterns = [
            // Logs
            /\.log$/,
            /npm-debug\.log/,
            /yarn-debug\.log/,
            /yarn-error\.log/,
            /firebase-debug/,
            
            // Firebase cache and config
            /\.firebase\//,
            
            // Runtime data
            /\.pid$/,
            /\.seed$/,
            /\.pid\.lock$/,
            
            // Coverage and test directories
            /\/coverage\//,
            /\.nyc_output\//,
            /lib-cov\//,
            
            // Build and dependency directories
            /\/build\/release\//,
            /\/node_modules\//,
            /\/bower_components\//,
            
            // Cache directories
            /\.npm\//,
            /\.eslintcache$/,
            /\.node_repl_history$/,
            
            // Package files
            /\.tgz$/,
            /\.yarn-integrity$/,
            
            // DataConnect generated files
            /\.dataconnect\//,
            
            // Git and other VCS
            /\.git\//,
            
            // Grunt intermediate storage
            /\.grunt\//,
            
            // WAF configuration
            /\.lock-wscript$/,
            
            // Binary and media files
            /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|wasm)$/,
        ];
        
        // Check if file should be ignored
        return ignorePatterns.some(pattern => pattern.test(path));
    };
    
    const filePromises = fileEntries
        .filter(file => {
            if (!file.webkitRelativePath) return false;
            if (file.size > 10 * 1024 * 1024) return false; // Skip files larger than 10MB
            if (shouldIgnoreFile(file.webkitRelativePath)) return false;
            return true;
        })
        .map(async (file) => {
            try {
                const content = await file.text();
                return { path: file.webkitRelativePath, content };
            } catch (e) {
                console.warn(`Could not read file ${file.webkitRelativePath} as text. Skipping.`, e);
                return null;
            }
        });
        
    const results = (await Promise.all(filePromises)).filter(Boolean) as { path: string, content: string }[];
    
    if (results.length === 0) return [];

    const firstPathParts = results[0].path.split('/');
    if (firstPathParts.length <= 1) { // No common directory
        return results;
    }
    const rootDir = `${firstPathParts[0]}/`;
    
    // If all paths start with the same root directory, strip it
    if (results.every(file => file.path.startsWith(rootDir))) {
        return results.map(file => ({
            ...file,
            path: file.path.substring(rootDir.length),
        }));
    }
    
    return results;
};

export const processDirectoryHandle = async (directoryHandle: FileSystemDirectoryHandle): Promise<{ path: string; content: string }[]> => {
    const fileList: { path: string; content: string }[] = [];
    const directoriesToProcess: { handle: FileSystemDirectoryHandle; path: string }[] = [{ handle: directoryHandle, path: '' }];

    while (directoriesToProcess.length > 0) {
        const { handle, path } = directoriesToProcess.pop()!;
        
        for await (const entry of handle.values()) {
            const entryPath = `${path}${entry.name}`;
            if (entry.kind === 'file') {
                const file = await (entry as FileSystemFileHandle).getFile();
                // Heuristic to ignore binary/large files
                if (file.size < 10 * 1024 * 1024 && !/(\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|wasm)|node_modules)/.test(entryPath)) {
                    try {
                        const content = await file.text();
                        fileList.push({ path: entryPath, content });
                    } catch (e) {
                        console.warn(`Could not read file ${entryPath} as text. Skipping.`, e);
                    }
                }
            } else if (entry.kind === 'directory' && entry.name !== '.git' && entry.name !== 'node_modules') {
                directoriesToProcess.push({ handle: entry as FileSystemDirectoryHandle, path: `${entryPath}/` });
            }
        }
    }
    return fileList;
};

export const typeEffect = (
    text: string, 
    onChunk: (chunk: string) => void,
    chunkSize = 2,
    delay = 16 // roughly 60fps
    ): Promise<void> => {
    return new Promise(resolve => {
        let i = 0;
        const type = () => {
            if (i < text.length) {
                const chunk = text.substring(i, i + chunkSize);
                onChunk(chunk);
                i += chunkSize;
                requestAnimationFrame(type);
            } else {
                resolve();
            }
        };
        requestAnimationFrame(type);
    });
};
