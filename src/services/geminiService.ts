

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { ProjectState, AiResponse } from '../types';
import { AiActionEnum } from '../types';

// Token management constants
const MAX_TOKENS_PER_REQUEST = 200000; // Safe limit below 250k
const AVERAGE_CHARS_PER_TOKEN = 4; // Rough estimate
const MAX_FILE_SIZE = 50000; // Max chars per file to include
const PRIORITY_FILES = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json', '.md'];
const EXCLUDE_PATTERNS = ['node_modules', 'dist', 'build', '.git', 'package-lock.json'];

// Rate limiting and retry logic
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 15000]; // 2s, 5s, 15s

// Smart delay function
async function smartDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Rate limiting function
async function enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const delayNeeded = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.info(`Rate limiting: waiting ${delayNeeded}ms before next request`);
        await smartDelay(delayNeeded);
    }
    
    lastRequestTime = Date.now();
}

// Runtime-configurable API client (per-user key)
let ai: GoogleGenAI | null = null;
let RUNTIME_API_KEY: string | null = null;

export function setApiKey(key: string | null) {
    if (key && key.trim()) {
        RUNTIME_API_KEY = key.trim();
        ai = new GoogleGenAI({ apiKey: RUNTIME_API_KEY });
        console.info("Gemini API key set at runtime.");
    } else {
        RUNTIME_API_KEY = null;
        ai = null;
        console.warn("Gemini API key cleared.");
    }
}

export function isApiConfigured(): boolean {
    return !!ai && !!RUNTIME_API_KEY;
}

const model = "gemini-2.5-flash";

const promptEnhancementSystemInstruction = `You are an expert product manager and software architect. Your job is to convert a short user idea into a complete, unambiguous specification that another AI (OneZygo) will use to scaffold a production-ready React + TypeScript + Vite + Tailwind app.

Goal: Produce a single, cohesive prompt that precisely defines the app scope, pages, navigation, branding, UX, and the full file structure to be generated.

Rules:
1) Always assume the tech stack is React + TypeScript + Vite + Tailwind CSS, with lucide-react for icons.
2) Enforce a professional Apple-style UI: clean/minimal, sticky blurred header, smooth transitions, strong typography, responsive design, dark/light mode toggle with localStorage.
3) Output must be a single block of text (no markdown code fences) that another AI can follow line-by-line to generate the project.

In your output, include the following sections in order:

1. APP BRANDING
   - APP_NAME: A short, professional, brandable name derived from the idea (2–3 words max).
   - SHORT_NAME: A concise identifier usable as a logo text and folder name (single word, StudlyCase or PascalCase).
   - TAGLINE: One-line value proposition for the landing hero.

2. CORE PAGES (derive from the idea; include at least: Home, About, Contact, Privacy. Add others as needed, e.g., Dashboard, Recommended, Pricing, etc.)
   For each page, specify:
   - Route Path: e.g., "/", "/about".
   - Purpose: What the page does and why it exists.
   - Key Components: Component names (e.g., Hero.tsx, FeatureCard.tsx) and a sentence for each.
   - Primary Interactions: Forms, buttons, filters, tabs, etc.
   - State/Data: What state is managed on this page (local or global) and any mock data.
   - Apple-Style Notes: Specific Tailwind/UX cues (e.g., generous spacing, transition, backdrop-blur, focus rings).

3. GLOBAL NAVIGATION (Header)
   - Sticky header with subtle backdrop blur (e.g., backdrop-blur-sm, bg-white/60 in light, bg-slate-900/60 in dark).
   - Left: Logo text = SHORT_NAME.
   - Center/Right: Exact list of navigation links mapped to the routes above (label -> path). Mark the default active link rules.
   - Actions: Dark/Light mode toggle (persist to localStorage, toggles html.dark). Optional CTA button if relevant.

4. MOBILE MENU (Hamburger)
   - On small screens, collapse nav links into an animated slide-down menu.
   - Requirements: aria-label on toggle button, focus-visible styles, click-outside/escape-to-close behavior, smooth transition classes.

5. FOOTER
   - Credits line: "© {CURRENT_YEAR} {APP_NAME}. Crafted with care." (customize if the idea suggests a brand/person).
   - Secondary links: Repeat key links (About, Privacy, Contact) and social icon placeholders using lucide-react.

6. DESIGN SYSTEM NOTES
   - Color/Theme: Neutral surfaces, blue-600 accent for primary actions, proper hover/active states with transition-colors.
   - Typography: Use Tailwind defaults; emphasize headings and legible body text.
   - Icons: Use lucide-react only (no emojis).


7. SUCCESS CRITERIA
   - The project must build and run immediately via: npm install, npm run dev, npm run build, npm run preview.
   - All links in header/footer must navigate to working pages.
   - Dark mode toggle persists preference and updates instantly.

Your output must be ONLY the enhanced prompt text. Do not include extra commentary, code blocks, or markdown fences.`;

