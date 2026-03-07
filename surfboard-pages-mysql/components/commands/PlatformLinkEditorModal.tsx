"use client";

import { Badge, Button, Group, Modal, Stack, TagsInput, Text, TextInput, Textarea } from "@mantine/core";
import { HostType, Platform, Tag } from "./types";

const badgeStyle = { cursor: "pointer" } as const;

type Props = {
  opened: boolean;
  onClose: () => void;
  modalTitle?: string;
  title: string;
  onTitleChange: (value: string) => void;
  linkScope: "platform" | "vendor" | "common";
  onLinkScopeChange: (value: "platform" | "vendor" | "common") => void;
  urlTemplate: string;
  onUrlTemplateChange: (value: string) => void;
  commentTemplate: string;
  onCommentTemplateChange: (value: string) => void;
  tags: string[];
  onTagsChange: (values: string[]) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  tagSuggestions: Tag[];
  showTargetSelectors?: boolean;
  categories?: Array<{ id: number; name: string }>;
  categoryId?: string;
  onCategoryChange?: (value: string) => void;
  hostTypes?: HostType[];
  hostTypeId?: string;
  onHostTypeChange?: (value: string) => void;
  platforms?: Platform[];
  platformId?: string;
  onPlatformChange?: (value: string) => void;
  platformIds?: string[];
  onPlatformIdsChange?: (values: string[]) => void;
  multiPlatformSelect?: boolean;
  vendors?: Array<{ id: number; name: string }>;
  vendorId?: string;
  onVendorChange?: (value: string) => void;
  deviceBindingMode: "INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE";
  onDeviceBindingModeChange: (value: "INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE") => void;
  updatedBy?: string;
  updatedAt?: string;
  error?: string | null;
  onDelete?: () => void;
  onSave: () => void;
};

