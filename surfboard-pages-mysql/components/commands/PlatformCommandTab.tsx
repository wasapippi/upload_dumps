"use client";

import { Badge, Button, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { Command, Tag } from "./types";
import { CommandList } from "./CommandList";

type Props = {
  commandReorderMode: boolean;
  onToggleReorderMode: () => void;
  onOpenCreate: () => void;
  commandTagMode: "and" | "or";
  onCommandTagModeChange: (value: "and" | "or") => void;
  availableCommandTags: Tag[];
  selectedCommandTagIds: number[];
  onToggleCommandTag: (tagId: number) => void;
  commands: Command[];
  onRefresh: () => void;
};

export const PlatformCommandTab = ({
  commandReorderMode,
  onToggleReorderMode,
  onOpenCreate,
  commandTagMode,
  onCommandTagModeChange,
  availableCommandTags,
  selectedCommandTagIds,
  onToggleCommandTag,
  commands,
  onRefresh
}: Props) => {
  return (
    <Stack gap="xs">
      <Group justify="flex-end">
        <Button variant={commandReorderMode ? "filled" : "light"} onClick={onToggleReorderMode}>
          {commandReorderMode ? "順番変更を終了" : "順番変更"}
        </Button>
        <Button onClick={onOpenCreate}>コマンド追加</Button>
      </Group>
      <Stack gap={6}>
        <Group justify="flex-start" align="center" gap="xs">
          <Text size="sm" fw={600}>タグで絞り込み</Text>
          <SegmentedControl
            size="xs"
            value={commandTagMode}
            onChange={(value) => onCommandTagModeChange(value as "and" | "or")}
            data={[
              { label: "AND", value: "and" },
              { label: "OR", value: "or" }
            ]}
          />
        </Group>
        <Group
          gap="xs"
          wrap="wrap"
          style={{
            maxHeight: 96,
            overflowY: "auto",
            alignContent: "flex-start",
            border: "1px solid var(--mantine-color-default-border)",
            borderRadius: 8,
            padding: 8
          }}
        >
          {availableCommandTags.map((tag) => {
            const selected = selectedCommandTagIds.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={selected ? "filled" : "light"}
                color={selected ? "teal" : "gray"}
                onClick={() => onToggleCommandTag(tag.id)}
              >
                {tag.name}
              </Badge>
            );
          })}
        </Group>
      </Stack>
      {commands.length === 0 ? (
        <Text size="sm" c="dimmed">
          該当コマンドがありません。HostTypePlatform 紐付けを確認してください。
        </Text>
      ) : null}
      <CommandList commands={commands} enableReorder={commandReorderMode} onRefresh={onRefresh} />
    </Stack>
  );
};