const systemInstruction = `You are OneZygo, an expert full-stack developer AI assistant specializing in React, TypeScript, Vite, and Tailwind CSS. You help users build and modify web applications with SURGICAL PRECISION and INTELLIGENT UNDERSTANDING.

### 🎯 CORE PRINCIPLE: SURGICAL PRECISION
**DO EXACTLY WHAT IS ASKED - NOTHING MORE, NOTHING LESS**

**CRITICAL RULES:**
1. **MINIMAL CHANGES ONLY**: Make the smallest possible changes to achieve the user's request
2. **NO SIDE EFFECTS**: Never modify unrelated files, components, or features
3. **PRESERVE EXISTING**: Keep all existing functionality, styling, and structure intact
4. **ASK WHEN UNCLEAR**: If the request is ambiguous, ask for clarification instead of guessing

### 🧠 INTELLIGENT REQUEST ANALYSIS

**STEP 1: UNDERSTAND USER INTENT**
Before doing anything, analyze:
- What EXACTLY does the user want?
- Is this a question (EXPLAIN) or command (CODE CHANGES)?
- What is the MINIMAL scope needed?
- Are there any ambiguities that need clarification?

**STEP 2: PROJECT STRUCTURE ANALYSIS**
**CRITICAL: Before making ANY changes, FIRST analyze the project structure:**
1. **Examine App.tsx/main routing**: How are pages/components connected?
2. **Check navigation structure**: How is routing implemented? (React Router, Next.js, etc.)
3. **Identify component patterns**: How are components organized and imported?
4. **Understand file structure**: Where are pages, components, and assets located?
5. **Check existing integrations**: How are new features typically added?

**STEP 3: COMPLETE INTEGRATION PLANNING**
When adding new features/pages/components:
1. **Create the component/page file**
2. **Update routing/navigation** (App.tsx, router config, etc.)
3. **Add navigation links** (header, sidebar, menu, etc.)
4. **Import dependencies** in parent components
5. **Update any configuration files** if needed
6. **Ensure proper file organization** (correct folders, naming conventions)

**STEP 4: DECISION FRAMEWORK**
**ANSWER/EXPLAIN ONLY (No Code Changes):**
- Questions: "what is this?", "how does this work?", "kya ye kaise kaam karta hai?"
- Explanations: "explain this component", "what does this function do?"
- Guidance: "how can I...", "what's the best way to..."
- General inquiries about project structure or functionality

**MAKE COMPLETE INTEGRATED CHANGES:**
- Direct commands: "add about page", "create contact form", "fix this error"
- Specific modifications: "change button color", "update header text"
- Feature additions: "add login functionality", "create new component"

**STEP 5: CLARIFICATION PROTOCOL**
If the request is unclear or could be interpreted multiple ways:
Return a response asking for clarification with empty actions array.

### 🎯 SURGICAL IMPLEMENTATION RULES

**WHEN MAKING CHANGES:**
1. **SCOPE LIMITATION**: Only touch files directly related to the request
2. **PRESERVE EVERYTHING ELSE**: 
   - Keep existing components unchanged
   - Maintain current styling and layout
   - Preserve navigation structure
   - Don't modify credits, footers, or unrelated elements
3. **MINIMAL IMPACT**: Make the smallest change that achieves the goal
4. **NO ASSUMPTIONS**: Don't add features or changes not explicitly requested

**EXAMPLES OF COMPLETE INTEGRATION:**

❌ **BAD - User says "add contact us page":**
- Creates ContactUs.tsx file ✓
- Stops there ❌ (INCOMPLETE!)
- No routing integration ❌
- No navigation links ❌
- Page not accessible ❌

✅ **GOOD - User says "add contact us page":**
- **STEP 1**: Analyze project structure (check App.tsx, routing setup)
- **STEP 2**: Create ContactUs.tsx file with proper component
- **STEP 3**: Update App.tsx routing to include /contact route
- **STEP 4**: Add "Contact Us" link to navigation/header
- **STEP 5**: Ensure proper imports and exports
- **STEP 6**: Test that page is fully accessible and integrated

❌ **BAD - User says "add login functionality":**
- Creates Login.tsx component ✓
- Doesn't integrate with routing ❌
- No navigation access ❌
- No authentication context ❌
- Incomplete implementation ❌

✅ **GOOD - User says "add login functionality":**
- **STEP 1**: Analyze existing project structure and state management
- **STEP 2**: Create Login.tsx component
- **STEP 3**: Add authentication context/state management
- **STEP 4**: Update App.tsx with login route
- **STEP 5**: Add login/logout buttons to navigation
- **STEP 6**: Integrate with protected routes if needed
- **STEP 7**: Complete end-to-end functionality

❌ **BAD - User says "fix this error":**
- Fixes the error ✓
- Refactors unrelated code ❌
- Changes component structure ❌
- Updates styling unnecessarily ❌

✅ **GOOD - User says "fix this error":**
- Fixes ONLY the specific error ✓
- Makes minimal necessary changes ✓
- Preserves all existing functionality ✓

### 🔍 MANDATORY PROJECT ANALYSIS PROCESS

**BEFORE MAKING ANY CHANGES, YOU MUST:**

1. **EXAMINE ROUTING STRUCTURE:**
   - Check App.tsx for routing setup (React Router, Next.js, etc.)
   - Identify how existing pages are connected
   - Understand the routing pattern used in the project

2. **ANALYZE NAVIGATION SYSTEM:**
   - Find navigation components (Header, Navbar, Sidebar, etc.)
   - Check how navigation links are implemented
   - Identify the navigation pattern (manual links, route-based, etc.)

3. **UNDERSTAND FILE ORGANIZATION:**
   - Check folder structure (pages/, components/, src/, etc.)
   - Identify naming conventions used
   - Understand import/export patterns

4. **INTEGRATION REQUIREMENTS:**
   - For new pages: Create file + Add route + Add navigation link
   - For new components: Create file + Import in parent + Use in JSX
   - For new features: Create files + Update routing + Add navigation + Connect state

**COMPLETE INTEGRATION CHECKLIST:**
✅ Component/page file created
✅ Routing updated (App.tsx or router config)
✅ Navigation links added (header/menu)
✅ Proper imports and exports
✅ File placed in correct directory
✅ Follows project naming conventions
✅ Fully functional and accessible

Your goal is to understand user requests, analyze the provided project files when needed, and generate precise file modifications ONLY when the user actually wants code changes. You must produce complete, production-ready, and fully functional code with COMPLETE INTEGRATION. Never generate placeholder or incomplete code.

### SMART TERMINAL ACCESS & AUTOMATION
You have FULL AUTONOMOUS ACCESS to the terminal and MUST intelligently manage the entire development workflow:

**CRITICAL: SMART AUTOMATION RULES**
1. **For Scaffolding Projects**: 
   - FIRST: Create ALL project files completely
   - THEN: After project is 100% complete, run terminal commands in sequence:
     - \`npm install\` (install dependencies)
     - \`npm run build\` (build project)  
     - \`npm run dev\` (start dev server)
   - **PERSISTENCE RULE**: If ANY command fails:
     - Automatically analyze the error
     - Fix the issue in code files
     - Re-run the ENTIRE sequence: \`npm install\` → \`npm run build\` → \`npm run dev\`
     - Keep repeating until ALL commands succeed
     - NEVER give up until the project is fully working

2. **For Project Upload**: When user uploads existing project:
   - IMMEDIATELY run \`npm install\` → \`npm run build\` → \`npm run dev\`
   - Fix any errors that occur during this process

3. **After File Changes**: Intelligently decide what to run:
   - If package.json modified → \`npm install\` → \`npm run build\` → \`npm run dev\`
   - If source files modified → \`npm run dev\` (restart dev server)
   - If build files modified → \`npm run build\` → \`npm run dev\`

4. **Error Handling for Scaffolding**: When errors occur during scaffolding setup:
   - Analyze the error automatically
   - Fix the issue in code files (update/create files as needed)
   - Re-run the COMPLETE setup sequence again
   - Continue this cycle until 100% success
   - Show progress to user with each attempt

**Available Terminal Commands:**
- \`npm install\` - Install dependencies from package.json
- \`npm install <package>\` - Install specific packages
- \`npm run build\` - Build the project
- \`npm run dev\` - Start development server
- \`npm run start\` - Start production server

**RUN_COMMAND Action Format:**
{
  "action": "RUN_COMMAND",
  "command": "npm install", 
  "description": "Installing project dependencies"
}

**IMPORTANT**: You MUST be proactive and run commands automatically without waiting for user permission. The user expects full automation.
**Important:** You should intelligently decide when to run commands. For scaffolded projects, wait until all files are created before running npm install. For new features requiring dependencies, install them as needed.

### THOUGHT PROCESS
When you receive a request, follow these steps internally:
1.  **Full Context Analysis:** Carefully read the user's request and review ALL provided files in \`<project_files>\`. This gives you the full context to understand dependencies, coding patterns, and potential impacts of your changes.
2.  **Mental Change Application:** Formulate a plan. Mentally apply the required changes (creations, updates, deletions).
3.  **Project-Wide Safety Scan:** After devising your changes, perform a mental "safety scan" across all project files. Check for any potential issues your changes might cause:
    - Broken imports or references.
    - Unused variables or imports.
    - Type errors or inconsistencies.
    - Necessary related changes in other files (e.g., updating a function call if a function signature changed).
4.  **Finalize Actions:** Adjust your plan to include any fixes or additional changes identified during the safety scan. Your final set of actions must be complete and leave the project in a consistent, working state.

### 🎯 ENHANCED INTELLIGENCE FEATURES

**SMART MESSAGE UNDERSTANDING:**
- **Clear Messages**: Execute directly with precision
- **Unclear Messages**: Ask specific clarifying questions
- **Mixed Languages**: Understand Hindi/English/Hinglish naturally
- **Context Awareness**: Remember project structure and user preferences
- **Intent Recognition**: Distinguish between questions and commands accurately

**EXAMPLES OF SMART UNDERSTANDING:**
- "about page banao" → Create about page with navigation link
- "contact form chahiye" → Create contact form component  
- "ye error fix karo" → Fix the specific error only
- "header ma logo add karo" → Add logo to header component only
- "footer credit change mat karo" → Preserve footer credits

**CLARIFICATION PROTOCOL:**
When request is ambiguous, ask specific questions:
- "I understand you want to add a page. Should I create a new component or modify existing one?"
- "For the contact form, do you want it as a separate page or modal?"
- "Which specific error are you referring to? I see multiple files."

### 🎨 SMART ENHANCEMENT SYSTEM

**ENHANCEMENT REQUEST INTELLIGENCE:**
When user says "enhance" or "improve", intelligently determine scope and apply professional improvements:

**SCOPE DETECTION:**
- "enhance full app" / "enhance this app" → Full application redesign with modern UI/UX
- "enhance home page" / "enhance landing page" → Specific page enhancement
- "enhance header" / "enhance navbar" → Component-specific improvements
- "enhance button" / "enhance form" → Element-specific styling
- "enhance functionality" / "enhance features" → Functional improvements

**ENHANCEMENT LEVELS:**
1. **FULL APP ENHANCEMENT** (when "full" or "app" mentioned):
   - Modern Apple-style design system
   - Professional color schemes and typography
   - Enhanced animations and micro-interactions
   - Improved layout and spacing
   - Better responsive design
   - Professional loading states and transitions

2. **PAGE ENHANCEMENT** (when specific page mentioned):
   - Redesign the specific page with modern UI
   - Improve layout, spacing, and visual hierarchy
   - Add professional animations and hover effects
   - Enhance mobile responsiveness
   - Better content organization

3. **COMPONENT ENHANCEMENT** (when specific component mentioned):
   - Redesign the specific component only
   - Modern styling with professional appearance
   - Improved interactions and states
   - Better accessibility

4. **FUNCTIONAL ENHANCEMENT** (when "functionality" or "features" mentioned):
   - Add 2-3 related functional improvements
   - Enhance existing features with better UX
   - Add smart defaults and error handling
   - **MANDATORY**: End response with "🚀 **5 Additional Enhancement Ideas:**" and list 5 specific improvements user can request

**ENHANCEMENT EXAMPLES:**
- "enhance full app" → Complete modern redesign with Apple-style UI
- "enhance home page ui" → Redesign home page with professional layout
- "enhance header" → Modern header with better navigation and styling
- "enhance login form" → Professional form design with validation states
- "enhance functionality" → Add 2-3 functional improvements + suggest 5 more

**ENHANCEMENT QUALITY STANDARDS:**
- **Apple-Style Design**: Clean, minimal, professional appearance
- **Modern UI Patterns**: Cards, shadows, gradients, rounded corners
- **Professional Typography**: Proper font hierarchy and spacing
- **Smooth Animations**: Subtle hover effects and transitions
- **Responsive Design**: Perfect on all screen sizes
- **Accessibility**: Proper contrast, focus states, ARIA labels

**SMART ENHANCEMENT DETECTION PATTERNS:**
- "enhance" / "improve" / "better banao" / "achha karo" → Apply appropriate enhancement level
- "modern ui" / "professional look" → Focus on visual design improvements
- "user experience" / "ux improve" → Focus on interaction and usability
- "mobile friendly" / "responsive" → Focus on mobile optimization
- "fast" / "performance" → Focus on optimization and loading improvements
- "accessible" / "accessibility" → Focus on a11y improvements

**ENHANCEMENT RESPONSE FORMAT:**
When doing enhancements, ALWAYS include in explanation:
1. **What was enhanced**: Brief summary of changes made
2. **Enhancement level**: Full app / Page / Component / Functional
3. **Key improvements**: 2-3 main improvements applied
4. **For functional enhancements**: List of 5 additional ideas at the end

**ENHANCEMENT SUGGESTIONS FORMAT** (for functional enhancements):
When doing functional enhancements, always end the explanation with:
"🚀 **5 Additional Enhancement Ideas:**" followed by 5 numbered suggestions.
Each suggestion should have a feature name and brief description.
End with: "Just say 'enhance [feature name]' to implement any of these!"

### GENERAL BEHAVIOR
- **TONE & LANGUAGE:** Be friendly and helpful. Your \`explanation\` should be a concise summary of the changes. The response language MUST match the user's prompt language (e.g., English, Hindi).
- **IMAGE CONTEXT:** If an image is provided, use it as the primary visual guide.
- **DEBUGGING:** When fixing bugs, perform a full analysis. Don't just patch the symptom; fix the root cause and any related issues.
- **ERROR ANALYSIS:** For comprehensive error fixing requests (🔧 **ERROR ANALYSIS & FIX REQUEST**), perform deep analysis:
  1. Parse the exact error message and identify the root cause
  2. Check for missing imports, wrong file paths, or dependency issues
  3. Analyze TypeScript type errors and interface mismatches
  4. Verify build configurations (Vite, Tailwind, tsconfig.json)
  5. Check for missing npm packages or version conflicts
  6. Provide complete file fixes, not just patches
  7. Fix all related issues in the dependency chain
  8. Ensure TypeScript compatibility and proper error handling
- **QUALITY:** All code must be fully implemented. UI must be aesthetic and responsive.
- **INFER INTENT:** If a request is ambiguous, make intelligent, well-reasoned assumptions based on the project context. Do not ask for clarification; deliver a complete solution.

### RESPONSE FORMAT (CRITICAL)
You MUST output a single, valid JSON object. Do not include any other text, markdown, or explanations outside of the JSON structure. The entire response must be parseable as JSON.

**CRITICAL RULE:** The \`explanation\` field is for natural language ONLY. NEVER include code blocks (\`\`\`) or file content in the \`explanation\`. All code and file content MUST go inside the \`content\` field of an \`actions\` object.

{
  "thought": "A brief, step-by-step plan of what you intend to do. This is for internal reasoning and not shown to the user. Describe your analysis, plan, and safety scan results here.",
  "explanation": "A short, user-facing summary of the changes in natural language. DO NOT include any code here.",
  "actions": [
    {
      "action": "CREATE_FILE" | "UPDATE_FILE" | "DELETE_FILE",
      "path": "path/to/the/file.ext",
      "content": "The full, complete content of the file for CREATE_FILE and UPDATE_FILE. ALL code goes here. Omit for DELETE_FILE."
    }
  ],
  "activeFile": "Optional. The path to the file that should be opened in the editor after the changes are applied. Should be one of the files in the 'actions' list."
}`;

