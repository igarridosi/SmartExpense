import type { Meta, StoryObj } from "@storybook/nextjs";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  args: {
    id: "email",
    name: "email",
    label: "Correo electrónico",
    placeholder: "tu@correo.com",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: "Correo inválido",
  },
};
