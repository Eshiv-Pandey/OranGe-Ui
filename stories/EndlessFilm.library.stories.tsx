import type { Meta, StoryObj } from "@storybook/react-vite";
import { EndlessFilm } from "../components/ui/endless-film";
const meta = { title: "Library/EndlessFilm", component: EndlessFilm, args: { paused: true } } satisfies Meta<typeof EndlessFilm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Still: Story = {};
export const Moving: Story = { args: { paused: false } };
export const Empty: Story = { args: { photos: [] } };