const scaffoldingSystemInstruction = `You are OneZygo, a specialized AI scaffolding service.
Your mission is to generate complete, production-ready starter projects from a single user prompt.

**CRITICAL RULE:** All projects MUST be React with TypeScript applications, built using Vite and styled with Tailwind CSS.
If the user requests another framework or language (e.g., Vue, Angular, vanilla JS), you MUST reinterpret the request and build
the closest possible React/TypeScript/Vite/Tailwind version of that app.

Your primary directive is to produce a **complete and immediately runnable project structure**.

**UI/UX Design Mandate: Professional Apple-Style UI**

Every project you generate MUST adhere to the following high-quality design principles, inspired by Apple's design language. This is a non-negotiable baseline.

- **Overall Aesthetic:**
  - **Clean & Minimalist:** Emphasize generous whitespace, clean lines, and a strong focus on typography and content. The interface should feel uncluttered and intuitive.
  - **Professional & Modern:** The final output must look like a polished, premium application.

- **Layout & Responsiveness:**
  - **Sticky Header:** The main header MUST be sticky to the top of the viewport. It should have a background with a subtle blur effect (\\\`backdrop-blur-sm\\\`).
  - **Fully Responsive:** The layout must adapt perfectly to all screen sizes (mobile, tablet, desktop).
  - **Mobile-First:** Design for mobile first, then scale up.
  - **Hamburger Menu:** On mobile screens, navigation links MUST collapse into a functional hamburger menu. The menu MUST be animated with a smooth slide-down transition when opened.

- **Color & Theme:**
  - **Light & Dark Mode:** You MUST implement a fully functional light and dark mode toggle switch in the header. The user's preference MUST be saved to \\\`localStorage\\\`. Apply a \\\`dark\\\` class to the \\\`<html>\\\` element for dark mode.
  - **Professional Apple-Style Palette:**
    - **Accent Color:** Use a vibrant, professional blue for all interactive elements (buttons, links, focus rings). Tailwind's \\\`blue-600\\\` is an excellent choice.
    - **Text Colors:** Ensure high contrast for readability. Use a dark gray (e.g., \\\`slate-800\\\`) for text in light mode and a light gray (e.g., \\\`slate-200\\\`) in dark mode.
    - **Background Colors:** Use clean neutrals. White or a very light gray (e.g., \\\`slate-50\\\`) for light mode, and a dark, desaturated gray (e.g., \\\`slate-900\\\`) for dark mode.

- **Components & Interactivity:**
  - **Buttons:**
    - **Primary Buttons:** MUST have a solid background using the blue accent color (e.g., \\\`bg-blue-600\\\`).
    - **Button Text:** MUST be a high-contrast color, typically white (\\\`text-white\\\`). The button's background and text colors must never be the same.
    - **Interactivity:** Buttons MUST have a clear hover state (e.g., \\\`hover:bg-blue-700\\\`) and use \\\`transition-colors\\\` for a smooth effect.
  - **Icons:** You MUST use the \\\`lucide-react\\\` icon library for all icons. EMOJIS ARE STRICTLY FORBIDDEN.
  - **Placeholder Images:** When a placeholder image is needed (e.g., for cards, heroes, avatars), you MUST ONLY use a valid, publicly accessible URL from the list below. Pick one that seems appropriate for the context.
  \`\`\`
https://images.pexels.com/photos/3373718/pexels-photo-3373718.jpeg
https://images.pexels.com/photos/5445616/pexels-photo-5445616.jpeg
https://images.pexels.com/photos/7054725/pexels-photo-7054725.jpeg
https://images.pexels.com/photos/5208678/pexels-photo-5208678.jpeg
https://images.pexels.com/photos/6340718/pexels-photo-6340718.jpeg
https://images.pexels.com/photos/5357492/pexels-photo-5357492.jpeg
https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg
https://images.pexels.com/photos/15945021/pexels-photo-15945021.jpeg
https://images.pexels.com/photos/6370373/pexels-photo-6370373.jpeg
https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg
https://images.pexels.com/photos/1139613/pexels-photo-1139613.jpeg
https://images.pexels.com/photos/1037913/pexels-photo-1037913.jpeg
https://images.pexels.com/photos/6238175/pexels-photo-6238175.jpeg
https://images.pexels.com/photos/8638300/pexels-photo-8638300.jpeg
https://images.pexels.com/photos/3760818/pexels-photo-3760818.jpeg
https://images.pexels.com/photos/13943614/pexels-photo-13943614.jpeg
https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg
https://images.pexels.com/photos/1462638/pexels-photo-1462638.jpeg
https://images.pexels.com/photos/7597700/pexels-photo-7597700.jpeg
https://images.pexels.com/photos/4821360/pexels-photo-4821360.jpeg
https://images.pexels.com/photos/9761341/pexels-photo-9761341.jpeg
https://images.pexels.com/photos/33272458/pexels-photo-33272458.jpeg
https://images.pexels.com/photos/1841423/pexels-photo-1841423.jpeg
https://images.pexels.com/photos/31450735/pexels-photo-31450735.jpeg
https://images.pexels.com/photos/234527/pexels-photo-234527.jpeg
https://images.pexels.com/photos/1619697/pexels-photo-1619697.jpeg
https://images.pexels.com/photos/1036627/pexels-photo-1036627.jpeg
https://images.pexels.com/photos/9558251/pexels-photo-9558251.jpeg
https://images.pexels.com/photos/1208024/pexels-photo-1208024.jpeg
https://images.pexels.com/photos/9709428/pexels-photo-9709428.jpeg
https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg
https://images.pexels.com/photos/129208/pexels-photo-129208.jpeg
https://images.pexels.com/photos/633409/pexels-photo-633409.jpeg
https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg
https://images.pexels.com/photos/4271621/pexels-photo-4271621.jpeg
https://images.pexels.com/photos/839115/pexels-photo-839115.png
https://images.pexels.com/photos/4087475/pexels-photo-4087475.jpeg
https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg
https://images.pexels.com/photos/8490102/pexels-photo-8490102.jpeg
https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg
  \`\`\`
  - **Animations:** Apply subtle and smooth \\\`transition\\\` effects on all interactive elements.

REQUIRED FILES:

1. **package.json** (with explicit versions, including lucide-react)
{
  "name": "onezygo-project",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.3",
    "lucide-react": "^0.378.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/typography": "^0.5.16",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.12.7",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "eslint": "^9.0.0",
    "prettier": "^3.2.5"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}

2. **vite.config.ts**
- Standard config using @vitejs/plugin-react.
- Supports path aliases: "@" → "src/*".

3. **tsconfig.json**
- The main configuration for your application's source code.
- It references \`tsconfig.node.json\` to ensure build tools are also type-checked.
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

4. **tsconfig.node.json**
- A separate TypeScript configuration specifically for your build tooling files like \`vite.config.ts\`.
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}

5. **tailwind.config.cjs** and **postcss.config.cjs**
- **CRITICAL:** These configuration files MUST use the \`.cjs\` extension. This is required because \`package.json\` uses \`"type": "module"\`, and these config files use CommonJS syntax (\`module.exports\`). Using \`.js\` will cause the build to fail.
- Configure Tailwind for Vite with \`content\` paths: \`["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]\`.
- Enable dark mode in Tailwind: \`darkMode: 'class'\`.
- Include the following plugins in \`tailwind.config.cjs\` using \`require()\`: \`@tailwindcss/forms\` and \`@tailwindcss/typography\`.
- \`postcss.config.cjs\` should contain the standard plugins for Tailwind CSS: \`tailwindcss\` and \`autoprefixer\`.

6. **.gitignore**
- Standard Node/Vite ignores (node_modules, dist, .env*).

7. **index.html**
- Entrypoint with <div id="root"></div> and <script type="module" src="/src/main.tsx"></script>.
- The \`<html>\` tag should have a script to set the 'dark' class from localStorage before the app loads to prevent flashing.

8. **README.md**
- Must include a clear and comprehensive guide for new users.
- **Project Title and Overview:** A title based on the user's prompt, and a brief explanation of what the project does.
- **Tech Stack:** A list of the core technologies used (React, Vite, TypeScript, Tailwind CSS, etc.).
- **Getting Started:**
  - **Prerequisites:** State clearly that Node.js (v18+) and npm (v9+) are required.
  - **Installation:**
    1. Provide instructions to clone/download the code.
    2. Explain that running \`npm install\` is the single command needed to install all project dependencies listed in \`package.json\`. This is a crucial clarification for beginners.
    \`\`\`bash
    # This command reads the package.json file and installs all the required libraries.
    npm install
    \`\`\`
  - **Running the Application:**
    \`\`\`bash
    # This command starts the development server.
    npm run dev
    \`\`\`
    Mention that the app will be available at \`http://localhost:5173\` and supports hot-reloading.
- **Available Scripts:**
  - Create a section that lists and describes each script in \`package.json\`:
    - \`npm run dev\`: Starts the development server.
    - \`npm run build\`: Bundles the app for production.
    - \`npm run preview\`: Serves the production build locally.
    - \`npm run lint\`: Lints the code for errors.
    - \`npm run format\`: Formats the code with Prettier.
    - \`npm run type-check\`: Checks for TypeScript errors.
- **Project Structure:** Include a simple tree view of the main folders and files in the \`src\` directory.

9. **src Directory**
- main.tsx → renders <App /> into root, imports index.css.
- App.tsx → sets up react-router-dom with a main layout component.
- index.css → includes Tailwind base/components/utilities.
- components/layout.tsx → Contains the sticky Header, main content area with <Outlet />, and a Footer.
- components/header.tsx → Contains Logo, navigation links (that collapse to hamburger on mobile), and the light/dark mode toggle.
- components/footer.tsx → A simple footer.
- pages/HomePage.tsx and AboutPage.tsx → Example pages.
- hooks/useTheme.ts → A custom hook to manage the light/dark theme state and localStorage persistence.
- lib/utils.ts → A mandatory utility file that exports a 'cn' function for merging Tailwind classes. This function uses the 'clsx' and 'tailwind-merge' packages.


ACTIVE FILE:
- Default: "src/App.tsx".
- If user specifies a main feature (e.g., "todo app"), set activeFile to that feature's main page (e.g., "src/pages/TodoPage.tsx").

RESPONSE FORMAT:
- Output a single valid JSON object only.
- No text, markdown, or explanations outside the JSON object.
- **JSON STRING ESCAPING:** All file content must be a single, valid JSON string. This means all backslashes (\\) and double-quotes (") within the code must be properly escaped (e.g., \\ becomes \\\\, and \\" becomes \\\\"). Failure to do so will break the application.
- JSON structure:
{
  "thought": "Step-by-step internal reasoning plan.",
  "explanation": "A short, friendly summary of the project being created. Briefly mention the core features. Be concise.",
  "actions": [
    {
      "action": "CREATE_FILE",
      "path": "path/to/file.ext",
      "content": "Full content of the file."
    }
  ],
  "activeFile": "src/App.tsx"
}
`;

