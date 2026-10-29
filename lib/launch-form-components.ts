import type { ComponentDefinition } from "./components";

export const launchFormComponents: ComponentDefinition[] = [
  {
    "slug": "label",
    "name": "Label",
    "description": "A native form label with required and disabled states.",
    "category": "Forms & actions",
    "file": "components/ui/label.tsx",
    "usage": "<div><Label htmlFor=\"work-email\" required>Work email</Label><Input id=\"work-email\" type=\"email\" required /></div>",
    "props": [
      {
        "name": "htmlFor",
        "type": "string",
        "description": "ID of the associated form control.",
        "defaultValue": "-"
      },
      {
        "name": "required",
        "type": "boolean",
        "description": "Adds a visual required indicator. Set required on the control too.",
        "defaultValue": "false"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "Dims the label for a disabled control.",
        "defaultValue": "false"
      }
    ],
    "keyboard": "Clicking the label focuses its associated input. Labels do not add a tab stop."
  },
  {
    "slug": "kbd",
    "name": "Kbd",
    "description": "A compact, semantic keyboard key or shortcut hint.",
    "category": "Content & layout",
    "file": "components/ui/kbd.tsx",
    "usage": "<p>Open search with <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>.</p>",
    "props": [
      {
        "name": "children",
        "type": "ReactNode",
        "description": "Key name or shortcut content.",
        "defaultValue": "-"
      }
    ],
    "keyboard": "A semantic shortcut hint. It does not register a keyboard handler or add a tab stop."
  },
  {
    "slug": "form",
    "name": "Form",
    "description": "Zod validation, field errors and guarded async submission.",
    "category": "Forms & actions",
    "file": "components/ui/form.tsx",
    "usage": "<Form defaultValues={{ email: \"\" }} schema={schema} onSubmit={(values) => console.log(values)}>{({ field, submitting }) => <><Input label=\"Email\" type=\"email\" {...field(\"email\")} /><Button type=\"submit\" disabled={submitting}>Validate email</Button></>}</Form>",
    "props": [
      {
        "name": "defaultValues",
        "type": "T extends Record<string, unknown>",
        "description": "Initial flat field values; reset restores this initial snapshot.",
        "defaultValue": "required"
      },
      {
        "name": "schema",
        "type": "z.ZodType<T>",
        "description": "Zod schema, including asynchronous refinements.",
        "defaultValue": "required"
      },
      {
        "name": "onSubmit",
        "type": "(values: T) => void | Promise<void>",
        "description": "Receives validated and transformed values.",
        "defaultValue": "required"
      },
      {
        "name": "children",
        "type": "(state: ValidatedFormState<T>) => ReactNode",
        "description": "Render fields, submit controls and custom feedback.",
        "defaultValue": "required"
      }
    ],
    "keyboard": "Native tab order and Enter submission. Invalid submission focuses the first invalid field; errors are announced. Reset restores initial values.",
    "usageImports": [
      "import { z } from \"zod\";"
    ],
    "usageSetup": "const schema = z.object({ email: z.email(\"Enter a valid email address.\") });"
  },
  {
    "slug": "combobox",
    "name": "Combobox",
    "description": "Searchable option selection with listbox keyboard behavior.",
    "category": "Forms & actions",
    "file": "components/ui/combobox.tsx",
    "usage": "<Combobox label=\"Role\" options={[{ value: \"design\", label: \"Designer\" }]} />",
    "props": [
      {
        "name": "label",
        "type": "string",
        "description": "Visible accessible label.",
        "defaultValue": "required"
      },
      {
        "name": "options",
        "type": "readonly ComboboxOption[]",
        "description": "Unique value, label, optional description, keywords and disabled state.",
        "defaultValue": "required"
      },
      {
        "name": "value / defaultValue",
        "type": "string",
        "description": "Selected option value, controlled or uncontrolled.",
        "defaultValue": "\"\""
      },
      {
        "name": "onValueChange",
        "type": "(value: string) => void",
        "description": "Selection callback; clearing emits an empty string.",
        "defaultValue": "-"
      },
      {
        "name": "required / disabled",
        "type": "boolean",
        "description": "Native selection validity and interaction state.",
        "defaultValue": "false"
      },
      {
        "name": "name",
        "type": "string",
        "description": "Serializes the selected option value in FormData.",
        "defaultValue": "-"
      }
    ],
    "keyboard": "Type to filter. Arrow keys select an active option, Enter chooses it, Escape closes the list and Tab moves onward. Clear restores an empty selection."
  },
  {
    "slug": "calendar",
    "name": "Calendar",
    "description": "A keyboard date grid with locale and date bounds.",
    "category": "Forms & actions",
    "file": "components/ui/calendar.tsx",
    "usage": "<Calendar defaultValue=\"2026-11-12\" weekStartsOn={1} />",
    "props": [
      {
        "name": "value / defaultValue",
        "type": "string (YYYY-MM-DD)",
        "description": "Selected date, controlled or uncontrolled.",
        "defaultValue": "\"\""
      },
      {
        "name": "month / defaultMonth",
        "type": "string (YYYY-MM-DD)",
        "description": "Visible month; any valid day in that month is accepted.",
        "defaultValue": "selected date or today"
      },
      {
        "name": "onValueChange / onMonthChange",
        "type": "(date: string) => void",
        "description": "Date or visible-month change callback.",
        "defaultValue": "-"
      },
      {
        "name": "min / max",
        "type": "string (YYYY-MM-DD)",
        "description": "Inclusive selection and month-navigation bounds.",
        "defaultValue": "-"
      },
      {
        "name": "isDateDisabled",
        "type": "(date: string) => boolean",
        "description": "Disables individual dates.",
        "defaultValue": "-"
      },
      {
        "name": "locale / weekStartsOn",
        "type": "string / 0 | 1 | 2 | 3 | 4 | 5 | 6",
        "description": "Localized labels and the first weekday.",
        "defaultValue": "\"en-US\" / 0"
      }
    ],
    "keyboard": "Arrow keys move by day or week, Home/End move within a week and Page Up/Down changes month. Enter or Space selects a day. Disabled dates cannot be selected."
  },
  {
    "slug": "date-picker",
    "name": "DatePicker",
    "description": "A labelled date trigger with an accessible calendar popover.",
    "category": "Forms & actions",
    "file": "components/ui/date-picker.tsx",
    "usage": "<DatePicker label=\"Review date\" name=\"reviewDate\" required />",
    "props": [
      {
        "name": "label",
        "type": "string",
        "description": "Visible accessible label.",
        "defaultValue": "required"
      },
      {
        "name": "value / defaultValue",
        "type": "string (YYYY-MM-DD)",
        "description": "Selected date, controlled or uncontrolled.",
        "defaultValue": "\"\""
      },
      {
        "name": "onValueChange",
        "type": "(date: string) => void",
        "description": "Date selection; clearing emits an empty string.",
        "defaultValue": "-"
      },
      {
        "name": "name / form",
        "type": "string",
        "description": "Native FormData key and optional form owner ID.",
        "defaultValue": "-"
      },
      {
        "name": "required / disabled / clearable",
        "type": "boolean",
        "description": "Required validity, disabled state and clear action.",
        "defaultValue": "false / false / true"
      },
      {
        "name": "min / max / isDateDisabled / locale / weekStartsOn",
        "type": "CalendarProps",
        "description": "Passed through to the calendar.",
        "defaultValue": "Calendar defaults"
      }
    ],
    "keyboard": "Enter or Space opens the calendar. Arrow keys navigate dates; Enter selects, Escape closes and restores trigger focus. Clear removes the date."
  },
  {
    "slug": "input-otp",
    "name": "InputOTP",
    "description": "A segmented code field with native paste and autocomplete.",
    "category": "Forms & actions",
    "file": "components/ui/input-otp.tsx",
    "usage": "<InputOTP label=\"Verification code\" length={6} onComplete={(code) => console.log(code)} />",
    "props": [
      {
        "name": "length",
        "type": "number",
        "description": "Code length, bounded from 1 to 12.",
        "defaultValue": "6"
      },
      {
        "name": "mode",
        "type": "\"numeric\" | \"alphanumeric\"",
        "description": "Allowed characters; alphanumeric input is uppercased.",
        "defaultValue": "\"numeric\""
      },
      {
        "name": "value / defaultValue",
        "type": "string",
        "description": "Normalized code, controlled or uncontrolled.",
        "defaultValue": "\"\""
      },
      {
        "name": "onValueChange / onComplete",
        "type": "(code: string) => void",
        "description": "Every edit or newly completed code callback.",
        "defaultValue": "-"
      },
      {
        "name": "name / required / disabled / autoComplete",
        "type": "Native input props",
        "description": "Native form, validation and code autofill behavior.",
        "defaultValue": "autoComplete=\"one-time-code\""
      }
    ],
    "keyboard": "One native input supports editing, selection, paste and one-time-code autofill. Numeric mode keeps digits; alphanumeric mode normalizes letters to uppercase."
  },
  {
    "slug": "file-upload",
    "name": "FileUpload",
    "description": "Choose or drop files with type, size and count validation.",
    "category": "Forms & actions",
    "file": "components/ui/file-upload.tsx",
    "usage": "<FileUpload label=\"Attachments\" accept=\".png,.pdf\" maxFiles={3} onFilesChange={(files) => console.log(files)} />",
    "props": [
      {
        "name": "files / defaultFiles",
        "type": "readonly File[]",
        "description": "Selected local files, controlled or uncontrolled.",
        "defaultValue": "[]"
      },
      {
        "name": "onFilesChange / onReject",
        "type": "(files: File[]) => void / (items: FileRejection[]) => void",
        "description": "Selection updates and typed rejection feedback.",
        "defaultValue": "-"
      },
      {
        "name": "accept",
        "type": "string",
        "description": "Comma-separated extensions, MIME types or MIME wildcards.",
        "defaultValue": "all file types"
      },
      {
        "name": "maxBytes / maxFiles",
        "type": "number",
        "description": "Maximum bytes per file and selection count; maxBytes <= 0 allows any size.",
        "defaultValue": "10485760 / 5"
      },
      {
        "name": "multiple / required / disabled",
        "type": "boolean",
        "description": "Selection and native validity behavior.",
        "defaultValue": "true / false / false"
      }
    ],
    "keyboard": "The native choose-files button works with Enter and Space. Each chosen file has a named Remove action. Drop and file input share validation."
  },
  {
    "slug": "rating",
    "name": "Rating",
    "description": "A star rating using native radio selection and keyboard input.",
    "category": "Forms & actions",
    "file": "components/ui/rating.tsx",
    "usage": "<Rating label=\"Experience\" defaultValue={3} name=\"rating\" clearable />",
    "props": [
      {
        "name": "value / defaultValue",
        "type": "number",
        "description": "Integer selected score; 0 means no rating.",
        "defaultValue": "0"
      },
      {
        "name": "max",
        "type": "number",
        "description": "Number of stars, bounded from 1 to 10.",
        "defaultValue": "5"
      },
      {
        "name": "onValueChange",
        "type": "(value: number) => void",
        "description": "Selection callback; clearing emits 0.",
        "defaultValue": "-"
      },
      {
        "name": "readOnly / disabled / required / clearable",
        "type": "boolean",
        "description": "Display-only, disabled, required or optional clear state.",
        "defaultValue": "false"
      },
      {
        "name": "name / form",
        "type": "string",
        "description": "Native radio group field name and form owner.",
        "defaultValue": "-"
      }
    ],
    "keyboard": "Tab reaches the selected radio. Arrow keys move between scores and Space selects. Clear removes an optional rating."
  },
  {
    "slug": "stepper",
    "name": "Stepper",
    "description": "Ordered task progress with optional keyboard navigation.",
    "category": "Forms & actions",
    "file": "components/ui/stepper.tsx",
    "usage": "<Stepper steps={[{ id: \"details\", label: \"Details\" }, { id: \"review\", label: \"Review\" }]} defaultValue={0} interactive />",
    "props": [
      {
        "name": "steps",
        "type": "readonly StepperStep[]",
        "description": "Stable unique id, label, optional description and disabled state.",
        "defaultValue": "required"
      },
      {
        "name": "value / defaultValue",
        "type": "number",
        "description": "Current zero-based step index.",
        "defaultValue": "0"
      },
      {
        "name": "onValueChange",
        "type": "(index: number) => void",
        "description": "Activated step callback.",
        "defaultValue": "-"
      },
      {
        "name": "interactive",
        "type": "boolean",
        "description": "Enables native step buttons and arrow/Home/End focus navigation.",
        "defaultValue": "false"
      },
      {
        "name": "maxUnlockedStep",
        "type": "number",
        "description": "Highest selectable zero-based step.",
        "defaultValue": "steps.length - 1"
      },
      {
        "name": "orientation",
        "type": "\"horizontal\" | \"vertical\"",
        "description": "Progress arrangement and directional arrow keys.",
        "defaultValue": "\"horizontal\""
      }
    ],
    "keyboard": "In interactive mode, Tab focuses a step and arrow keys move focus; Home/End go to the first/last enabled step. Enter or Space activates it."
  }
];
