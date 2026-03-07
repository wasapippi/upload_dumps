"use client";

import { useMemo } from "react";
import { Badge, Button, Group, Paper, SegmentedControl, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { PlatformLink, Tag } from "./types";
import { urlEllipsisStyle } from "@/lib/urlEllipsis";

type Props = {
  linkReorderMode: boolean;
  onToggleReorderMode: () => void;
  onOpenCreate: () => void;
  linkTagMode: "and" | "or";
  onLinkTagModeChange: (value: "and" | "or") => void;
  availableLinkTags: Tag[];
  selectedLinkTagIds: number[];
  onToggleLinkTag: (tagId: number) => void;
  links: PlatformLink[];
  linkHostName: string;
  onLinkHostNameChange: (value: string) => void;
  onEditLink: (link: PlatformLink) => void;
  onReorderLink: (index: number, direction: "up" | "down") => void;
};

export const PlatformLinksTab = ({
  linkReorderMode,
  onToggleReorderMode,
  onOpenCreate,
  linkTagMode,
  onLinkTagModeChange,
  availableLinkTags,
  selectedLinkTagIds,
  onToggleLinkTag,
  links,
  linkHostName,
  onLinkHostNameChange,
  onEditLink,
  onReorderLink
}: Props) => {
  const groupedLinks = useMemo(() => {
    const map = new Map<number, { hostTypeName: string; platforms: Map<string, PlatformLink[]> }>();
    links.forEach((link) => {
      if (!map.has(link.hostTypeId)) {
        map.set(link.hostTypeId, {
          hostTypeName: link.hostType?.name ?? `HostType-${link.hostTypeId}`,
          platforms: new Map()
        });
      }
      const key = link.platformId ? String(link.platformId) : (link.vendorId ? `vendor-${link.vendorId}` : "common");
      const group = map.get(link.hostTypeId)!;
      if (!group.platforms.has(key)) group.platforms.set(key, []);
      group.platforms.get(key)!.push(link);
    });
    return Array.from(map.entries()).map(([hostTypeId, value]) => ({ hostTypeId, ...value }));
  }, [links]);

  return (
    <Stack gap="xs">
      <Group justify="flex-end">
        <Button variant={linkReorderMode ? "filled" : "light"} onClick={onToggleReorderMode}>
          {linkReorderMode ? "順番変更を終了" : "順番変更"}
        </Button>
        <Button onClick={onOpenCreate}>リンク追加</Button>
      </Group>
      <Stack gap={6}>
        <Group justify="flex-start" align="center" gap="xs">
          <Text size="sm" fw={600}>タグで絞り込み</Text>
          <SegmentedControl
            size="xs"
            value={linkTagMode}
            onChange={(value) => onLinkTagModeChange(value as "and" | "or")}
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
          {availableLinkTags.map((tag) => {
            const selected = selectedLinkTagIds.includes(tag.id);
            return (
              <Badge
                key={`link-filter-${tag.id}`}
                variant={selected ? "filled" : "light"}
                color={selected ? "teal" : "gray"}
                onClick={() => onToggleLinkTag(tag.id)}
              >
                {tag.name}
              </Badge>
            );
          })}
        </Group>
      </Stack>

      {links.some(
        (link) =>
          (link.urlTemplate ?? "").includes("{{HOST_NAME}}") ||
          (link.commentTemplate ?? "").includes("{{HOST_NAME}}")
      ) ? (
        <TextInput
          label="ホスト名"
          placeholder="例: router01"
          value={linkHostName}
          onChange={(event) => onLinkHostNameChange(event.currentTarget.value)}
        />
      ) : null}

      {groupedLinks.map((hostGroup) => (
        <Stack key={hostGroup.hostTypeId} gap="xs">
          <Text fw={700} size="sm">{hostGroup.hostTypeName}</Text>
          {Array.from(hostGroup.platforms.entries()).map(([key, list]) => {
            const platformLabel =
              key === "common"
                ? "全装置共有"
                : key.startsWith("vendor-")
                  ? `${list[0].vendor?.name ?? "ベンダ"} 共通`
                  : (list[0].platform?.name ?? "機種固有");
            return (
              <Stack key={`${hostGroup.hostTypeId}-${key}`} gap={4}>
                <Text size="xs" c="dimmed">{platformLabel}</Text>
                {list.map((link) => {
                  const index = links.findIndex((item) => item.id === link.id);
                  return (
                    <Tooltip
                      key={link.id}
                      label={link.resolvedComment ?? link.commentTemplate ?? "説明なし"}
                      multiline
                      maw={520}
                      withArrow
                      position="top-start"
                      openDelay={150}
                    >
                      <Paper withBorder p="sm" radius="sm">
                        <Stack gap={6}>
                          <Group justify="space-between" align="center" wrap="nowrap">
                            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                              <Text fw={600} size="sm" lineClamp={1}>{link.title}</Text>
                              <a
                                href={link.resolvedUrl ?? link.urlTemplate}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 12, ...urlEllipsisStyle }}
                                title={link.resolvedUrl ?? link.urlTemplate}
                              >
                                {link.resolvedUrl ?? link.urlTemplate}
                              </a>
                            </Stack>
                            <Group gap={6}>
                              {linkReorderMode ? (
                                <>
                                  <Button
                                    size="compact-xs"
                                    variant="light"
                                    onClick={() => onReorderLink(index, "up")}
                                    disabled={index <= 0}
                                  >
                                    ↑
                                  </Button>
                                  <Button
                                    size="compact-xs"
                                    variant="light"
                                    onClick={() => onReorderLink(index, "down")}
                                    disabled={index < 0 || index === links.length - 1}
                                  >
                                    ↓
                                  </Button>
                                </>
                              ) : null}
                              <Button size="compact-xs" variant="light" onClick={() => onEditLink(link)}>詳細</Button>
                            </Group>
                          </Group>
                          <Group gap={6}>
                            <Badge
                              size="xs"
                              color={!link.vendorId && !link.platformId ? "violet" : link.vendorId && !link.platformId ? "cyan" : "gray"}
                              variant="light"
                            >
                              {!link.vendorId && !link.platformId ? "全装置共有" : link.vendorId && !link.platformId ? "ベンダ共通" : "機種固有"}
                            </Badge>
                            <Badge
                              size="xs"
                              color={link.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "orange" : "teal"}
                              variant="light"
                            >
                              {link.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "装置非連携" : "装置連携"}
                            </Badge>
                            {(link.tags ?? []).map((item) => (
                              <Badge key={`${link.id}-${item.tag.id}`} size="xs" color="teal" variant="light">
                                {item.tag.name}
                              </Badge>
                            ))}
                          </Group>
                        </Stack>
                      </Paper>
                    </Tooltip>
                  );
                })}
              </Stack>
            );
          })}
        </Stack>
      ))}
      {links.length === 0 ? <Text size="sm" c="dimmed">表示できるリンクはありません。</Text> : null}
    </Stack>
  );
};