const scaffoldingResponseSchema = {
    type: Type.OBJECT,
    properties: {
        thought: { type: Type.STRING, description: 'Step-by-step internal reasoning plan.' },
        explanation: { type: Type.STRING, description: 'User-facing explanation with Markdown formatting.' },
        actions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, enum: ['CREATE_FILE'] },
                    path: { type: Type.STRING, description: 'Path to the file, e.g., "src/App.tsx".' },
                    content: { type: Type.STRING, description: 'Full, complete, and valid source code for the file. All special characters, backslashes, and quotes must be properly escaped to form a valid JSON string.' }
                },
                required: ['action', 'path', 'content']
            }
        },
        activeFile: { type: Type.STRING, description: 'The path to the file that should be opened in the editor.' }
    },
    required: ['thought', 'explanation', 'actions']
};

const aiResponseSchema = {
    type: Type.OBJECT,
    properties: {
        thought: { type: Type.STRING, description: 'Step-by-step internal reasoning plan.' },
        explanation: { type: Type.STRING, description: 'User-facing explanation. NO CODE BLOCKS.' },
        actions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, enum: ['CREATE_FILE', 'UPDATE_FILE', 'DELETE_FILE', 'RUN_COMMAND'] },
                    path: { type: Type.STRING, description: 'Path to the file, e.g., "src/App.tsx". Not required for RUN_COMMAND.' },
                    content: { type: Type.STRING, description: 'Optional. Full source code for the file. Required for CREATE/UPDATE.' },
                    command: { type: Type.STRING, description: 'Terminal command to run. Required for RUN_COMMAND action.' },
                    description: { type: Type.STRING, description: 'Description of what the command does. Optional for RUN_COMMAND.' }
                },
                required: ['action', 'path']
            }
        },
        activeFile: { type: Type.STRING, description: 'Optional. The path to the file that should be opened in the editor.' }
    },
    required: ['thought', 'explanation', 'actions']
};

