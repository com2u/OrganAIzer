# OrganAIzer Frontend Design System Specification

Based on my analysis of the current OrganAIzer React application, here's a comprehensive design specification for recreating the same look and feel:

## __Typography__

- __Primary Font__: `JetBrains Mono` (monospace)
- __Font Stack__: `'JetBrains Mono', 'ui-sans-serif', 'system-ui'`
- __Usage__: Applied to all text elements throughout the application
- __Character__: Modern, technical, clean monospace aesthetic

## __Color Palette__

### __Pastel Color System__

The application uses a distinctive pastel gradient system:

```css
colors: {
  'pastel-blue': '#A0C4FF',
  'pastel-purple': '#BDB2FF',
  'pastel-pink': '#FFC6FF',
  'pastel-red': '#FFADAD',
  'pastel-orange': '#FFD6A5',
  'pastel-yellow': '#FDFFB6',
  'pastel-green': '#CAFFBF',
  'pastel-cyan': '#9BF6FF'
}
```

### __Base Colors__

- __Primary Background__: White (`#FFFFFF`)
- __Text__: Black (`#000000`) and various gray shades
- __Borders__: Consistent 2px black borders (`border-2 border-black`)
- __Accent__: Blue hover states (`hover:text-blue-600`)

## __Layout Structure__

### __Header__

- White background with 2px black bottom border
- Logo (32x32px) + brand name on left
- Horizontal navigation with FontAwesome icons
- Dropdown menus for product categories
- Language switcher on right
- Mobile hamburger menu for responsive design

### __Footer__

- White background with 2px black top border
- Three-column grid layout (mobile: single column)
- Logo + description, contact info, navigation links
- Copyright notice at bottom

### __Main Content__

- Full-width sections with alternating background colors
- Container max-width with horizontal padding
- Consistent vertical spacing (`py-16`, `py-20`)

## __Card Component System__

### __Core Card Structure__

```css
.section-box {
  @apply border-2 border-black rounded-lg p-6 shadow-lg transition-all duration-300;
}
```

### __Background Variants__

Cards use gradient backgrounds from pastel colors:

- `bg-gradient-to-br from-pastel-[color] to-[color]-200`
- Available colors: blue, purple, pink, red, orange, yellow, green, cyan

### __Interactive States__

- Hover effects: `hover:shadow-xl hover:-translate-y-1`
- Scale animations: `hover:scale-105`
- Smooth transitions: `transition-all duration-300`

## __Button System__

### __Primary Buttons__

```css
.btn-primary {
  @apply bg-gradient-to-r from-blue-500 to-purple-600
         text-white font-bold py-3 px-6 rounded-lg
         border-2 border-black
         hover:from-blue-600 hover:to-purple-700
         transform hover:scale-105
         transition-all duration-300 shadow-lg;
}
```

### __Secondary Buttons__

```css
.btn-secondary {
  @apply bg-gradient-to-r from-gray-200 to-gray-300
         text-gray-800 font-bold py-3 px-6 rounded-lg
         border-2 border-black
         hover:from-gray-300 hover:to-gray-400
         transform hover:scale-105
         transition-all duration-300 shadow-lg;
}
```

## __Visual Design Principles__

### __Border Style__

- __Consistent__: 2px black borders on all major elements
- __Rounded Corners__: `rounded-lg` (8px radius) throughout
- __Sharp Contrast__: Black borders against white/pastel backgrounds

### __Shadow System__

- __Default__: `shadow-lg` for cards and buttons
- __Hover__: `hover:shadow-xl` for enhanced depth
- __Consistent__: All interactive elements have shadow states

### __Animation & Transitions__

- __Duration__: 300ms for most transitions
- __Easing__: `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind default)
- __Hover Effects__: Scale (1.05x), translate (-4px Y), shadow enhancement
- __Interactive Feedback__: All clickable elements have visual feedback

## __Grid & Spacing System__

### __Responsive Grid__

- __Mobile__: Single column (`grid-cols-1`)
- __Tablet__: 2-3 columns (`md:grid-cols-2`, `md:grid-cols-3`)
- __Desktop__: Up to 6 columns (`lg:grid-cols-6`)
- __Gap__: Consistent 8-unit spacing (`gap-8`)

### __Container System__

- __Max Width__: `container mx-auto`
- __Padding__: `px-4` (16px horizontal)
- __Vertical Spacing__: `py-16` (64px) for sections, `py-20` (80px) for hero areas

## __Icon System__

- __Library__: FontAwesome (solid and brands)
- __Sizes__: `text-2xl` to `text-5xl` for feature icons
- __Colors__: Match section theme colors
- __Usage__: Consistent icon + text combinations in navigation and features

## __Section Backgrounds__

- __Alternating__: White and gradient backgrounds
- __Gradients__: `bg-gradient-to-r from-[color]-50 to-[color]-50`
- __Hero Sections__: `from-blue-50 to-purple-50`
- __CTA Sections__: `from-purple-600 to-blue-600` with white text

## __Responsive Behavior__

- __Mobile-First__: All layouts start with mobile design
- __Breakpoints__: Standard Tailwind (`md:`, `lg:`)
- __Navigation__: Collapsible mobile menu
- __Grid Adaptation__: Automatic column reduction on smaller screens

## __Key Implementation Notes__

1. __Tailwind CSS__: Primary styling framework
2. __Component Architecture__: Reusable Card component with color variants
3. __Consistent Spacing__: 8-unit grid system throughout
4. __Bold Aesthetic__: High contrast with black borders and white backgrounds
5. __Playful Touch__: Pastel gradients soften the stark contrast
6. __Professional Feel__: Monospace font adds technical credibility
7. __Interactive Design__: Hover states on all interactive elements

