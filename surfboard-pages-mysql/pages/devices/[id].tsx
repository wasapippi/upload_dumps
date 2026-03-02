"use client";

import { useEffect, useMemo, useState } from "react";
import { Stack, Text } from "@mantine/core";
import { useRouter } from "next/router";
import { CommandList } from "@/components/commands/CommandList";
import { Command } from "@/components/commands/types";

const sampleDevices = [
  { id: "1", name: "Core-PE-01", hostTypeId: 3, platformId: 3 },
  { id: "2", name: "DC-Leaf-01", hostTypeId: 1, platformId: 1 }
];

export default function DevicePage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const device = useMemo(
    () => sampleDevices.find((item) => item.id === id),
    [id]
  );
  const [commands, setCommands] = useState<Command[]>([]);

  useEffect(() => {
    if (!device) return;
    const load = async () => {
      const params = new URLSearchParams({
        hostTypeId: String(device.hostTypeId),
        platformId: String(device.platformId)
      });
      const response = await fetch(`/api/platforms/commands/for-device?${params.toString()}`);
      if (response.ok) {
        setCommands(await response.json());
      }
    };
    load();
  }, [device]);

  if (!device) {
    return (
      <Stack gap="md" p="xl">
        <Text fw={700} size="xl">
          装置が見つかりません
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" p="xl">
      <Text fw={700} size="xl">
        装置: {device.name}
      </Text>
      <Text size="sm" c="dimmed">
        hostTypeId: {device.hostTypeId} / platformId: {device.platformId}
      </Text>
      <CommandList commands={commands} />
    </Stack>
  );
}
