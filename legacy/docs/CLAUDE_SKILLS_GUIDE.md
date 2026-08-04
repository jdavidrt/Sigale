> ⚠️ **RETIRED DOCUMENT — do not treat any of this as current.**
> It describes an earlier state of Sígale and is kept only so past decisions stay
> recoverable. See [`legacy/README.md`](../README.md) for why it was retired.
> What is true today lives in [`/CLAUDE.md`](../../CLAUDE.md) and [`/docs/`](../../docs/README.md).

---

# Claude Code Skills Guide for Web Projects

> Comprehensive guide for using Claude Code skills effectively in React/Next.js web development

## Table of Contents

- [Installed Skills Overview](#installed-skills-overview)
- [Quick Start Workflow](#quick-start-workflow)
- [Skill-Specific Tips](#skill-specific-tips)
- [Common Workflows](#common-workflows)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Installed Skills Overview

Your project now has **4 powerful skills** installed:

### 1. **frontend-design**
**Auto-invoked for all frontend work**

- Creates distinctive, production-grade UI that avoids generic "AI slop" aesthetics
- Focus: Bold design choices, typography, animations, visual details
- Best for: Components, pages, dashboards, landing pages

### 2. **web-artifacts-builder**
**For complex multi-component artifacts**

- Stack: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- 40+ pre-installed shadcn/ui components
- Bundles to single HTML file for sharing
- Best for: Prototypes, demos, standalone artifacts

### 3. **senior-frontend**
**Advanced React/Next.js development patterns**

- Project scaffolding with best practices
- Component generation with tests
- Bundle size analysis
- Performance optimization patterns
- Best for: Production applications, optimization, code quality

### 4. **ui-designer**
**Extract design systems from reference images**

- Analyzes UI screenshots to extract colors, typography, spacing
- Generates design system documentation
- Creates implementation-ready prompts
- Best for: Matching existing designs, creating consistent UI systems

---

## Quick Start Workflow

### Starting a New Feature

```bash
# 1. Let Claude analyze your request (frontend-design auto-activates)
# 2. For complex builds, Claude will use web-artifacts-builder or senior-frontend
# 3. Just describe what you need naturally!
```

**Example requests:**
- "Create a modern dashboard with dark mode"
- "Build a product card component with hover effects"
- "Design a landing page for a SaaS product"

### Building from Design References

```bash
# 1. Provide reference images
# 2. Ask Claude to "extract the design system from these UI screenshots"
# 3. ui-designer will automatically activate and generate implementation guides
```

---

## Skill-Specific Tips

### frontend-design Tips

#### What It Excels At

- **Bold aesthetics**: Avoiding generic centered layouts, purple gradients, uniform rounded corners
- **Typography choices**: Distinctive fonts beyond Inter/Arial/Roboto
- **Motion & animations**: CSS animations, Motion library for React, staggered reveals
- **Spatial composition**: Asymmetry, overlap, diagonal flow, generous negative space

#### Pro Tips

1. **Be specific about tone**: Instead of "modern design", try:
   - "Brutally minimal with sharp typography"
   - "Maximalist chaos with bold colors"
   - "Retro-futuristic with neon accents"
   - "Soft pastel with organic shapes"

2. **Request intentional aesthetics**:
   ```
   "Create a pricing page with an art deco geometric aesthetic"
   "Build a dashboard with industrial/utilitarian design language"
   ```

3. **Let the skill shine**: Don't over-specify colors/fonts - trust the skill to make bold choices

4. **Avoid these anti-patterns**:
   - Don't request "clean and modern" (too generic)
   - Don't specify "use Inter font" (defeats the purpose)
   - Don't ask for "purple gradient backgrounds"

#### Example Requests

```
✅ "Create a product showcase with brutalist raw aesthetic and dramatic typography"
✅ "Build a landing page with soft pastel colors and playful toy-like elements"
✅ "Design a dashboard with editorial magazine layout and unexpected asymmetry"

❌ "Make a clean modern landing page with purple gradients"
❌ "Create a simple centered layout with Inter font"
```

---

### web-artifacts-builder Tips

#### What It Excels At

- Multi-component React applications with state management
- Projects using shadcn/ui components
- Prototypes that need to be shared as single HTML files
- Complex artifacts with routing and modern UI patterns

#### Pro Tips

1. **Always available**: The scripts are at `.claude/skills/web-artifacts-builder/scripts/`

2. **Initialization workflow**:
   ```bash
   # Claude will run:
   bash scripts/init-artifact.sh my-project
   cd my-project
   # Then develop your artifact
   ```

3. **Bundling for sharing**:
   ```bash
   # Claude will run:
   bash scripts/bundle-artifact.sh
   # Creates bundle.html - share this in Claude.ai as artifact
   ```

4. **Available components**: You have 40+ shadcn/ui components pre-installed:
   - Forms: Button, Input, Select, Checkbox, Radio, Switch
   - Layout: Card, Dialog, Sheet, Tabs, Accordion
   - Feedback: Alert, Toast, Progress, Skeleton
   - Data: Table, DataTable, Calendar, DatePicker
   - And many more!

5. **Design anti-patterns to avoid** (per skill guidelines):
   - ❌ Excessive centered layouts
   - ❌ Purple gradients
   - ❌ Uniform rounded corners
   - ❌ Inter font (use distinctive alternatives)

#### Example Requests

```
✅ "Build a task management app with kanban board using shadcn/ui"
✅ "Create a data dashboard with charts and filtering using React state"
✅ "Make a form wizard with multi-step validation"

❌ "Create a simple hello world page" (overkill - use plain HTML)
```

---

### senior-frontend Tips

#### What It Excels At

- Scaffolding production-ready Next.js/React projects
- Generating components with TypeScript, tests, and stories
- Analyzing and optimizing bundle sizes
- Performance optimization patterns

#### Pro Tips

1. **Project scaffolding**:
   ```bash
   # Claude can run:
   python scripts/frontend_scaffolder.py my-app --template nextjs --features auth,api
   ```

2. **Component generation**:
   ```bash
   # Generate component with test and story:
   python scripts/component_generator.py Button --dir src/components/ui --with-test --with-story
   ```

3. **Bundle analysis**:
   ```bash
   # Analyze for optimization opportunities:
   python scripts/bundle_analyzer.py .
   ```

4. **Server vs Client Components** (Next.js):
   - Default to Server Components
   - Only use `'use client'` for:
     - Event handlers (onClick, onChange)
     - State (useState, useReducer)
     - Effects (useEffect)
     - Browser APIs

5. **Performance patterns**:
   ```tsx
   // Parallel data fetching
   const [user, stats] = await Promise.all([getUser(), getStats()]);

   // Image optimization
   <Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />

   // Streaming with Suspense
   <Suspense fallback={<Skeleton />}>
     <AsyncComponent />
   </Suspense>
   ```

6. **Bundle optimization targets**:
   - Replace moment (290KB) → date-fns (12KB) or dayjs (2KB)
   - Replace lodash (71KB) → lodash-es with tree-shaking
   - Replace axios (14KB) → native fetch or ky (3KB)
   - Avoid @mui/material → use shadcn/ui or Radix UI

#### Example Requests

```
✅ "Scaffold a Next.js 14 project with authentication and API routes"
✅ "Generate a ProductCard component with tests and Storybook story"
✅ "Analyze my bundle size and suggest optimizations"
✅ "Convert this component to use Server Components pattern"

❌ "Create a quick prototype" (use web-artifacts-builder instead)
```

---

### ui-designer Tips

#### What It Excels At

- Extracting design systems from UI screenshots
- Generating implementation-ready prompts from visual references
- Creating consistent UI variations matching reference aesthetics
- Building MVPs that match specific design languages

#### Pro Tips

1. **Preparation**: Organize your reference images in a folder:
   ```
   reference-images/
   ├── dashboard-main.png
   ├── dashboard-dark.png
   ├── components.png
   └── mobile-view.png
   ```

2. **What to provide**:
   - Reference images directory path
   - Project idea/concept document
   - Existing PRD (optional)

3. **The skill will**:
   - Extract colors (primary, secondary, accent, functional)
   - Identify typography (families, sizes, weights)
   - Document component styles
   - Note spacing system
   - Capture animations/transitions
   - Include dark mode if present

4. **Output locations**:
   - Design system: `documents/designs/{name}_design_system.md`
   - PRD (if generated): `documents/prd/`
   - Final prompt: `documents/ux-design/{name}_design_prompt_{timestamp}.md`

5. **Best practices**:
   - Provide multiple screenshots showing different states
   - Include dark mode examples if needed
   - Show component variations (hover, disabled, active states)
   - Capture both desktop and mobile if applicable

#### Example Requests

```
✅ "Extract the design system from the screenshots in ./reference-images/dashboard/"
✅ "Analyze these Figma exports and create a matching component library"
✅ "Generate a design prompt based on the Stripe dashboard aesthetic"
✅ "Create 3 landing page variations matching this SaaS reference UI"

❌ "Create a design from scratch" (use frontend-design instead)
```

---

## Common Workflows

### Workflow 1: Build a New Feature from Scratch

```
1. Describe your feature naturally to Claude
2. frontend-design auto-activates with bold aesthetic choices
3. Claude implements with React + Tailwind CSS
4. Review and iterate
```

**Example:**
```
"Create a user profile settings page with:
- Avatar upload
- Form fields for bio, social links
- Password change section
- Use a refined minimalist aesthetic with unexpected typography"
```

---

### Workflow 2: Prototype a Complex Application

```
1. Request: "Build a [type] app using web-artifacts-builder"
2. Claude initializes React project with shadcn/ui
3. Develops multi-component application
4. Bundles to single HTML for sharing
5. (Optional) Test and iterate
```

**Example:**
```
"Build a habit tracker app using web-artifacts-builder with:
- Dashboard showing streak calendar
- Add/edit habit modal
- Stats visualization
- Use brutalist design with bold typography"
```

---

### Workflow 3: Match an Existing Design

```
1. Provide reference images
2. Request: "Extract design system from these screenshots"
3. ui-designer analyzes and generates design docs
4. Claude implements UI matching the design system
5. Iterate on details
```

**Example:**
```
"I have screenshots in ./designs/app-refs/. Extract the design
system and create a matching component library for our React app."
```

---

### Workflow 4: Optimize Production Application

```
1. Request: "Analyze my bundle size"
2. senior-frontend runs bundle analyzer
3. Review health score and recommendations
4. Request: "Replace [heavy package] with [alternative]"
5. Claude updates dependencies and code
6. Re-analyze to verify improvements
```

**Example:**
```
"Analyze bundle size and suggest optimizations. Then help me
replace moment.js with date-fns throughout the codebase."
```

---

### Workflow 5: Scaffold Production Project

```
1. Request: "Scaffold a Next.js 14 project with [features]"
2. senior-frontend creates project structure
3. Claude sets up TypeScript, Tailwind, authentication, etc.
4. Generate initial components with tests
5. Start building features
```

**Example:**
```
"Scaffold a Next.js 14 app with:
- App Router and Server Components
- NextAuth.js authentication
- React Query for API calls
- Vitest + Testing Library
- Storybook for components"
```

---

## Best Practices

### General Tips

1. **Be descriptive about aesthetics**: The more specific you are about visual direction, the better the results

2. **Trust the skills**: Don't over-specify technical details - let the skills make expert choices

3. **Iterate naturally**: Review, provide feedback, request changes conversationally

4. **Combine skills**: They work together! Use ui-designer for design system, then frontend-design for implementation

5. **Check your React environment**: Make sure you have Node.js 18+ and npm installed

### Typography Recommendations

The skills will avoid these overused fonts:
- ❌ Inter
- ❌ Roboto
- ❌ Arial
- ❌ System fonts
- ❌ Space Grotesk (becoming cliché)

Instead, expect bold choices like:
- ✅ Distinctive display fonts for headers
- ✅ Refined body fonts for readability
- ✅ Unexpected font pairings
- ✅ Characterful typefaces matching the aesthetic

### Color Guidance

Avoid requesting:
- ❌ "Purple gradients on white"
- ❌ "Generic blue primary color"
- ❌ "Safe, corporate colors"

Instead, let the skill choose or request:
- ✅ "Dominant color with sharp accents"
- ✅ "Contextual palette for [industry/mood]"
- ✅ "Bold, unexpected color combinations"

### Layout Principles

The skills favor:
- ✅ Asymmetric layouts
- ✅ Generous negative space OR controlled density
- ✅ Diagonal flow and visual hierarchy
- ✅ Grid-breaking elements
- ✅ Overlapping elements for depth

Over:
- ❌ Centered everything
- ❌ Uniform padding/margins
- ❌ Predictable grid layouts
- ❌ No visual hierarchy

---

## Troubleshooting

### Skill Not Activating

**Problem**: Skill doesn't seem to be used

**Solution**:
- Skills auto-activate based on context
- Be specific about what you need
- Explicitly mention: "use the [skill-name] skill for this"

### Bundle Script Errors

**Problem**: `bundle-artifact.sh` fails

**Solution**:
- Ensure Node.js 18+ is installed
- Check that `index.html` exists in project root
- Run from project directory, not `.claude/skills/`

### Component Generation Issues

**Problem**: Python scripts not found

**Solution**:
- Scripts are in `.claude/skills/senior-frontend/scripts/`
- Ensure Python 3.7+ is installed
- Run with full path: `python .claude/skills/senior-frontend/scripts/component_generator.py`

### Design System Extraction Issues

**Problem**: ui-designer can't read images

**Solution**:
- Ensure image paths are accessible
- Use common formats: PNG, JPG, WebP
- Provide absolute or relative paths from project root

---

## Advanced Tips

### Custom Hooks Pattern

```tsx
// useDebounce for search inputs
const debouncedSearch = useDebounce(searchTerm, 300);

// useLocalStorage for persistence
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

### Compound Components Pattern

```tsx
// Share state between related components
<Tabs>
  <Tabs.List>
    <Tabs.Tab>One</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel>Content</Tabs.Panel>
</Tabs>
```

### Accessibility Checklist

- ✅ Semantic HTML elements
- ✅ Keyboard navigation support
- ✅ ARIA labels for complex widgets
- ✅ Color contrast minimum 4.5:1
- ✅ Visible focus indicators
- ✅ Skip links for keyboard users

### Performance Optimization

- ✅ Use Server Components by default (Next.js)
- ✅ Image optimization with next/image
- ✅ Code splitting with dynamic imports
- ✅ Parallel data fetching with Promise.all
- ✅ Streaming with Suspense boundaries

---

## Quick Command Reference

```bash
# Web Artifacts Builder
bash .claude/skills/web-artifacts-builder/scripts/init-artifact.sh <name>
bash .claude/skills/web-artifacts-builder/scripts/bundle-artifact.sh

# Senior Frontend
python .claude/skills/senior-frontend/scripts/frontend_scaffolder.py <name> --template nextjs
python .claude/skills/senior-frontend/scripts/component_generator.py <ComponentName>
python .claude/skills/senior-frontend/scripts/bundle_analyzer.py .

# Check installed skills
ls -la .claude/skills/*/SKILL.md
```

---

## Example Prompts for Each Skill

### frontend-design
```
"Create a pricing page with brutalist aesthetic and dramatic shadows"
"Build a dashboard with editorial magazine layout and bold typography"
"Design a landing page with soft pastel organic shapes and playful elements"
```

### web-artifacts-builder
```
"Build a kanban board app with drag-and-drop using shadcn/ui"
"Create a multi-step form wizard with validation and progress indicator"
"Make an analytics dashboard with charts and data filtering"
```

### senior-frontend
```
"Scaffold a Next.js 14 app with authentication and API integration"
"Generate a ProductCard component with TypeScript and tests"
"Analyze bundle size and help me optimize dependencies"
```

### ui-designer
```
"Extract design system from screenshots in ./reference-designs/"
"Analyze this Figma export and create matching React components"
"Generate implementation prompt based on Linear's design language"
```

---

## Resources

- **shadcn/ui components**: https://ui.shadcn.com/docs/components
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **React Patterns**: See `.claude/skills/senior-frontend/references/`
- **Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/

---

## Final Tips

1. **Start with aesthetics**: Describe the visual direction first, then functionality
2. **Be bold**: Don't ask for "clean and simple" - request distinctive design choices
3. **Iterate freely**: These skills work best with conversational iteration
4. **Mix and match**: Use multiple skills in the same project
5. **Trust the expertise**: The skills are trained on best practices - let them guide you

---

**Happy building! 🚀**

*Generated for: Sígale project*
*Skills installed: frontend-design, web-artifacts-builder, senior-frontend, ui-designer*
*Last updated: 2026-02-05*
