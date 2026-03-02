"use client";

import { Badge, Button, Group, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { Command } from "./types";

export const CommandCard = ({
  command,
  onClick,
  onOpenDetail
}: {
  command: Command;
  onClick: (command: Command) => void;
  onOpenDetail: (command: Command) => void;
}) => {
  return (
    <Tooltip
      label={command.description?.trim() || "説明なし"}
      multiline
      maw={520}
      withArrow
      position="top-start"
      openDelay={150}
    >
      <Paper
        withBorder
        radius="sm"
        p="xs"
        style={{
          cursor: "pointer",
          borderColor: command.danger ? "#e03131" : undefined
        }}
        onClick={() => onClick(command)}
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Group gap={6} wrap="wrap">
              <Text fw={600} size="sm" lineClamp={1}>{command.title}</Text>
              {command.danger ? (
                <Badge color="red" variant="filled" size="xs">danger</Badge>
              ) : null}
              {command.platform ? (
                <Badge color="gray" variant="light" size="xs">{command.platform.name}</Badge>
              ) : null}
              {!command.platform && command.vendor ? (
                <Badge color="cyan" variant="light" size="xs">{command.vendor.name} 共通</Badge>
              ) : null}
            </Group>
            <Text size="xs" ff="monospace" lineClamp={2}>
              {command.commandText}
            </Text>
            <Group gap={4} wrap="wrap">
              {command.tags.slice(0, 4).map((tagLink) => (
                <Badge key={tagLink.tag.id} color="teal" variant="light" size="xs">
                  {tagLink.tag.name}
                </Badge>
              ))}
            </Group>
          </Stack>
          <Button
            size="compact-xs"
            variant="light"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail(command);
            }}
          >
            詳細
          </Button>
        </Group>
      </Paper>
    </Tooltip>
  );
};
