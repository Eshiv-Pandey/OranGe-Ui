import type { Appearance } from "../components/ui/appearance";
export type ComponentCategory = "Forms & actions" | "Navigation & disclosure" | "Overlays & feedback" | "Content & layout" | "Play";
export type PropDoc = { name: string; type: string; defaultValue: string; description: string };
export type ComponentDefinition = { slug: string; name: string; category: ComponentCategory; description: string; props: PropDoc[]; keyboard: string; usage: string; file: string };
export const componentCategories: ComponentCategory[] = ["Forms & actions", "Navigation & disclosure", "Overlays & feedback", "Content & layout", "Play"];
export const components: ComponentDefinition[] = [
  {
    "slug": "button",
    "name": "Button",
    "category": "Forms & actions",
    "description": "A tactile action with clear loading, disabled, and link states.",
    "props": [
      {
        "name": "variant",
        "type": "\"primary\" | \"secondary\" | \"ghost\"",
        "defaultValue": "\"primary\"",
        "description": "Visual importance of the action."
      },
      {
        "name": "loading",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Shows a spinner and prevents repeat activation."
      },
      {
        "name": "asChild",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Styles a child link or button without changing its semantics."
      }
    ],
    "keyboard": "Tab focuses the control. Enter and Space activate buttons; Enter follows links.",
    "usage": "<Button appearance=\"polished\" variant=\"primary\">Get started</Button>",
    "file": "components/ui/button.tsx"
  },
  {
    "slug": "input",
    "name": "Input",
    "category": "Forms & actions",
    "description": "A clear, native text field with helpful feedback.",
    "props": [
      {
        "name": "label",
        "type": "string",
        "defaultValue": "Not set",
        "description": "Accessible field label."
      },
      {
        "name": "error",
        "type": "string",
        "defaultValue": "Not set",
        "description": "Validation feedback linked to the input."
      },
      {
        "name": "loading",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Shows a progress indicator without blocking editing."
      }
    ],
    "keyboard": "Native text editing, tab order, and browser autofill remain available.",
    "usage": "<Input appearance=\"polished\" label=\"Email\" type=\"email\" placeholder=\"you@example.com\" description=\"Your work email.\" />",
    "file": "components/ui/input.tsx"
  },
  {
    "slug": "textarea",
    "name": "Textarea",
    "category": "Forms & actions",
    "description": "Give longer thoughts a little room to breathe.",
    "props": [
      {
        "name": "label",
        "type": "string",
        "defaultValue": "required",
        "description": "Visible and accessible label."
      },
      {
        "name": "error",
        "type": "string",
        "defaultValue": "Not set",
        "description": "Displays and announces validation feedback."
      },
      {
        "name": "maxLength",
        "type": "number",
        "defaultValue": "Not set",
        "description": "Native maximum character count."
      }
    ],
    "keyboard": "Native multiline editing. Tab moves focus; Enter inserts a new line.",
    "usage": "<Textarea appearance=\"polished\" label=\"Your idea\" placeholder=\"Tell us a little more...\" rows={4} />",
    "file": "components/ui/textarea.tsx"
  },
  {
    "slug": "select",
    "name": "Select",
    "category": "Forms & actions",
    "description": "Choose one option with search-by-typing and a proper focus model.",
    "props": [
      {
        "name": "options",
        "type": "SelectOption[]",
        "defaultValue": "required",
        "description": "Value, label, and disabled state for each option."
      },
      {
        "name": "value / defaultValue",
        "type": "string",
        "defaultValue": "Not set",
        "description": "Controlled or initial selection."
      },
      {
        "name": "onValueChange",
        "type": "(value: string) => void",
        "defaultValue": "Not set",
        "description": "Runs when the selection changes."
      }
    ],
    "keyboard": "Enter or Space opens the list. Arrow keys navigate, typing finds an option, and Escape closes it.",
    "usage": "<Select appearance=\"polished\" label=\"Plan\" defaultValue=\"studio\" options={[{ value: \"solo\", label: \"Solo\" }, { value: \"studio\", label: \"Studio\" }]} />",
    "file": "components/ui/select.tsx"
  },
  {
    "slug": "checkbox",
    "name": "Checkbox",
    "category": "Forms & actions",
    "description": "A small, unmistakable yes, no, or mixed selection.",
    "props": [
      {
        "name": "label",
        "type": "ReactNode",
        "defaultValue": "required",
        "description": "Clicking the label toggles the checkbox."
      },
      {
        "name": "checked / defaultChecked",
        "type": "boolean | \"indeterminate\"",
        "defaultValue": "false",
        "description": "Controlled or initial checked state."
      },
      {
        "name": "onCheckedChange",
        "type": "(checked: boolean | \"indeterminate\") => void",
        "defaultValue": "Not set",
        "description": "Reports changes."
      }
    ],
    "keyboard": "Space toggles the focused checkbox. Disabled checkboxes are skipped in the tab order.",
    "usage": "<Checkbox appearance=\"polished\" label=\"Email me product updates\" defaultChecked description=\"Only the useful things.\" />",
    "file": "components/ui/checkbox.tsx"
  },
  {
    "slug": "radio-group",
    "name": "RadioGroup",
    "category": "Forms & actions",
    "description": "One choice from a clearly labelled group.",
    "props": [
      {
        "name": "label",
        "type": "string",
        "defaultValue": "required",
        "description": "Names the group."
      },
      {
        "name": "options",
        "type": "RadioOption[]",
        "defaultValue": "required",
        "description": "Labels, values, descriptions, and disabled choices."
      },
      {
        "name": "onValueChange",
        "type": "(value: string) => void",
        "defaultValue": "Not set",
        "description": "Reports the selected option."
      }
    ],
    "keyboard": "Arrow keys move and select inside the group. Tab moves into or out of the group.",
    "usage": "<RadioGroup appearance=\"polished\" label=\"Workspace\" defaultValue=\"solo\" options={[{ value: \"solo\", label: \"Just me\" }, { value: \"team\", label: \"My team\" }]} />",
    "file": "components/ui/radio-group.tsx"
  },
  {
    "slug": "switch",
    "name": "Switch",
    "category": "Forms & actions",
    "description": "An immediate on/off preference with a readable label.",
    "props": [
      {
        "name": "label",
        "type": "string",
        "defaultValue": "required",
        "description": "Accessible switch name."
      },
      {
        "name": "checked / defaultChecked",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Controlled or initial state."
      },
      {
        "name": "onCheckedChange",
        "type": "(checked: boolean) => void",
        "defaultValue": "Not set",
        "description": "Reports the new preference."
      }
    ],
    "keyboard": "Space or Enter toggles the switch. The label is also clickable.",
    "usage": "<Switch appearance=\"polished\" label=\"Auto-save\" description=\"Keep every small change.\" defaultChecked />",
    "file": "components/ui/switch.tsx"
  },
  {
    "slug": "slider",
    "name": "Slider",
    "category": "Forms & actions",
    "description": "Adjust a value, or a range, with keyboard and touch.",
    "props": [
      {
        "name": "value / defaultValue",
        "type": "number[]",
        "defaultValue": "[50]",
        "description": "One value for a single thumb, two for a range."
      },
      {
        "name": "min / max / step",
        "type": "number",
        "defaultValue": "0 / 100 / 1",
        "description": "Bounds and step interval."
      },
      {
        "name": "formatValue",
        "type": "(value: number) => string",
        "defaultValue": "String",
        "description": "Formats the output and accessible value text."
      }
    ],
    "keyboard": "Arrow keys adjust by one step. Page keys make larger changes; Home and End go to the bounds.",
    "usage": "<Slider appearance=\"polished\" label=\"Volume\" defaultValue={[60]} max={100} step={5} />",
    "file": "components/ui/slider.tsx"
  },
  {
    "slug": "toggle",
    "name": "Toggle",
    "category": "Forms & actions",
    "description": "A pressable control that remembers its state.",
    "props": [
      {
        "name": "pressed / defaultPressed",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Controlled or initial pressed state."
      },
      {
        "name": "onPressedChange",
        "type": "(pressed: boolean) => void",
        "defaultValue": "Not set",
        "description": "Reports a state change."
      },
      {
        "name": "disabled",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Prevents activation."
      }
    ],
    "keyboard": "Enter or Space changes the pressed state. Keep the accessible label stable.",
    "usage": "<Toggle appearance=\"polished\" aria-label=\"Bookmark\" defaultPressed>Bookmark</Toggle>",
    "file": "components/ui/toggle.tsx"
  },
  {
    "slug": "toggle-group",
    "name": "ToggleGroup",
    "category": "Forms & actions",
    "description": "A connected set for single or multiple selections.",
    "props": [
      {
        "name": "type",
        "type": "\"single\" | \"multiple\"",
        "defaultValue": "required",
        "description": "Whether one or several options can be active."
      },
      {
        "name": "options",
        "type": "{ value, label, icon?, disabled? }[]",
        "defaultValue": "required",
        "description": "The available controls."
      },
      {
        "name": "value / defaultValue",
        "type": "string | string[]",
        "defaultValue": "Not set",
        "description": "Value shape follows the selection type."
      }
    ],
    "keyboard": "Arrow keys move between items. Space or Enter changes selection; disabled items are skipped.",
    "usage": "<ToggleGroup appearance=\"polished\" type=\"single\" label=\"Alignment\" defaultValue=\"left\" options={[{ value: \"left\", label: \"Left\" }, { value: \"center\", label: \"Center\" }, { value: \"right\", label: \"Right\" }]} />",
    "file": "components/ui/toggle-group.tsx"
  },
  {
    "slug": "accordion",
    "name": "Accordion",
    "category": "Navigation & disclosure",
    "description": "Let readers open just the details they need.",
    "props": [
      {
        "name": "type",
        "type": "\"single\" | \"multiple\"",
        "defaultValue": "required",
        "description": "Controls how many items may be expanded."
      },
      {
        "name": "items",
        "type": "{ value, title, content, disabled? }[]",
        "defaultValue": "required",
        "description": "Headings and associated content."
      },
      {
        "name": "collapsible",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Allows the single open item to close (single mode)."
      }
    ],
    "keyboard": "Enter or Space toggles a heading. Arrow keys, Home, and End navigate headings.",
    "usage": "<Accordion appearance=\"polished\" type=\"single\" collapsible items={[{ value: \"license\", title: \"Can I use this commercially?\", content: \"Yes. oRangeUi is MIT licensed.\" }, { value: \"styles\", title: \"Can I mix appearances?\", content: \"Each component has its own appearance prop.\" }]} />",
    "file": "components/ui/accordion.tsx"
  },
  {
    "slug": "tabs",
    "name": "Tabs",
    "category": "Navigation & disclosure",
    "description": "Related views, one calm space.",
    "props": [
      {
        "name": "label",
        "type": "string",
        "defaultValue": "required",
        "description": "Accessible label for the tab list."
      },
      {
        "name": "items",
        "type": "{ value, label, content, disabled? }[]",
        "defaultValue": "required",
        "description": "Tab labels and panels."
      },
      {
        "name": "activationMode",
        "type": "\"automatic\" | \"manual\"",
        "defaultValue": "\"automatic\"",
        "description": "Whether focus also selects a tab."
      }
    ],
    "keyboard": "Arrow keys navigate the tab list. In manual mode, Enter or Space selects. Tab moves into the panel.",
    "usage": "<Tabs appearance=\"polished\" label=\"Project views\" items={[{ value: \"overview\", label: \"Overview\", content: \"Your project at a glance.\" }, { value: \"activity\", label: \"Activity\", content: \"Your latest changes.\" }]} />",
    "file": "components/ui/tabs.tsx"
  },
  {
    "slug": "breadcrumb",
    "name": "Breadcrumb",
    "category": "Navigation & disclosure",
    "description": "A quiet trail back through your site.",
    "props": [
      {
        "name": "items",
        "type": "{ label, href? }[]",
        "defaultValue": "required",
        "description": "The final item is marked as the current page."
      },
      {
        "name": "aria-label",
        "type": "string",
        "defaultValue": "\"Breadcrumb\"",
        "description": "Names the navigation landmark."
      }
    ],
    "keyboard": "Tab visits the linked ancestors. The current page is readable, not an extra focus stop.",
    "usage": "<Breadcrumb appearance=\"polished\" items={[{ label: \"Home\", href: \"/\" }, { label: \"Components\", href: \"/components\" }, { label: \"Button\" }]} />",
    "file": "components/ui/breadcrumb.tsx"
  },
  {
    "slug": "pagination",
    "name": "Pagination",
    "category": "Navigation & disclosure",
    "description": "Move through a collection without losing your place.",
    "props": [
      {
        "name": "totalPages",
        "type": "number",
        "defaultValue": "required",
        "description": "The number of pages, clamped to at least one."
      },
      {
        "name": "page / defaultPage",
        "type": "number",
        "defaultValue": "1",
        "description": "Controlled or initial current page."
      },
      {
        "name": "onPageChange",
        "type": "(page: number) => void",
        "defaultValue": "Not set",
        "description": "Reports a bounded page choice."
      }
    ],
    "keyboard": "Tab visits page buttons. Enter or Space changes page; unavailable previous/next buttons are disabled.",
    "usage": "<Pagination appearance=\"polished\" totalPages={12} defaultPage={1} />",
    "file": "components/ui/pagination.tsx"
  },
  {
    "slug": "dropdown-menu",
    "name": "DropdownMenu",
    "category": "Navigation & disclosure",
    "description": "Contextual actions with shortcuts and disabled states.",
    "props": [
      {
        "name": "trigger",
        "type": "ReactElement",
        "defaultValue": "required",
        "description": "An accessible button or other focusable trigger."
      },
      {
        "name": "items",
        "type": "MenuAction[]",
        "defaultValue": "required",
        "description": "Actions, optional shortcuts, separators, and danger states."
      },
      {
        "name": "onAction",
        "type": "(value: string) => void",
        "defaultValue": "Not set",
        "description": "Runs after choosing an enabled action."
      }
    ],
    "keyboard": "Enter opens the menu. Arrow keys and typeahead navigate. Escape closes and restores trigger focus.",
    "usage": "<DropdownMenu appearance=\"polished\" trigger={<Button variant=\"secondary\">Project actions</Button>} items={[{ value: \"edit\", label: \"Edit project\" }, { value: \"archive\", label: \"Archive project\", separatorBefore: true }]} onAction={(value) => console.log(value)} />",
    "file": "components/ui/dropdown-menu.tsx"
  },
  {
    "slug": "command",
    "name": "Command",
    "category": "Navigation & disclosure",
    "description": "Find an action quickly with a searchable command list.",
    "props": [
      {
        "name": "items",
        "type": "CommandItem[]",
        "defaultValue": "required",
        "description": "Actions with labels, descriptions, keywords, and disabled states."
      },
      {
        "name": "onSelect",
        "type": "(value: string) => void",
        "defaultValue": "Not set",
        "description": "Runs on click or Enter."
      },
      {
        "name": "emptyMessage",
        "type": "string",
        "defaultValue": "\"No results found.\"",
        "description": "Feedback when the query has no matches."
      }
    ],
    "keyboard": "Type to filter. Arrow keys, Home, and End choose an enabled result; Enter activates it. Escape clears the query.",
    "usage": "<Command appearance=\"polished\" items={[{ value: \"new\", label: \"Create project\", description: \"A fresh place to start\" }, { value: \"settings\", label: \"Open settings\" }]} onSelect={(value) => console.log(value)} />",
    "file": "components/ui/command.tsx"
  },
  {
    "slug": "dialog",
    "name": "Dialog",
    "category": "Overlays & feedback",
    "description": "A focused task with safe focus trapping and restoration.",
    "props": [
      {
        "name": "trigger",
        "type": "ReactElement",
        "defaultValue": "required",
        "description": "Opens the modal."
      },
      {
        "name": "title / description",
        "type": "string",
        "defaultValue": "required / optional",
        "description": "Accessible name and supporting explanation."
      },
      {
        "name": "open / onOpenChange",
        "type": "boolean / (open: boolean) => void",
        "defaultValue": "Not set",
        "description": "Control the dialog when a form completes."
      },
      {
        "name": "footer",
        "type": "ReactNode",
        "defaultValue": "Not set",
        "description": "Action area below the content."
      }
    ],
    "keyboard": "Opening moves focus inside. Tab stays within the modal. Escape or Close dismisses it and returns focus.",
    "usage": "<Dialog appearance=\"polished\" title=\"A little heads-up\" description=\"This is a local preview.\" trigger={<Button>Open dialog</Button>}><p>Your content belongs here.</p></Dialog>",
    "file": "components/ui/dialog.tsx"
  },
  {
    "slug": "sheet",
    "name": "Sheet",
    "category": "Overlays & feedback",
    "description": "A side panel for settings and supporting tasks.",
    "props": [
      {
        "name": "side",
        "type": "\"left\" | \"right\"",
        "defaultValue": "\"right\"",
        "description": "Which edge the panel opens from."
      },
      {
        "name": "trigger / title",
        "type": "ReactElement / string",
        "defaultValue": "required",
        "description": "Accessible trigger and panel heading."
      },
      {
        "name": "open / onOpenChange",
        "type": "boolean / (open: boolean) => void",
        "defaultValue": "Not set",
        "description": "Controlled visibility."
      },
      {
        "name": "footer",
        "type": "ReactNode",
        "defaultValue": "Not set",
        "description": "Optional panel actions."
      }
    ],
    "keyboard": "Uses modal focus trapping. Escape or Close dismisses the panel and restores focus to its trigger.",
    "usage": "<Sheet appearance=\"polished\" title=\"Workspace settings\" trigger={<Button variant=\"secondary\">Open settings</Button>}><Switch label=\"Auto-save\" defaultChecked /></Sheet>",
    "file": "components/ui/sheet.tsx"
  },
  {
    "slug": "popover",
    "name": "Popover",
    "category": "Overlays & feedback",
    "description": "Small edits, anchored to the place they belong.",
    "props": [
      {
        "name": "trigger",
        "type": "ReactElement",
        "defaultValue": "required",
        "description": "The anchor and opening control."
      },
      {
        "name": "title",
        "type": "string",
        "defaultValue": "required",
        "description": "Accessible name and visible heading."
      },
      {
        "name": "align",
        "type": "\"start\" | \"center\" | \"end\"",
        "defaultValue": "\"center\"",
        "description": "Preferred alignment; collision handling keeps content onscreen."
      }
    ],
    "keyboard": "Focus moves into the popover. Escape closes it and restores trigger focus; clicking outside dismisses it.",
    "usage": "<Popover appearance=\"polished\" title=\"Project details\" trigger={<Button variant=\"secondary\">Edit details</Button>}><Input label=\"Project name\" defaultValue=\"Weekend studio\" /></Popover>",
    "file": "components/ui/popover.tsx"
  },
  {
    "slug": "tooltip",
    "name": "Tooltip",
    "category": "Overlays & feedback",
    "description": "A little extra context on hover or keyboard focus.",
    "props": [
      {
        "name": "content",
        "type": "ReactNode",
        "defaultValue": "required",
        "description": "Supplementary, non-interactive explanation."
      },
      {
        "name": "side",
        "type": "\"top\" | \"right\" | \"bottom\" | \"left\"",
        "defaultValue": "\"top\"",
        "description": "Preferred position, adjusted near viewport edges."
      },
      {
        "name": "delayDuration",
        "type": "number",
        "defaultValue": "250",
        "description": "Hover delay in milliseconds."
      }
    ],
    "keyboard": "Focus or hover reveals the tooltip. Escape dismisses it. Essential information should remain visible elsewhere.",
    "usage": "<Tooltip appearance=\"polished\" content=\"Your project runs in Mumbai.\"><Button variant=\"secondary\">Deployment region</Button></Tooltip>",
    "file": "components/ui/tooltip.tsx"
  },
  {
    "slug": "toast",
    "name": "Toast",
    "category": "Overlays & feedback",
    "description": "A brief confirmation with an optional undo action.",
    "props": [
      {
        "name": "title / description",
        "type": "string",
        "defaultValue": "required / optional",
        "description": "Notification text."
      },
      {
        "name": "open / onOpenChange",
        "type": "boolean / (open: boolean) => void",
        "defaultValue": "Not set",
        "description": "Control notification visibility."
      },
      {
        "name": "action",
        "type": "{ label: string; onClick: () => void }",
        "defaultValue": "Not set",
        "description": "Optional action."
      },
      {
        "name": "ToastProvider.duration",
        "type": "number",
        "defaultValue": "5000",
        "description": "Time before dismissal; pauses during interaction."
      }
    ],
    "keyboard": "F8 moves focus to notifications. Escape dismisses the focused toast. The action and Close remain keyboard accessible.",
    "usage": "<ToastProvider><Toast appearance=\"polished\" defaultOpen title=\"Changes saved\" description=\"Your workspace is up to date.\" /></ToastProvider>",
    "file": "components/ui/toast.tsx"
  },
  {
    "slug": "alert",
    "name": "Alert",
    "category": "Overlays & feedback",
    "description": "Helpful, persistent feedback that fits the moment.",
    "props": [
      {
        "name": "title",
        "type": "string",
        "defaultValue": "required",
        "description": "The main message."
      },
      {
        "name": "tone",
        "type": "\"info\" | \"success\" | \"warning\" | \"danger\"",
        "defaultValue": "\"info\"",
        "description": "Semantic visual treatment; danger uses an alert announcement."
      },
      {
        "name": "dismissible / onDismiss",
        "type": "boolean / () => void",
        "defaultValue": "false / Not set",
        "description": "Optional dismissal and callback."
      }
    ],
    "keyboard": "If dismissible, Tab reaches the dismiss button; Enter or Space closes the alert.",
    "usage": "<Alert appearance=\"polished\" title=\"A small update\" tone=\"info\" dismissible>Your changes are saved on this device.</Alert>",
    "file": "components/ui/alert.tsx"
  },
  {
    "slug": "progress",
    "name": "Progress",
    "category": "Overlays & feedback",
    "description": "Determinate or ongoing progress with an accessible label.",
    "props": [
      {
        "name": "value",
        "type": "number",
        "defaultValue": "Not set",
        "description": "Omit for indeterminate progress."
      },
      {
        "name": "max",
        "type": "number",
        "defaultValue": "100",
        "description": "Upper bound; invalid values fall back to 100."
      },
      {
        "name": "label / showValue",
        "type": "string / boolean",
        "defaultValue": "required / true",
        "description": "Names the task and controls visible numeric feedback."
      }
    ],
    "keyboard": "A read-only progressbar exposes the bounded value to assistive technology. Reduced motion stops indeterminate travel.",
    "usage": "<Progress appearance=\"polished\" label=\"Uploading assets\" value={64} />",
    "file": "components/ui/progress.tsx"
  },
  {
    "slug": "skeleton",
    "name": "Skeleton",
    "category": "Overlays & feedback",
    "description": "Reserve a little space while the real content arrives.",
    "props": [
      {
        "name": "shape",
        "type": "\"text\" | \"avatar\" | \"card\"",
        "defaultValue": "\"text\"",
        "description": "The placeholder geometry."
      },
      {
        "name": "lines",
        "type": "number",
        "defaultValue": "3",
        "description": "Text placeholder line count."
      },
      {
        "name": "animate",
        "type": "boolean",
        "defaultValue": "true",
        "description": "Ambient pulse, disabled under reduced motion."
      }
    ],
    "keyboard": "Announces loading once as a status. Placeholders do not enter the tab order.",
    "usage": "<Skeleton appearance=\"polished\" label=\"Loading project details\" shape=\"text\" lines={3} />",
    "file": "components/ui/skeleton.tsx"
  },
  {
    "slug": "badge",
    "name": "Badge",
    "category": "Content & layout",
    "description": "A compact label for status, category, or a small count.",
    "props": [
      {
        "name": "tone",
        "type": "\"neutral\" | \"success\" | \"warning\" | \"danger\" | \"accent\"",
        "defaultValue": "\"neutral\"",
        "description": "The label's visual emphasis."
      },
      {
        "name": "dot",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Adds a decorative status dot."
      },
      {
        "name": "children",
        "type": "ReactNode",
        "defaultValue": "required",
        "description": "Keep the meaningful status in text."
      }
    ],
    "keyboard": "Static text. Colour is supplementary; include a meaningful label.",
    "usage": "<Badge appearance=\"polished\" tone=\"success\" dot>Live</Badge>",
    "file": "components/ui/badge.tsx"
  },
  {
    "slug": "avatar",
    "name": "Avatar",
    "category": "Content & layout",
    "description": "An original gradient identity, generated from a seed. No upload needed.",
    "props": [
      {
        "name": "seed",
        "type": "string",
        "defaultValue": "name or orangeui:guest",
        "description": "A stable user ID or handle produces the same avatar everywhere."
      },
      {
        "name": "config",
        "type": "AvatarConfig",
        "defaultValue": "Generated from seed",
        "description": "Saved identity data takes precedence over seed. Optional customColors accepts two or three opaque hex colors."
      },
      {
        "name": "size",
        "type": "\"xs\" | \"sm\" | \"md\" | \"lg\" | \"xl\" | number",
        "defaultValue": "\"md\"",
        "description": "xs: 24px, sm: 32px, md: 48px, lg: 72px, xl: 112px. Numeric sizes use pixels and stay within 12 to 2048px."
      },
      {
        "name": "shape",
        "type": "\"squircle\" | \"circle\" | \"rounded\" | \"square\"",
        "defaultValue": "Config shape",
        "description": "Overrides the saved shape. Pixel appearance uses stepped edges."
      },
      {
        "name": "animate",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Smoothly shifts the gradient and glyph together. Reduced motion holds the settled frame; exports are always settled."
      },
      {
        "name": "name / aria-label",
        "type": "string",
        "defaultValue": "Generated profile avatar",
        "description": "Accessible description. Name also provides a seed when seed is omitted."
      },
      {
        "name": "status",
        "type": "\"online\" | \"away\" | \"offline\"",
        "defaultValue": "Not set",
        "description": "Optional presence badge inside the SVG."
      }
    ],
    "keyboard": "A labelled image, not an extra tab stop. Wrap it in a named link or button when it performs an action.",
    "usage": "<Avatar appearance=\"polished\" seed=\"user-42\" name=\"Maya Patel\" size=\"lg\" />",
    "file": "components/ui/avatar.tsx"
  },
  {
    "slug": "avatar-group",
    "name": "AvatarGroup",
    "category": "Content & layout",
    "description": "A small crowd of original identities, with room for everyone.",
    "props": [
      {
        "name": "avatars",
        "type": "readonly (string | AvatarProps)[]",
        "defaultValue": "required",
        "description": "Seeds or complete avatar props in display order."
      },
      {
        "name": "max",
        "type": "number",
        "defaultValue": "5",
        "description": "Maximum visible avatars before a +N overflow chip."
      },
      {
        "name": "size",
        "type": "AvatarSize",
        "defaultValue": "\"md\"",
        "description": "Shared avatar size, including the overflow chip."
      },
      {
        "name": "label",
        "type": "string",
        "defaultValue": "People",
        "description": "Accessible name for the collection, followed by the total person count."
      }
    ],
    "keyboard": "A labelled collection, not an extra tab stop. Names and the overflow count are available to assistive technology.",
    "usage": "<AvatarGroup appearance=\"polished\" avatars={[\"maya\", \"leo\", \"mira\", \"ari\", \"zoe\", \"noah\"]} max={4} label=\"Project team\" />",
    "file": "components/ui/avatar-group.tsx"
  },
  {
    "slug": "avatar-editor",
    "name": "AvatarEditor",
    "category": "Forms & actions",
    "description": "Make a generated identity your own, one thoughtful detail at a time.",
    "props": [
      {
        "name": "value",
        "type": "AvatarConfig",
        "defaultValue": "required",
        "description": "The current config. The parent owns this state."
      },
      {
        "name": "onChange",
        "type": "(config: AvatarConfig) => void",
        "defaultValue": "required",
        "description": "Emits palette, custom color, glyph, detail, angle, randomize, and reset changes. Save the JSON in your application."
      },
      {
        "name": "seed",
        "type": "string",
        "defaultValue": "orangeui:guest",
        "description": "The identity used by Reset to default."
      },
      {
        "name": "label",
        "type": "string",
        "defaultValue": "Customize your avatar",
        "description": "Accessible name for the editor region."
      }
    ],
    "keyboard": "Tab moves between controls. Arrow keys choose palettes and glyphs and adjust the angle. Show all expands options in the page. Animate, Randomize, Reset, Copy config, and exports work with Enter or Space. Reduced motion disables Animate.",
    "usage": "<AvatarEditor appearance=\"polished\" seed=\"user-42\" value={config} onChange={setConfig} />",
    "file": "components/ui/avatar-editor.tsx"
  },
  {
    "slug": "card",
    "name": "Card",
    "category": "Content & layout",
    "description": "A flexible content surface with a heading and actions.",
    "props": [
      {
        "name": "title / description",
        "type": "string",
        "defaultValue": "required / optional",
        "description": "The heading and supporting text."
      },
      {
        "name": "heading",
        "type": "\"h2\" | \"h3\" | \"h4\"",
        "defaultValue": "\"h3\"",
        "description": "Match the surrounding document structure."
      },
      {
        "name": "footer",
        "type": "ReactNode",
        "defaultValue": "Not set",
        "description": "An optional action area."
      }
    ],
    "keyboard": "The card itself is not a focus stop. Its links and actions keep their native behavior.",
    "usage": "<Card appearance=\"polished\" title=\"Weekend studio\" description=\"A good place for your next idea.\" footer={<Button>Create project</Button>}><p>Make room for something new.</p></Card>",
    "file": "components/ui/card.tsx"
  },
  {
    "slug": "stat-card",
    "name": "StatCard",
    "category": "Content & layout",
    "description": "Two useful numbers, with a little personality.",
    "props": [
      {
        "name": "accent",
        "type": "\"lime\" | \"mint\" | \"amber\" | \"sky\" | \"coral\"",
        "defaultValue": "\"lime\"",
        "description": "One of five colour accents."
      },
      {
        "name": "stats",
        "type": "[{ label, value }, { label, value }]",
        "defaultValue": "required",
        "description": "Exactly two statistics."
      },
      {
        "name": "art / counter",
        "type": "ReactNode / string",
        "defaultValue": "required",
        "description": "Decorative artwork and catalogue counter."
      },
      {
        "name": "href",
        "type": "string",
        "defaultValue": "Not set",
        "description": "Makes the entire card a single link."
      }
    ],
    "keyboard": "A linked card receives one focus stop. Avoid placing interactive children inside a linked card.",
    "usage": "<StatCard appearance=\"polished\" accent=\"mint\" title=\"Small wins\" subtitle=\"Every detail adds up.\" counter=\"01 / 05\" art={<span>✦</span>} stats={[{ label: \"Ideas\", value: 24 }, { label: \"Shipped\", value: 8 }]} footer=\"A good day to build\" />",
    "file": "components/ui/stat-card.tsx"
  },
  {
    "slug": "separator",
    "name": "Separator",
    "category": "Content & layout",
    "description": "A deliberate pause between related pieces of content.",
    "props": [
      {
        "name": "orientation",
        "type": "\"horizontal\" | \"vertical\"",
        "defaultValue": "\"horizontal\"",
        "description": "The direction of the dividing rule."
      },
      {
        "name": "decorative",
        "type": "boolean",
        "defaultValue": "false",
        "description": "Hides a purely visual rule from the accessibility tree."
      }
    ],
    "keyboard": "No keyboard interaction. Semantic separators are announced; decorative rules are ignored.",
    "usage": "<Separator appearance=\"polished\" orientation=\"horizontal\" />",
    "file": "components/ui/separator.tsx"
  },
  {
    "slug": "table",
    "name": "Table",
    "category": "Content & layout",
    "description": "Readable records with sorting, pagination, and an empty state.",
    "props": [
      {
        "name": "rows",
        "type": "T[] where T has id: string",
        "defaultValue": "required",
        "description": "Stable records; IDs identify rows."
      },
      {
        "name": "columns",
        "type": "TableColumn<T>[]",
        "defaultValue": "required",
        "description": "Keys, headers, optional sorting, and custom cell rendering."
      },
      {
        "name": "caption",
        "type": "string",
        "defaultValue": "required",
        "description": "Visible table title and scroll-region name."
      },
      {
        "name": "pageSize",
        "type": "number",
        "defaultValue": "5",
        "description": "Records per page."
      }
    ],
    "keyboard": "Tab reaches sortable headings and page controls. Enter sorts. The labelled scroll region supports keyboard scrolling.",
    "usage": "<Table appearance=\"polished\" caption=\"Recent projects\" rows={[{ id: \"1\", name: \"Orange studio\", status: \"Live\" }]} columns={[{ key: \"name\", header: \"Project\", sortable: true }, { key: \"status\", header: \"Status\" }]} />",
    "file": "components/ui/table.tsx"
  },
  {
    "slug": "empty-state",
    "name": "EmptyState",
    "category": "Content & layout",
    "description": "Turn an empty page into an inviting next step.",
    "props": [
      {
        "name": "title / description",
        "type": "string",
        "defaultValue": "required",
        "description": "Explain what is missing and how to begin."
      },
      {
        "name": "icon",
        "type": "ReactNode",
        "defaultValue": "folder illustration",
        "description": "Optional decorative illustration."
      },
      {
        "name": "action",
        "type": "ReactNode",
        "defaultValue": "Not set",
        "description": "A useful next action."
      }
    ],
    "keyboard": "The action is a normal link or button. The illustration is decorative.",
    "usage": "<EmptyState appearance=\"polished\" title=\"A fresh canvas\" description=\"Your first project belongs here.\" action={<Button>Create project</Button>} />",
    "file": "components/ui/empty-state.tsx"
  },
  {
    "slug": "gamer-boy",
    "name": "GamerBoy",
    "category": "Play",
    "description": "The purple handheld from the landing page, ready to play anywhere.",
    "props": [
      {
        "name": "label",
        "type": "string",
        "defaultValue": "\"Interactive handheld console\"",
        "description": "Accessible name for the device."
      },
      {
        "name": "onScoreChange",
        "type": "(score: number) => void",
        "defaultValue": "Not set",
        "description": "Reports collected stars, from zero to four."
      }
    ],
    "keyboard": "Focus the device and press Enter or Space to start. Arrow keys or WASD move. Play pauses/resumes, Escape resets, and on-device buttons work with touch.",
    "usage": "<GamerBoy appearance=\"polished\" onScoreChange={(score) => console.log(score)} />",
    "file": "components/ui/gamer-boy.tsx"
  }
];
export function findComponent(slug: string) { return components.find((component) => component.slug === slug); }
export function componentUsage(component: ComponentDefinition, appearance: Appearance) {
  if (component.slug === "avatar-editor") return '"use client";\n\nimport { useState } from "react";\nimport { AvatarEditor } from "./components/ui/avatar-editor";\nimport { generateAvatarConfig } from "./lib/avatar/index";\n\nexport default function Example() {\n  const [config, setConfig] = useState(() => generateAvatarConfig("user-42"));\n  return <AvatarEditor appearance="' + appearance + '" seed="user-42" value={config} onChange={setConfig} />;\n}\n';
  const imports = [`import { ${component.name === "Toast" ? "Toast, ToastProvider" : component.name} } from "./${component.file.replace(/\.tsx$/, "")}";`];
  if (component.usage.includes("<Button") && component.name !== "Button") imports.push('import { Button } from "./components/ui/button";');
  if (component.usage.includes("<Input") && component.name !== "Input") imports.push('import { Input } from "./components/ui/input";');
  if (component.usage.includes("<Switch") && component.name !== "Switch") imports.push('import { Switch } from "./components/ui/switch";');
  const jsx = component.usage.replace(/<(Button|Input|Switch)(?![A-Za-z])(?=\s|>)(?! appearance=)/g, `<$1 appearance="${appearance}"`).replaceAll('appearance="polished"', `appearance="${appearance}"`);
  return (component.slug === "avatar" || component.slug === "avatar-group" ? "" : '"use client";\n\n') + imports.join("\n") + "\n\nexport default function Example() {\n  return (\n    " + jsx + "\n  );\n}\n";
}
