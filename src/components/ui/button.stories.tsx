import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Guardar",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Cancelar",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Guardando",
  },
};