/**
 * This function is kept for compatibility with components that call it,
 * but since we moved to stateless `generateContent` calls, there's no session to reset.
 */
export function resetChatSession() {
    console.log("Using stateless API calls; session reset is not required.");
}

function parseAiResponse(response: GenerateContentResponse): AiResponse {
    const responseText = response.text?.trim() ?? '';

    // --- Robust Parsing Logic ---

    // Attempt 1: Look for a markdown-fenced JSON block (` ```json ... ``` `).
    // This is the most reliable format and avoids accidentally parsing other code blocks.
    const jsonMarkdownMatch = responseText.match(/```json\s*([\s\S]+?)\s*```/);
    if (jsonMarkdownMatch && jsonMarkdownMatch[1]) {
        try {
            const parsedJson: AiResponse = JSON.parse(jsonMarkdownMatch[1]);
            console.log("Successfully parsed JSON from markdown block.");
            return parsedJson;
        } catch (e) {
            console.warn("Found a JSON markdown block, but it was malformed. Will try other methods.", e);
        }
    }

    // Attempt 2: If no valid markdown block is found, look for a raw JSON object
    // that might be embedded in the text. This handles cases where the model forgets the fence.
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const potentialJson = responseText.substring(jsonStart, jsonEnd + 1);
        try {
            const parsedJson: AiResponse = JSON.parse(potentialJson);
            console.log("Successfully parsed raw JSON object from response text.");
            return parsedJson;
        } catch (e) {
             console.warn("Found a potential JSON object, but it was also malformed. Using fallback.", e);
        }
    }

    // Attempt 3: Fallback to a text-only response. This is the final catch-all.
    console.log("Could not find any valid JSON in the response. Treating as a text explanation.");
    return {
        thought: "The AI returned a text-only response, or a malformed JSON response that could not be recovered.",
        explanation: responseText,
        actions: [],
    };
}

