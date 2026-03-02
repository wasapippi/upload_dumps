"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { Command } from "./types";
import { CommandCard } from "./CommandCard";
import { CommandDetailModal } from "./CommandDetailModal";
import { CommandCopyModal } from "./CommandCopyModal";
import { extractBracketVariables } from "@/lib/commandTemplate";

const platformKey = (command: Command) =>
  command.platformId ? String(command.platformId) : "common";

export const CommandList = ({
  commands,
  enableReorder = false,
  enableHostTypeReorder = false,
  disableDeleteInDetail = false,
  disableDeleteTooltip = "機種別個別ページから削除してください。",
  variableStoreKey = "commands-variable-store",
  onRegisterCopyAll,
  onRefresh
}: {
  commands: Command[];
  enableReorder?: boolean;
  enableHostTypeReorder?: boolean;
  disableDeleteInDetail?: boolean;
  disableDeleteTooltip?: string;
  variableStoreKey?: string;
  onRegisterCopyAll?: (fn: () => void) => void;
  onRefresh?: () => void;
}) => {
  const [selected, setSelected] = useState<Command | null>(null);
  const [copyTargets, setCopyTargets] = useState<Command[]>([]);
  const [variableStore, setVariableStore] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!variableStoreKey || typeof window === "undefined") {
      setVariableStore({});
      return;
    }
    const raw = window.sessionStorage.getItem(variableStoreKey);
    if (!raw) {
      setVariableStore({});
      return;
    }
    try {
      setVariableStore(JSON.parse(raw) as Record<string, string>);
    } catch {
      setVariableStore({});
    }
  }, [variableStoreKey]);

  useEffect(() => {
    if (!variableStoreKey || typeof window === "undefined") return;
    window.sessionStorage.setItem(variableStoreKey, JSON.stringify(variableStore));
  }, [variableStore, variableStoreKey]);

  const groups = useMemo(() => {
    const map = new Map<
      number,
      {
        hostType: Command["hostType"];
        platforms: Map<string, Command[]>;
      }
    >();

    for (const command of commands) {
      if (!map.has(command.hostTypeId)) {
        map.set(command.hostTypeId, {
          hostType: command.hostType,
          platforms: new Map()
        });
      }
      const group = map.get(command.hostTypeId)!;
      const key = platformKey(command);
      if (!group.platforms.has(key)) {
        group.platforms.set(key, []);
      }
      group.platforms.get(key)!.push(command);
    }

    return Array.from(map.values()).sort(
      (a, b) => a.hostType.groupOrderIndex - b.hostType.groupOrderIndex
    );
  }, [commands]);

  const copyCommandsDirect = async (targets: Command[]) => {
    if (targets.some((command) => command.danger)) {
      const confirmed = window.confirm("danger コマンドを含みます。コピーして実行してよいですか？");
      if (!confirmed) return;
    }
    const merged = targets.map((command) => command.commandText).join("\n");
    await navigator.clipboard.writeText(merged);
    notifications.show({
      color: "teal",
      icon: <IconCheck size={16} />,
      message: "クリップボードにコピーしました"
    });
  };

  const hasVariables = (targets: Command[]) =>
    targets.some((command) => extractBracketVariables(command.commandText).length > 0);

  const handleCardCopy = async (command: Command) => {
    if (hasVariables([command])) {
      setCopyTargets([command]);
      return;
    }
    await copyCommandsDirect([command]);
  };

  const handleCopyCurrentList = useCallback(async () => {
    if (commands.length === 0) return;
    if (hasVariables(commands)) {
      setCopyTargets(commands);
      return;
    }
    await copyCommandsDirect(commands);
  }, [commands]);

  useEffect(() => {
    if (!onRegisterCopyAll) return;
    onRegisterCopyAll(handleCopyCurrentList);
  }, [handleCopyCurrentList, onRegisterCopyAll]);

  const handleReorder = async (
    list: Command[],
    index: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const current = list[index];
    const target = list[targetIndex];

    const payload = {
      items: [
        { id: current.id, orderIndex: target.orderIndex },
        { id: target.id, orderIndex: current.orderIndex }
      ]
    };

    await fetch("/api/commands/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    onRefresh?.();
  };

  const handleHostTypeReorder = async (
    groupIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? groupIndex - 1 : groupIndex + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;
    const current = groups[groupIndex].hostType;
    const target = groups[targetIndex].hostType;

    await fetch("/api/host-types/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          { id: current.id, groupOrderIndex: target.groupOrderIndex },
          { id: target.id, groupOrderIndex: current.groupOrderIndex }
        ]
      })
    });

    onRefresh?.();
  };

  return (
    <Stack gap="md">
      {groups.map((group, groupIndex) => (
        <Stack key={group.hostType.id} gap="xs">
          <Group justify="space-between" align="center">
            <Text fw={700} size="sm">
              {group.hostType.name}
            </Text>
            {enableHostTypeReorder ? (
              <Group gap="xs">
                <Button
                  size="compact-xs"
                  variant="light"
                  onClick={() => handleHostTypeReorder(groupIndex, "up")}
                  disabled={groupIndex === 0}
                >
                  上
                </Button>
                <Button
                  size="compact-xs"
                  variant="light"
                  onClick={() => handleHostTypeReorder(groupIndex, "down")}
                  disabled={groupIndex === groups.length - 1}
                >
                  下
                </Button>
              </Group>
            ) : null}
          </Group>
          {Array.from(group.platforms.entries())
            .sort(([keyA, listA], [keyB, listB]) => {
              if (keyA === "common") return -1;
              if (keyB === "common") return 1;
              const nameA = listA[0].platform?.name ?? "";
              const nameB = listB[0].platform?.name ?? "";
              return nameA.localeCompare(nameB);
            })
            .map(([key, list]) => {
              const sorted = [...list].sort((a, b) => {
                if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
                return a.id - b.id;
              });
              const platformLabel = key === "common" ? "共通" : list[0].platform?.name ?? "Platform";

              return (
                <Stack key={key} gap={4}>
                  <Text size="xs" c="dimmed">{platformLabel}</Text>
                  <Stack gap={4}>
                    {sorted.map((command, index) => (
                      <Group key={command.id} align="stretch" wrap="nowrap">
                        <div style={{ flex: 1 }}>
                          <CommandCard
                            command={command}
                            onClick={handleCardCopy}
                            onOpenDetail={(item) => setSelected(item)}
                          />
                        </div>
                        {enableReorder ? (
                          <Stack gap={2}>
                            <Button
                              size="compact-xs"
                              variant="light"
                              onClick={() => handleReorder(sorted, index, "up")}
                              disabled={index === 0}
                            >
                              上
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="light"
                              onClick={() => handleReorder(sorted, index, "down")}
                              disabled={index === sorted.length - 1}
                            >
                              下
                            </Button>
                          </Stack>
                        ) : null}
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              );
            })}
        </Stack>
      ))}

      <CommandCopyModal
        commands={copyTargets}
        opened={copyTargets.length > 0}
        cachedValues={variableStore}
        onCommitValues={(values) => setVariableStore((prev) => ({ ...prev, ...values }))}
        onClearCachedValues={() => {
          setVariableStore({});
          if (!variableStoreKey || typeof window === "undefined") return;
          window.sessionStorage.removeItem(variableStoreKey);
        }}
        onCopied={() =>
          notifications.show({
            color: "teal",
            icon: <IconCheck size={16} />,
            message: "クリップボードにコピーしました"
          })
        }
        onClose={() => setCopyTargets([])}
      />

      <CommandDetailModal
        command={selected}
        opened={Boolean(selected)}
        disableDelete={disableDeleteInDetail}
        disableDeleteTooltip={disableDeleteTooltip}
        onUpdated={onRefresh}
        onDeleted={() => setSelected(null)}
        onClose={() => setSelected(null)}
      />
    </Stack>
  );
};
