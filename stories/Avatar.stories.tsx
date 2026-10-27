import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AVATAR_SIZES } from "../components/ui/avatar";
import { AvatarGroup } from "../components/ui/avatar-group";
import { AvatarEditor } from "../components/ui/avatar-editor";
import { APPEARANCE_VALUES, type Appearance } from "../components/ui/appearance";
import { generateAvatarConfig } from "../lib/avatar/generator";
import { AVATAR_SHAPES } from "../lib/avatar/types";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  args: { seed: "orange-studio", size: "xl", appearance: "polished", "aria-label": "Orange Studio profile" },
  argTypes: {
    seed: { control: "text" },
    appearance: { control: "select", options: APPEARANCE_VALUES },
    size: { control: "select", options: Object.keys(AVATAR_SIZES) },
    shape: { control: "select", options: AVATAR_SHAPES },
  },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SeedPlayground: Story = {};
export const Pixelated: Story = { args: { appearance: "pixel" } };
export const Neobrutalism: Story = { args: { appearance: "neobrutalism" } };
export const RetroOS: Story = { args: { appearance: "retro-os" } };
export const Terminal: Story = { args: { appearance: "terminal" } };

export const HundredAvatars: Story = {
  render: (args) => <div className="avatar-story-grid">{Array.from({ length: 100 }, (_, index) => <figure key={index}>
    <Avatar seed={`user-${index + 1}`} size="lg" appearance={args.appearance} aria-label={`User ${index + 1}`} />
    <figcaption>user-{index + 1}</figcaption>
  </figure>)}</div>,
};

export const Sizes: Story = {
  render: (args) => <div className="avatar-story-sizes">{Object.entries(AVATAR_SIZES).map(([name, pixels]) => <figure key={name}>
    <Avatar {...args} size={pixels} aria-label={`${name} avatar`} />
    <figcaption>{name} · {pixels}px</figcaption>
  </figure>)}<figure><Avatar {...args} size={144} aria-label="Custom size avatar" /><figcaption>custom · 144px</figcaption></figure></div>,
};

export const Shapes: Story = {
  render: (args) => <div className="avatar-story-sizes">{AVATAR_SHAPES.map((shape) => <figure key={shape}>
    <Avatar {...args} shape={shape} aria-label={`${shape} avatar`} />
    <figcaption>{shape}</figcaption>
  </figure>)}</div>,
};

export const Group: Story = {
  render: (args) => <AvatarGroup appearance={args.appearance} size="lg" max={4} label="Design team" avatars={["Maya Patel", "Alex Chen", "Rowan Kim", "Nora Evans", "Elliot Cruz", "Sam Lee", "Mira Jones"]} />,
};

function ControlledEditor({ appearance = "polished" }: { appearance?: Appearance }) {
  const [value, setValue] = useState(() => generateAvatarConfig("orange-studio"));
  return <div className="avatar-story-editor">
    <AvatarEditor value={value} onChange={setValue} seed="orange-studio" appearance={appearance} />
    <pre className="avatar-story-json" tabIndex={0} aria-label="Current avatar JSON">{JSON.stringify(value, null, 2)}</pre>
  </div>;
}

export const ControlledCustomization: Story = {
  render: (args) => <ControlledEditor appearance={args.appearance} />,
};
