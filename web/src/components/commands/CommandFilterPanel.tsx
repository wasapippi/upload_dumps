"use client";

import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import { HostType, Platform, Tag } from "./types";

const badgeStyle = { cursor: "pointer" } as const;

type CategoryItem = {
  id: number;
  name: string;
};

export const CommandFilterPanel = ({
  categories,
  categoryId,
  onCategoryChange,
  filteredHostTypes,
  hostTypeId,
  onHostTypeChange,
  filteredPlatforms,
  platformId,
  onPlatformChange,
  availableTags,
  selectedTagIds,
  onToggleTag,
  onAddHostType,
  onAddPlatform,
  showPlatform = true
}: {
  categories: CategoryItem[];
  categoryId: string;
  onCategoryChange: (value: string) => void;
  filteredHostTypes: HostType[];
  hostTypeId: string;
  onHostTypeChange: (value: string, categoryId: string) => void;
  filteredPlatforms: Platform[];
  platformId: string;
  onPlatformChange: (value: string) => void;
  availableTags: Tag[];
  selectedTagIds: number[];
  onToggleTag: (tagId: number) => void;
  onAddHostType?: () => void;
  onAddPlatform?: () => void;
  showPlatform?: boolean;
}) => {
  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>分類 (単一)</Text>
      <Group gap="xs" wrap="wrap">
        <Badge
          style={badgeStyle}
          variant={categoryId === "" ? "filled" : "light"}
          color={categoryId === "" ? "blue" : "gray"}
          onClick={() => onCategoryChange("")}
        >
          全て
        </Badge>
        {categories.map((item) => (
          <Badge
            key={item.id}
            style={badgeStyle}
            variant={categoryId === String(item.id) ? "filled" : "light"}
            color={categoryId === String(item.id) ? "blue" : "gray"}
            onClick={() => onCategoryChange(String(item.id))}
          >
            {item.name}
          </Badge>
        ))}
      </Group>

      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Text size="sm" fw={600}>ホスト種別 (単一)</Text>
        {onAddHostType ? (
          <Button size="xs" variant="light" onClick={onAddHostType}>ホスト種別を追加</Button>
        ) : null}
      </Group>
      <Group gap="xs" wrap="wrap">
        <Badge
          style={badgeStyle}
          variant={hostTypeId === "" ? "filled" : "light"}
          color={hostTypeId === "" ? "blue" : "gray"}
          onClick={() => onHostTypeChange("", categoryId)}
        >
          全て
        </Badge>
        {filteredHostTypes.map((item) => (
          <Badge
            key={item.id}
            style={badgeStyle}
            variant={hostTypeId === String(item.id) ? "filled" : "light"}
            color={hostTypeId === String(item.id) ? "blue" : "gray"}
            onClick={() => onHostTypeChange(String(item.id), String(item.categoryId))}
          >
            {item.name}
          </Badge>
        ))}
      </Group>

      {showPlatform ? (
        <>
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Text size="sm" fw={600}>機種名 (単一)</Text>
            {onAddPlatform ? (
              <Button size="xs" variant="light" onClick={onAddPlatform}>機種名を追加</Button>
            ) : null}
          </Group>
          <Group gap="xs" wrap="wrap">
            <Badge
              style={badgeStyle}
              variant={platformId === "" ? "filled" : "light"}
              color={platformId === "" ? "blue" : "gray"}
              onClick={() => onPlatformChange("")}
            >
              全て
            </Badge>
            {filteredPlatforms.map((item) => (
              <Badge
                key={item.id}
                style={badgeStyle}
                variant={platformId === String(item.id) ? "filled" : "light"}
                color={platformId === String(item.id) ? "blue" : "gray"}
                onClick={() => onPlatformChange(String(item.id))}
              >
                {item.vendor ? `${item.vendor.name}/${item.name}` : item.name}
              </Badge>
            ))}
          </Group>
        </>
      ) : null}

      <Text size="sm" fw={600}>タグ (複数 / トグル)</Text>
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
        {availableTags.map((tag) => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <Badge
              key={tag.id}
              style={badgeStyle}
              variant={selected ? "filled" : "light"}
              color={selected ? "teal" : "gray"}
              onClick={() => onToggleTag(tag.id)}
            >
              {tag.name}
            </Badge>
          );
        })}
      </Group>
    </Stack>
  );
};