export const PlatformLinkEditorModal = ({
  opened,
  onClose,
  modalTitle,
  title,
  onTitleChange,
  linkScope,
  onLinkScopeChange,
  urlTemplate,
  onUrlTemplateChange,
  commentTemplate,
  onCommentTemplateChange,
  tags,
  onTagsChange,
  tagInput,
  onTagInputChange,
  tagSuggestions,
  showTargetSelectors = false,
  categories = [],
  categoryId = "",
  onCategoryChange,
  hostTypes = [],
  hostTypeId = "",
  onHostTypeChange,
  platforms = [],
  platformId = "",
  onPlatformChange,
  platformIds = [],
  onPlatformIdsChange,
  multiPlatformSelect = false,
  vendors = [],
  vendorId = "",
  onVendorChange,
  deviceBindingMode,
  onDeviceBindingModeChange,
  updatedBy,
  updatedAt,
  error,
  onDelete,
  onSave
}: Props) => {
  return (
    <Modal opened={opened} onClose={onClose} title={modalTitle ?? "リンク編集"} size="xl">
      <Stack gap="sm">
        {updatedBy || updatedAt ? (
          <Group gap="md">
            <Text size="sm" c="dimmed">最終更新者: {updatedBy || "Unknown"}</Text>
            <Text size="sm" c="dimmed">更新日時: {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}</Text>
          </Group>
        ) : null}
        <TextInput label="タイトル" value={title} onChange={(e) => onTitleChange(e.currentTarget.value)} required />
        <Textarea
          label="コメント"
          value={commentTemplate}
          onChange={(e) => onCommentTemplateChange(e.currentTarget.value)}
          minRows={2}
        />
        <TextInput
          label="URL"
          value={urlTemplate}
          onChange={(e) => onUrlTemplateChange(e.currentTarget.value.replace(/[\r\n]+/g, ""))}
          description="例: https://example.local/device/{{HOST_NAME}}"
          required
        />
        <Text size="sm" fw={600}>適用範囲</Text>
        <Group gap="xs">
          <Badge
            style={badgeStyle}
            variant={linkScope === "common" ? "filled" : "light"}
            color={linkScope === "common" ? "violet" : "gray"}
            onClick={() => onLinkScopeChange("common")}
          >
            全装置共通
          </Badge>
          <Badge
            style={badgeStyle}
            variant={linkScope === "platform" ? "filled" : "light"}
            color={linkScope === "platform" ? "blue" : "gray"}
            onClick={() => onLinkScopeChange("platform")}
          >
            機種固有
          </Badge>
          <Badge
            style={badgeStyle}
            variant={linkScope === "vendor" ? "filled" : "light"}
            color={linkScope === "vendor" ? "cyan" : "gray"}
            onClick={() => onLinkScopeChange("vendor")}
          >
            ベンダ共通
          </Badge>
        </Group>
        {showTargetSelectors ? (
          <>
            {linkScope === "common" ? null : linkScope === "vendor" ? (
              <>
                <Text size="sm" fw={600}>ベンダ</Text>
                <Group gap="xs" wrap="wrap">
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
              </>
            ) : (
              <>
                <Text size="sm" fw={600}>分類</Text>
                <Group gap="xs" wrap="wrap">
                  {categories.map((item) => (
                    <Badge
                      key={item.id}
                      style={badgeStyle}
                      variant={categoryId === String(item.id) ? "filled" : "light"}
                      color={categoryId === String(item.id) ? "blue" : "gray"}
                      onClick={() => onCategoryChange?.(String(item.id))}
                    >
                      {item.name}
                    </Badge>
                  ))}
                </Group>
                <Text size="sm" fw={600}>ホスト種別</Text>
                <Group gap="xs" wrap="wrap">
                  {hostTypes.map((item) => (
                    <Badge
                      key={item.id}
                      style={badgeStyle}
                      variant={hostTypeId === String(item.id) ? "filled" : "light"}
                      color={hostTypeId === String(item.id) ? "blue" : "gray"}
                      onClick={() => onHostTypeChange?.(String(item.id))}
                    >
                      {item.name}
                    </Badge>
                  ))}
                </Group>
                <Text size="sm" fw={600}>機種名</Text>
                <Group gap="xs" wrap="wrap">
                  {platforms.map((item) => (
                    <Badge
                      key={item.id}
                      style={badgeStyle}
                      variant={
                        multiPlatformSelect
                          ? (platformIds.includes(String(item.id)) ? "filled" : "light")
                          : (platformId === String(item.id) ? "filled" : "light")
                      }
                      color={
                        multiPlatformSelect
                          ? (platformIds.includes(String(item.id)) ? "blue" : "gray")
                          : (platformId === String(item.id) ? "blue" : "gray")
                      }
                      onClick={() => {
                        const id = String(item.id);
                        if (multiPlatformSelect && onPlatformIdsChange) {
                          const next = platformIds.includes(id)
                            ? platformIds.filter((v) => v !== id)
                            : [...platformIds, id];
                          onPlatformIdsChange(next);
                          return;
                        }
                        onPlatformChange?.(id);
                      }}
                    >
                      {item.name}
                    </Badge>
                  ))}
                </Group>
              </>
            )}
          </>
        ) : null}
        <TagsInput
          label="タグ"
          placeholder="タグ入力"
          value={tags}
          data={tagSuggestions.map((tag) => tag.name)}
          searchValue={tagInput}
          onSearchChange={onTagInputChange}
          onChange={onTagsChange}
        />
        <Text size="sm" fw={600}>装置情報連携</Text>
        <Group gap="xs">
          <Badge
            style={badgeStyle}
            variant={deviceBindingMode === "INCLUDE_IN_DEVICE" ? "filled" : "light"}
            color={deviceBindingMode === "INCLUDE_IN_DEVICE" ? "teal" : "gray"}
            onClick={() => onDeviceBindingModeChange("INCLUDE_IN_DEVICE")}
          >
            連携する
          </Badge>
          <Badge
            style={badgeStyle}
            variant={deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "filled" : "light"}
            color={deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "teal" : "gray"}
            onClick={() => onDeviceBindingModeChange("EXCLUDE_FROM_DEVICE")}
          >
            連携しない
          </Badge>
        </Group>
        {error ? <Text c="red" size="sm">{error}</Text> : null}
        <Group justify="space-between">
          <Button color="red" variant="light" onClick={onDelete} disabled={!onDelete}>削除</Button>
          <Group>
            <Button variant="light" onClick={onClose}>キャンセル</Button>
            <Button onClick={onSave}>保存</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
