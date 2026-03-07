"use client";

import { Badge, Button, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { HostType, Platform, Tag } from "./types";
import { isCommonPlaceholderName } from "@/lib/commonPlaceholder";

const badgeStyle = { cursor: "pointer" } as const;

type CategoryItem = {
  id: number;
  name: string;
};
type VendorItem = {
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
  tagMode,
  onTagModeChange,
  onToggleTag,
  onAddHostType,
  onAddPlatform,
  scopeMode = "normal",
  onScopeModeChange,
  vendors = [],
  vendorId = "",
  onVendorChange,
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
  tagMode: "and" | "or";
  onTagModeChange: (value: "and" | "or") => void;
  onToggleTag: (tagId: number) => void;
  onAddHostType?: () => void;
  onAddPlatform?: () => void;
  scopeMode?: "normal" | "vendor";
  onScopeModeChange?: (value: "normal" | "vendor") => void;
  vendors?: VendorItem[];
  vendorId?: string;
  onVendorChange?: (value: string) => void;
  showPlatform?: boolean;
}) => {
  const vendorScope = scopeMode === "vendor";
  const visibleCategories = categories.filter((item) => !isCommonPlaceholderName(item.name));
  const visibleHostTypes = filteredHostTypes.filter((item) => !isCommonPlaceholderName(item.name));
  const selectedHostType = visibleHostTypes.find((item) => String(item.id) === hostTypeId) ?? null;
  const selectedPlatform = filteredPlatforms.find((item) => String(item.id) === platformId) ?? null;
  const hostTypeCollapsed = hostTypeId !== "";
  const platformCollapsed = platformId !== "";

  return (
    <Stack gap="xs">
      <Group justify="flex-start" align="center" gap="sm">
        <Text size="sm" fw={600}>表示モード</Text>
        <SegmentedControl
          size="xs"
          value={scopeMode}
          onChange={(value) => onScopeModeChange?.(value as "normal" | "vendor")}
          data={[
            { label: "通常", value: "normal" },
            { label: "ベンダ共有", value: "vendor" }
          ]}
        />
      </Group>
      {vendorScope ? (
        <>
          <Text size="sm" fw={600}>ベンダ</Text>
          <Group gap="xs" wrap="wrap">
            <Badge
              style={badgeStyle}
              variant={vendorId === "" ? "filled" : "light"}
              color={vendorId === "" ? "cyan" : "gray"}
              onClick={() => onVendorChange?.("")}
            >
              全て
            </Badge>
            {vendors.map((item) => (
              <Badge
                key={item.id}
                style={badgeStyle}
                variant={vendorId === String(item.id) ? "filled" : "light"}
                color={vendorId === String(item.id) ? "cyan" : "gray"}
                onClick={() => onVendorChange?.(String(item.id))}
              >
                {item.name}
              </Badge>
            ))}
          </Group>
          <Text size="xs" c="dimmed">
            ベンダ共有では、分類・ホスト種別・機種名の条件を無視して表示します。
          </Text>
        </>
      ) : null}

      {!vendorScope ? (
        <>
          <Text size="sm" fw={600}>分類</Text>
          <Group gap="xs" wrap="wrap">
            <Badge
              style={badgeStyle}
              variant={categoryId === "" ? "filled" : "light"}
              color={categoryId === "" ? "blue" : "gray"}
              onClick={() => onCategoryChange("")}
            >
              全て
            </Badge>
            {visibleCategories.map((item) => (
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
            <Text size="sm" fw={600}>ホスト種別</Text>
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
            {hostTypeCollapsed
              ? (selectedHostType ? (
                  <Badge style={badgeStyle} variant="filled" color="blue">
                    {selectedHostType.name}
                  </Badge>
                ) : null)
              : visibleHostTypes.map((item) => (
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
                <Text size="sm" fw={600}>機種名</Text>
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
                {platformCollapsed
                  ? (selectedPlatform ? (
                      <Badge style={badgeStyle} variant="filled" color="blue">
                        {selectedPlatform.name}
                      </Badge>
                    ) : null)
                  : filteredPlatforms.map((item) => (
                      <Badge
                        key={item.id}
                        style={badgeStyle}
                        variant={platformId === String(item.id) ? "filled" : "light"}
                        color={platformId === String(item.id) ? "blue" : "gray"}
                        onClick={() => onPlatformChange(String(item.id))}
                      >
                        {item.name}
                      </Badge>
                    ))}
              </Group>
            </>
          ) : null}
        </>
      ) : null}

      <Group justify="flex-start" align="center" gap="xs">
        <Text size="sm" fw={600}>タグ</Text>
        <SegmentedControl
          size="xs"
          value={tagMode}
          onChange={(value) => onTagModeChange(value as "and" | "or")}
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
