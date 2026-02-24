"use client";

import { Button, Group, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export const CommandPaginationBar = ({
  total,
  page,
  totalPages,
  onPrev,
  onNext,
  onCopyAll,
  copyDisabled
}: {
  total: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onCopyAll: () => void;
  copyDisabled: boolean;
}) => {
  return (
    <Group justify="flex-end" align="center">
      <Group gap="xs" align="center">
        <Button
          size="xs"
          variant="light"
          disabled={copyDisabled}
          onClick={onCopyAll}
        >
          表示中をまとめてコピー
        </Button>
        <Text size="sm" c="dimmed">{total} 件 / {page} / {totalPages} ページ</Text>
        <Button
          size="xs"
          variant="light"
          aria-label="前ページ"
          disabled={page <= 1}
          onClick={onPrev}
        >
          <IconChevronLeft size={14} />
        </Button>
        <Button
          size="xs"
          variant="light"
          aria-label="次ページ"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          <IconChevronRight size={14} />
        </Button>
      </Group>
    </Group>
  );
};

