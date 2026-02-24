"use client";

import { Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { Command, HostType, Platform, Tag } from "./types";
import { CommandFilterPanel } from "./CommandFilterPanel";
import { CommandList } from "./CommandList";
import { CommandPaginationBar } from "./CommandPaginationBar";

type CategoryItem = {
  id: number;
  name: string;
};

export const FixedPlatformPreviewModal = ({
  opened,
  onClose,
  selectedPlatformLabel,
  q,
  onSearchChange,
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
  commands,
  total,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
  onRegisterCopyAll,
  onRefresh,
  onCopyAll
}: {
  opened: boolean;
  onClose: () => void;
  selectedPlatformLabel: string;
  q: string;
  onSearchChange: (value: string) => void;
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
  commands: Command[];
  total: number;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRegisterCopyAll: (fn: () => void) => void;
  onRefresh: () => void;
  onCopyAll: () => void;
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="機種固定ページプレビュー" size="90%">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">機種名: {selectedPlatformLabel}</Text>
        <Group align="flex-end">
          <TextInput
            size="xs"
            w={260}
            placeholder="検索"
            value={q}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
          />
        </Group>

        <CommandFilterPanel
          categories={categories}
          categoryId={categoryId}
          onCategoryChange={onCategoryChange}
          filteredHostTypes={filteredHostTypes}
          hostTypeId={hostTypeId}
          onHostTypeChange={onHostTypeChange}
          filteredPlatforms={filteredPlatforms}
          platformId={platformId}
          onPlatformChange={onPlatformChange}
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          onToggleTag={onToggleTag}
          showPlatform={false}
        />

        <CommandPaginationBar
          total={total}
          page={page}
          totalPages={totalPages}
          onPrev={onPrevPage}
          onNext={onNextPage}
          onCopyAll={onCopyAll}
          copyDisabled={commands.length === 0}
        />

        <CommandList
          commands={commands}
          onRegisterCopyAll={onRegisterCopyAll}
          onRefresh={onRefresh}
        />
      </Stack>
    </Modal>
  );
};

