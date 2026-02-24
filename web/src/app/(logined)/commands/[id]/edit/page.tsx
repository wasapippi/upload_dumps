"use client";

import { useEffect, useState } from "react";
import { Stack, Text } from "@mantine/core";
import { useParams } from "next/navigation";
import { CommandEditor } from "@/components/commands/CommandEditor";
import { Command } from "@/components/commands/types";

export default function CommandEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const [command, setCommand] = useState<Command | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/commands/${id}`);
      if (response.ok) {
        setCommand(await response.json());
      }
    };
    if (id) load();
  }, [id]);

  if (!command) {
    return (
      <Stack gap="xl" p="xl">
        <Text fw={700} size="xl">
          コマンド編集
        </Text>
        <Text size="sm" c="dimmed">
          読み込み中...
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" p="xl">
      <Text fw={700} size="xl">
        コマンド編集
      </Text>
      <CommandEditor initialCommand={command} />
    </Stack>
  );
}
