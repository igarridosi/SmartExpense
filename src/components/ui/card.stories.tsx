import type { Meta, StoryObj } from "@storybook/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CardExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-600">Gasto proyectado al cierre del mes.</p>
      </CardContent>
    </Card>
  );
}

const meta: Meta<typeof CardExample> = {
  title: "UI/Card",
  component: CardExample,
};

export default meta;
type Story = StoryObj<typeof CardExample>;

export const Default: Story = {};
