import type { ComponentDefinition } from "./components";

export const WALL_SWITCH_COMPONENT: ComponentDefinition = {
  slug: "wall-switch", name: "WallSwitch", category: "Buttons & actions",
  description: "A household rocker switch with a raised plate, recessed bezel and tactile on/off positions.",
  file: "components/ui/wall-switch.tsx", usage: '<WallSwitch label="Studio light" defaultChecked />',
  keyboard: "Tab to the switch and press Space to toggle. The label also toggles it. Controlled state, disabled state and native form values follow Radix Switch behavior. Reduced motion removes the rocking transition.",
  props: [
    { name: "label / description", type: "string / string", defaultValue: "Required / not set", description: "The accessible label and optional supporting text." },
    { name: "checked / defaultChecked", type: "boolean", defaultValue: "Uncontrolled / false", description: "Controlled state or initial on/off position." },
    { name: "onCheckedChange", type: "(checked: boolean) => void", defaultValue: "Not set", description: "Reports a toggle so you can connect the switch to your application." },
    { name: "size / disabled / name", type: "number / boolean / string", defaultValue: "152 / false / not set", description: "Plate width, clamped from 96 to 240 pixels, disabled state and native form field name." },
  ],
};

export const ENDLESS_FILM_COMPONENT: ComponentDefinition = {
  slug: "endless-film", name: "EndlessFilm", category: "Galleries & photography", customizerPreview: true,
  description: "A curling film ribbon that feeds an endless sequence of photos, steered by your cursor or a drag.",
  file: "components/ui/endless-film.tsx", usage: '<EndlessFilm label="Let the good days roll" speed={34} />',
  keyboard: "Use Previous, Next, Pause film and Reverse, or Tab through the photograph picker. Selecting a photo pauses the ribbon and announces its caption. Reduced motion keeps the ribbon still; manual navigation and dragging remain available. Motion pauses offscreen and in hidden tabs.",
  props: [
    { name: "photos", type: "readonly KeepsakePhoto[]", defaultValue: "Local sample photographs", description: "Photos with unique id, src, alt, title and optional note. Images use consistent landscape frames. Empty collections display an empty state." },
    { name: "speed / paused / interactive", type: "number / boolean / boolean", defaultValue: "34 / false / true", description: "Feed speed from 0 to 120, external pause, and cursor/drag interaction." },
    { name: "label / theme", type: "string / light | dark | auto", defaultValue: "Let the good days roll / auto", description: "Collection title and paper palette." },
    { name: "onSelect", type: "(photo: KeepsakePhoto) => void", defaultValue: "Not set", description: "Reports selection from the ribbon, photograph picker or navigation buttons." },
  ],
  notes: ["An original implementation inspired by the supplied curling film reference. The reference artwork is not included. Local sample photos retain their Unsplash provenance and license notes in source downloads. Replace them with your own photo objects."],
};
