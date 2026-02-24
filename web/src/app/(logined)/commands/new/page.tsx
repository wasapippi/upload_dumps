"use client";

import { Stack, Text } from "@mantine/core";
import { CommandEditor } from "@/components/commands/CommandEditor";

export default function CommandNewPage() {
  return (
    <Stack gap="xl" p="xl">
      <Text fw={700} size="xl">
        コマンド新規作成
      </Text>
      <CommandEditor />
    </Stack>
  );
}