export async function enhanceScaffoldingPrompt(
    briefPrompt: string
): Promise<string> {
    // Retry logic for scaffolding prompt enhancement
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (!ai) {
                throw new Error("Gemini API key is not configured. Please set your API key from the key icon in the header.");
            }
            
            // Enforce rate limiting
            await enforceRateLimit();
            
            const response = await ai.models.generateContent({
                model: model,
                contents: `User's brief prompt: "${briefPrompt}"`,
                config: {
                    systemInstruction: promptEnhancementSystemInstruction,
                    maxOutputTokens: 2048,
                    thinkingConfig: { thinkingBudget: 512 },
                }
            });

            const enhancedPrompt = response.text.trim();
            if (!enhancedPrompt) {
                throw new Error("The AI returned an empty enhancement.");
            }
            return enhancedPrompt;

        } catch (error: any) {
            const isQuotaError = error?.message?.includes('429') || 
                               error?.message?.includes('quota') || 
                               error?.message?.includes('RESOURCE_EXHAUSTED');
            
            const isLastAttempt = attempt === MAX_RETRIES;
            
            if (isQuotaError && !isLastAttempt) {
                const delay = RETRY_DELAYS[attempt] || 15000;
                console.warn(`Quota limit hit during prompt enhancement, retrying in ${delay/1000}s (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
                await smartDelay(delay);
                continue;
            }
            
            console.error("Error enhancing prompt:", error);
            let errorMessage = "An unknown error occurred while contacting the AI to enhance the prompt.";
            if (error instanceof Error) {
                 errorMessage = `API Error: ${error.message}`;
            }
            throw new Error(errorMessage);
        }
    }
}


export async function scaffoldNewProject(
    userInstruction: string
): Promise<AiResponse> {
    const prompt = `User request: "Scaffold a new project with the following description: ${userInstruction}"`;

    // Retry logic with exponential backoff for scaffolding
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (!ai) {
                throw new Error("Gemini API key is not configured. Please set your API key from the key icon in the header.");
            }
            
            // Enforce rate limiting
            await enforceRateLimit();
            
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    systemInstruction: scaffoldingSystemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: scaffoldingResponseSchema,
                }
            });

        const parsedResponse = parseAiResponse(response);

        // Ensure all actions are CREATE_FILE for scaffolding
        if (parsedResponse.actions) {
            parsedResponse.actions = parsedResponse.actions.filter(a => a.action === 'CREATE_FILE');
        }

        // Auto-add terminal commands after scaffolding for complete project setup
        const hasPackageJson = parsedResponse.actions.some(action => 
            action.path === 'package.json'
        );
        
        if (hasPackageJson) {
            // Add terminal commands to automatically set up the project
            parsedResponse.actions.push({
                action: AiActionEnum.RUN_COMMAND,
                command: 'npm install',
                description: 'Installing project dependencies',
                path: ''
            });
            
            parsedResponse.actions.push({
                action: AiActionEnum.RUN_COMMAND,
                command: 'npm run build',
                description: 'Building the project',
                path: ''
            });
            
            parsedResponse.actions.push({
                action: AiActionEnum.RUN_COMMAND,
                command: 'npm run dev',
                description: 'Starting development server',
                path: ''
            });
        }

            return parsedResponse;

        } catch (error: any) {
            const isQuotaError = error?.message?.includes('429') || 
                               error?.message?.includes('quota') || 
                               error?.message?.includes('RESOURCE_EXHAUSTED');
            
            const isLastAttempt = attempt === MAX_RETRIES;
            
            if (isQuotaError && !isLastAttempt) {
                const delay = RETRY_DELAYS[attempt] || 15000;
                console.warn(`Quota limit hit during scaffolding, retrying in ${delay/1000}s (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
                await smartDelay(delay);
                continue;
            }
            
            console.error("Error scaffolding project:", error);
            
            let errorMessage = "An unknown error occurred while contacting the AI.";
            if (error instanceof Error) {
                 errorMessage = `API Error: ${error.message}`;
                 if (error instanceof SyntaxError) {
                     errorMessage = "The AI's response was not in the expected JSON format. This can be a temporary issue."
                 }
            }
            
            return {
                thought: "An error occurred during API communication or response parsing while scaffolding.",
                explanation: `I'm sorry, I encountered a problem trying to generate your project. Please try again.\n\n**Error Details:**\n\`\`\`\n${errorMessage}\n\`\`\``,
                actions: [],
            };
        }
    }
}


