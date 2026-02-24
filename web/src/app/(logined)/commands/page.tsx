"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import { CommandList } from "@/components/commands/CommandList";
import { CommandEditor } from "@/components/commands/CommandEditor";
import { CommandFilterPanel } from "@/components/commands/CommandFilterPanel";
import { CommandPaginationBar } from "@/components/commands/CommandPaginationBar";
import { FixedPlatformPreviewModal } from "@/components/commands/FixedPlatformPreviewModal";
import { Command, HostType, Platform, Tag } from "@/components/commands/types";
const PAGE_SIZE = 20;

type CommandPageResponse = {
  items: Command[];
  total: number;
  page: number;
  pageSize: number;
};

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [hostTypeId, setHostTypeId] = useState<string>("");
  const [platformId, setPlatformId] = useState<string>("");

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [copyAllAction, setCopyAllAction] = useState<(() => void) | null>(null);
  const [previewCopyAllAction, setPreviewCopyAllAction] = useState<(() => void) | null>(null);

  const [reorderMode, setReorderMode] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openFixedPlatformPreview, setOpenFixedPlatformPreview] = useState(false);

  const fetchMasters = useCallback(async () => {
    const [hostTypeRes, platformRes] = await Promise.all([
      fetch("/api/host-types"),
      fetch("/api/platforms")
    ]);
    if (hostTypeRes.ok) setHostTypes(await hostTypeRes.json());
    if (platformRes.ok) setPlatforms(await platformRes.json());
  }, []);

  const categories = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    for (const hostType of hostTypes) {
      if (!hostType.category) continue;
      map.set(hostType.category.id, {
        id: hostType.category.id,
        name: hostType.category.name
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [hostTypes]);

  const filteredHostTypes = useMemo(() => {
    if (!categoryId) return hostTypes;
    const id = Number(categoryId);
    return hostTypes.filter((hostType) => hostType.categoryId === id);
  }, [categoryId, hostTypes]);

  const filteredPlatforms = useMemo(() => {
    if (!hostTypeId && !categoryId) return platforms;

    if (hostTypeId) {
      const selectedHostTypeId = Number(hostTypeId);
      return platforms.filter((platform) =>
        (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === selectedHostTypeId)
      );
    }

    const selectedCategoryId = Number(categoryId);
    return platforms.filter((platform) =>
      (platform.hostTypeLinks ?? []).some((link) => link.hostType?.categoryId === selectedCategoryId)
    );
  }, [categoryId, hostTypeId, platforms]);

  useEffect(() => {
    if (!hostTypeId) return;
    if (!filteredHostTypes.some((hostType) => String(hostType.id) === hostTypeId)) {
      setHostTypeId("");
    }
  }, [filteredHostTypes, hostTypeId]);

  useEffect(() => {
    if (!platformId) return;
    if (!filteredPlatforms.some((platform) => String(platform.id) === platformId)) {
      setPlatformId("");
    }
  }, [filteredPlatforms, platformId]);

  const fetchCommands = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (hostTypeId) params.set("hostTypeId", hostTypeId);
    if (platformId) params.set("platformId", platformId);
    if (selectedTagIds.length > 0) params.set("tagIds", selectedTagIds.join(","));
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    const response = await fetch(`/api/commands?${params.toString()}`);
    if (!response.ok) return;

    const data = (await response.json()) as CommandPageResponse | Command[];
    if (Array.isArray(data)) {
      setCommands(data);
      setTotal(data.length);
      return;
    }

    setCommands(data.items);
    setTotal(data.total);
  }, [categoryId, hostTypeId, page, platformId, q, selectedTagIds]);

  const fetchAvailableTags = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (hostTypeId) params.set("hostTypeId", hostTypeId);
    if (platformId) params.set("platformId", platformId);

    const response = await fetch(`/api/commands/tags?${params.toString()}`);
    if (!response.ok) return;

    const tags = (await response.json()) as Tag[];
    setAvailableTags(tags);

    const tagIdSet = new Set(tags.map((tag) => tag.id));
    setSelectedTagIds((prev) => prev.filter((id) => tagIdSet.has(id)));
  }, [categoryId, hostTypeId, platformId, q]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  useEffect(() => {
    fetchAvailableTags();
  }, [fetchAvailableTags]);

  useEffect(() => {
    setPage(1);
  }, [q, categoryId, hostTypeId, platformId, selectedTagIds]);

  const addHostType = async () => {
    if (!categoryId) {
      window.alert("先に分類を選択してください。");
      return;
    }
    const name = window.prompt("追加するホスト種別名");
    if (!name) return;
    await fetch("/api/host-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, categoryId: Number(categoryId) })
    });
    await fetchMasters();
  };

  const addPlatform = async () => {
    const name = window.prompt("追加する機種名");
    if (!name) return;
    await fetch("/api/platforms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    await fetchMasters();
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedTagNames = useMemo(() => {
    const selected = new Set(selectedTagIds);
    return availableTags.filter((tag) => selected.has(tag.id)).map((tag) => tag.name);
  }, [availableTags, selectedTagIds]);
  const selectedPlatformLabel = useMemo(() => {
    if (!platformId) return "未指定（機種固定ページでは事前指定想定）";
    const selected = filteredPlatforms.find((item) => String(item.id) === platformId);
    if (!selected) return "未指定（機種固定ページでは事前指定想定）";
    return selected.vendor ? `${selected.vendor.name}/${selected.name}` : selected.name;
  }, [filteredPlatforms, platformId]);

  return (
    <Stack gap="md" p="md">
      <Group justify="space-between">
        <Text fw={700} size="xl">コマンド一覧</Text>
        <Group align="flex-end">
          <TextInput
            size="xs"
            w={260}
            placeholder="検索"
            value={q}
            onChange={(event) => setQ(event.currentTarget.value)}
          />
          <Button
            variant={reorderMode ? "filled" : "light"}
            onClick={() => setReorderMode((prev) => !prev)}
          >
            {reorderMode ? "順番変更終了" : "順番変更"}
          </Button>
          <Button variant="light" onClick={() => setOpenFixedPlatformPreview(true)}>
            機種固定プレビュー
          </Button>
          <Button onClick={() => setOpenCreate(true)}>新規追加</Button>
        </Group>
      </Group>

      <CommandFilterPanel
        categories={categories}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        filteredHostTypes={filteredHostTypes}
        hostTypeId={hostTypeId}
        onHostTypeChange={(nextHostTypeId, nextCategoryId) => {
          setHostTypeId(nextHostTypeId);
          if (nextHostTypeId) {
            setCategoryId(nextCategoryId);
          }
        }}
        filteredPlatforms={filteredPlatforms}
        platformId={platformId}
        onPlatformChange={setPlatformId}
        availableTags={availableTags}
        selectedTagIds={selectedTagIds}
        onToggleTag={toggleTag}
        onAddHostType={addHostType}
        onAddPlatform={addPlatform}
      />

      <CommandPaginationBar
        total={total}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        onCopyAll={() => copyAllAction?.()}
        copyDisabled={!copyAllAction || commands.length === 0}
      />

      <CommandList
        commands={commands}
        enableReorder={reorderMode}
        enableHostTypeReorder={reorderMode}
        onRegisterCopyAll={(fn) => setCopyAllAction(() => fn)}
        onRefresh={fetchCommands}
      />

      <Modal opened={openCreate} onClose={() => setOpenCreate(false)} title="コマンド新規作成" size="xl">
        <CommandEditor
          initialContext={{
            categoryId,
            hostTypeId,
            platformId,
            tags: selectedTagNames
          }}
          onCreated={fetchCommands}
        />
      </Modal>

      <FixedPlatformPreviewModal
        opened={openFixedPlatformPreview}
        onClose={() => {
          setOpenFixedPlatformPreview(false);
          setPreviewCopyAllAction(null);
        }}
        selectedPlatformLabel={selectedPlatformLabel}
        q={q}
        onSearchChange={setQ}
        categories={categories}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        filteredHostTypes={filteredHostTypes}
        hostTypeId={hostTypeId}
        onHostTypeChange={(nextHostTypeId, nextCategoryId) => {
          setHostTypeId(nextHostTypeId);
          if (nextHostTypeId) {
            setCategoryId(nextCategoryId);
          }
        }}
        filteredPlatforms={filteredPlatforms}
        platformId={platformId}
        onPlatformChange={setPlatformId}
        availableTags={availableTags}
        selectedTagIds={selectedTagIds}
        onToggleTag={toggleTag}
        commands={commands}
        total={total}
        page={page}
        totalPages={totalPages}
        onPrevPage={() => setPage((prev) => Math.max(prev - 1, 1))}
        onNextPage={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        onRegisterCopyAll={(fn) => setPreviewCopyAllAction(() => fn)}
        onRefresh={fetchCommands}
        onCopyAll={() => previewCopyAllAction?.()}
      />
    </Stack>
  );
}