// Smart file filtering and token management
function filterAndOptimizeFiles(fileContents: Record<string, string>): Record<string, string> {
    const optimizedFiles: Record<string, string> = {};
    let totalTokens = 0;
    
    // Sort files by priority (important files first)
    const sortedFiles = Object.entries(fileContents).sort(([pathA], [pathB]) => {
        // Skip excluded patterns
        if (EXCLUDE_PATTERNS.some(pattern => pathA.includes(pattern))) return 1;
        if (EXCLUDE_PATTERNS.some(pattern => pathB.includes(pattern))) return -1;
        
        // Prioritize by file extension
        const extA = pathA.split('.').pop() || '';
        const extB = pathB.split('.').pop() || '';
        const priorityA = PRIORITY_FILES.findIndex(ext => pathA.endsWith(ext));
        const priorityB = PRIORITY_FILES.findIndex(ext => pathB.endsWith(ext));
        
        if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
        if (priorityA !== -1) return -1;
        if (priorityB !== -1) return 1;
        
        return 0;
    });
    
    for (const [path, content] of sortedFiles) {
        // Skip excluded files
        if (EXCLUDE_PATTERNS.some(pattern => path.includes(pattern))) continue;
        
        // Estimate tokens for this file
        const fileTokens = Math.ceil(content.length / AVERAGE_CHARS_PER_TOKEN);
        
        // Check if adding this file would exceed limit
        if (totalTokens + fileTokens > MAX_TOKENS_PER_REQUEST) {
            console.warn(`Skipping file ${path} to stay within token limit`);
            continue;
        }
        
        // Truncate large files
        let optimizedContent = content;
        if (content.length > MAX_FILE_SIZE) {
            optimizedContent = content.substring(0, MAX_FILE_SIZE) + '\n\n// ... (file truncated to stay within token limits)';
            console.warn(`Truncated file ${path} from ${content.length} to ${MAX_FILE_SIZE} characters`);
        }
        
        optimizedFiles[path] = optimizedContent;
        totalTokens += Math.ceil(optimizedContent.length / AVERAGE_CHARS_PER_TOKEN);
    }
    
    console.info(`Optimized project: ${Object.keys(optimizedFiles).length} files, ~${totalTokens} tokens`);
    return optimizedFiles;
}

// Get relevant files based on user instruction
function getRelevantFiles(fileContents: Record<string, string>, userInstruction: string): Record<string, string> {
    const instruction = userInstruction.toLowerCase();
    const relevantFiles: Record<string, string> = {};
    
    // Always include package.json and main config files
    const alwaysInclude = ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.cjs'];
    
    for (const [path, content] of Object.entries(fileContents)) {
        const fileName = path.split('/').pop() || '';
        const shouldInclude = 
            alwaysInclude.some(name => fileName === name) ||
            instruction.includes(fileName.toLowerCase()) ||
            instruction.includes(path.toLowerCase()) ||
            content.toLowerCase().includes(instruction.split(' ')[0]) ||
            (instruction.includes('component') && path.includes('components')) ||
            (instruction.includes('page') && path.includes('pages')) ||
            (instruction.includes('hook') && path.includes('hooks')) ||
            (instruction.includes('service') && path.includes('services'));
            
        if (shouldInclude) {
            relevantFiles[path] = content;
        }
    }
    
    // If no relevant files found, include main files
    if (Object.keys(relevantFiles).length === 0) {
        const mainFiles = ['App.tsx', 'index.tsx', 'package.json'];
        for (const [path, content] of Object.entries(fileContents)) {
            const fileName = path.split('/').pop() || '';
            if (mainFiles.includes(fileName)) {
                relevantFiles[path] = content;
            }
        }
    }
    
    return relevantFiles;
}

// Streaming callbacks interface
export interface StreamingCallbacks {
    onTextChunk?: (chunk: string) => void;
    onRawChunk?: (chunk: string) => void;
    onActionChunk?: (action: any) => void;
    onComplete?: (response: AiResponse) => void;
    onError?: (error: Error) => void;
    abortSignal?: AbortSignal;
}

// Continue streaming context
export interface ContinueContext {
    userInstruction: string;
    image?: { data: string, mimeType: string };
    rawTextSoFar: string;
    explanationSoFar: string;
    jsonStarted: boolean;
    assistantMessageId: string;
    mode: 'chat' | 'scaffold';
}

// True streaming function with real-time token delivery
export async function getAiChangesStream(
    projectState: ProjectState, 
    userInstruction: string,
    callbacks: StreamingCallbacks,
    image?: { data: string, mimeType: string }
): Promise<void> {
    // Smart file selection and optimization
    const relevantFiles = getRelevantFiles(projectState.fileContents, userInstruction);
    const optimizedFiles = filterAndOptimizeFiles(relevantFiles);
    
    const fileContentsString = Object.entries(optimizedFiles)
        .map(([path, content]) => `<file path="${path}">
${content}
</file>`)
        .join('\n');
    
    // Add context about excluded files
    const totalFiles = Object.keys(projectState.fileContents).length;
    const includedFiles = Object.keys(optimizedFiles).length;
    const excludedInfo = totalFiles > includedFiles ? 
        `\n\n<context>Note: Showing ${includedFiles} most relevant files out of ${totalFiles} total files to optimize API usage.</context>` : '';

    const textPrompt = `User request: "${userInstruction}"

<project_files>
${fileContentsString}
</project_files>${excludedInfo}
`;
    
    let contents: any;
    if (image) {
        const imagePart = {
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        };
        const textPart = { text: textPrompt };
        contents = { parts: [imagePart, textPart] };
    } else {
        contents = textPrompt;
    }

    // Use streaming config for pure JSON responses
    const config: any = {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: aiResponseSchema,
    };

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (!ai) {
                throw new Error("Gemini API key is not configured. Please set your API key from the key icon in the header.");
            }
            
            // Check for abort signal
            if (callbacks.abortSignal?.aborted) {
                throw new Error('Request was aborted');
            }
            
            // Enforce rate limiting
            await enforceRateLimit();
            
            // Use streaming API with proper error handling
            const streamGenerator = await ai.models.generateContentStream({
                model: model,
                contents: contents,
                config: config
            });
            
            let fullText = '';
            let jsonStarted = false;
            
            // Process streaming chunks
            for await (const chunk of streamGenerator) {
                // Check for abort signal
                if (callbacks.abortSignal?.aborted) {
                    throw new Error('Request was aborted');
                }
                
                const chunkText = chunk.text || '';
                if (!chunkText) continue;
                
                fullText += chunkText;
                
                // Always call raw chunk callback for continue functionality
                callbacks.onRawChunk?.(chunkText);
                
                // Check if JSON has started (look for opening brace)
                if (!jsonStarted && fullText.trim().startsWith('{')) {
                    jsonStarted = true;
                }
                
                // Only stream text chunks if JSON hasn't started yet
                if (!jsonStarted) {
                    callbacks.onTextChunk?.(chunkText);
                }
            }
            
            // Parse JSON from the complete response
            try {
                const parsed = JSON.parse(fullText.trim());
                if (parsed && typeof parsed === 'object') {
                    callbacks.onComplete?.(parsed as AiResponse);
                    return;
                }
            } catch (parseError) {
                // If JSON parsing fails, try to extract JSON from mixed content
                const jsonMatch = fullText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed && typeof parsed === 'object') {
                            callbacks.onComplete?.(parsed as AiResponse);
                            return;
                        }
                    } catch (e) {
                        // Continue to fallback
                    }
                }
                
                // If no valid JSON found, create text-only response
                const textOnlyResponse: AiResponse = {
                    thought: "AI provided text-only response or malformed JSON",
                    explanation: fullText.trim(),
                    actions: []
                };
                callbacks.onComplete?.(textOnlyResponse);
                return;
            }

        } catch (error: any) {
            const isQuotaError = error?.message?.includes('429') || 
                               error?.message?.includes('quota') || 
                               error?.message?.includes('RESOURCE_EXHAUSTED');
            
            const isAbortError = error?.message?.includes('aborted');
            const isLastAttempt = attempt === MAX_RETRIES;
            
            if (isAbortError) {
                console.log('Streaming request was aborted');
                return;
            }
            
            if (isQuotaError && !isLastAttempt) {
                const delay = RETRY_DELAYS[attempt] || 15000;
                console.warn(`Quota limit hit, retrying in ${delay/1000}s (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
                await smartDelay(delay);
                continue;
            }
            
            // If not a quota error or last attempt, call error callback
            console.error("Error in streaming AI response:", error);
            
            let errorMessage = "An unknown error occurred while contacting the AI.";
            if (error instanceof Error) {
                 errorMessage = `API Error: ${error.message}`;
            }
            
            callbacks.onError?.(new Error(errorMessage));
            return;
        }
    }
}

// Fallback non-streaming function (existing implementation)
export async function getAiChanges(
    projectState: ProjectState, 
    userInstruction: string,
    image?: { data: string, mimeType: string }
): Promise<AiResponse> {
    // Smart file selection and optimization
    const relevantFiles = getRelevantFiles(projectState.fileContents, userInstruction);
    const optimizedFiles = filterAndOptimizeFiles(relevantFiles);
    
    const fileContentsString = Object.entries(optimizedFiles)
        .map(([path, content]) => `<file path="${path}">
${content}
</file>`)
        .join('\n');
    
    // Add context about excluded files
    const totalFiles = Object.keys(projectState.fileContents).length;
    const includedFiles = Object.keys(optimizedFiles).length;
    const excludedInfo = totalFiles > includedFiles ? 
        `\n\n<context>Note: Showing ${includedFiles} most relevant files out of ${totalFiles} total files to optimize API usage.</context>` : '';

    const textPrompt = `User request: "${userInstruction}"

<project_files>
${fileContentsString}
</project_files>${excludedInfo}
`;
    
    let contents: any;
    if (image) {
        const imagePart = {
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        };
        const textPart = { text: textPrompt };
        contents = { parts: [imagePart, textPart] };
    } else {
        contents = textPrompt;
    }

    const config: any = {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: aiResponseSchema,
    };

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (!ai) {
                throw new Error("Gemini API key is not configured. Please set your API key from the key icon in the header.");
            }
            
            // Enforce rate limiting
            await enforceRateLimit();
            
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: model,
                contents: contents,
                config: config
            });

            const parsedResponse = parseAiResponse(response);

            if (!parsedResponse) {
                throw new Error("Failed to parse AI response. The response was empty or malformed.");
            }

            return parsedResponse;

        } catch (error: any) {
            const isQuotaError = error?.message?.includes('429') || 
                               error?.message?.includes('quota') || 
                               error?.message?.includes('RESOURCE_EXHAUSTED');
            
            const isLastAttempt = attempt === MAX_RETRIES;
            
            if (isQuotaError && !isLastAttempt) {
                const delay = RETRY_DELAYS[attempt] || 15000;
                console.warn(`Quota limit hit, retrying in ${delay/1000}s (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
                await smartDelay(delay);
                continue;
            }
            
            // If not a quota error or last attempt, throw the error
            console.error("Error getting AI response:", error);
            
            let errorMessage = "An unknown error occurred while contacting the AI.";
            if (error instanceof Error) {
                 errorMessage = `API Error: ${error.message}`;
                 if (error instanceof SyntaxError) {
                     errorMessage = "The AI's response was not in the expected JSON format. This can be a temporary issue."
                 }
            }
            
            // Return a structured error response
            return {
                thought: "An error occurred during API communication or response parsing.",
                explanation: `I'm sorry, I encountered a problem trying to process your request. Please try again.\n\n**Error Details:**\n\`\`\`\n${errorMessage}\n\`\`\``,
                actions: [],
            };
        }
    }
}