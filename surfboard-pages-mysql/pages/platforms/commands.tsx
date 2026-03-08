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
import { Command, HostType, Platform, Tag } from "@/components/commands/types";
import DefaultLayout from "@/components/layouts/default";
const PAGE_SIZE = 20;
type Vendor = { id: number; name: string };
type Category = { id: number; name: string; groupOrderIndex: number };

type CommandPageResponse = {
  items: Command[];
  total: number;
  page: number;
  pageSize: number;
};

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [hostTypeId, setHostTypeId] = useState<string>("");
  const [platformId, setPlatformId] = useState<string>("");
  const [scopeMode, setScopeMode] = useState<"normal" | "vendor">("normal");
  const [vendorId, setVendorId] = useState<string>("");

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagMode, setTagMode] = useState<"and" | "or">("and");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [copyAllAction, setCopyAllAction] = useState<(() => void) | null>(null);

  const [reorderMode, setReorderMode] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [createEditorKey, setCreateEditorKey] = useState(0);

  const fetchMasters = useCallback(async () => {
    const [categoryRes, hostTypeRes, platformRes, vendorRes] = await Promise.all([
      fetch("/api/platforms/categories"),
      fetch("/api/platforms/host-types"),
      fetch("/api/platforms/platforms"),
      fetch("/api/platforms/vendors")
    ]);
    if (categoryRes.ok) setCategories(await categoryRes.json());
    if (hostTypeRes.ok) setHostTypes(await hostTypeRes.json());
    if (platformRes.ok) setPlatforms(await platformRes.json());
    if (vendorRes.ok) setVendors(await vendorRes.json());
  }, []);

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
    const selectableHostTypeIds = new Set(
      hostTypes.filter((hostType) => hostType.categoryId === selectedCategoryId).map((hostType) => hostType.id)
    );
    if (selectableHostTypeIds.size === 0) return platforms;
    return platforms.filter((platform) =>
      (platform.hostTypeLinks ?? []).some((link) => selectableHostTypeIds.has(link.hostTypeId))
    );
  }, [categoryId, hostTypeId, hostTypes, platforms]);

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
    params.set("scope", scopeMode);
    if (scopeMode === "vendor") {
      if (vendorId) params.set("vendorId", vendorId);
    } else {
      if (categoryId) params.set("categoryId", categoryId);
      if (hostTypeId) params.set("hostTypeId", hostTypeId);
      if (platformId) params.set("platformId", platformId);
    }
    if (selectedTagIds.length > 0) {
      params.set("tagIds", selectedTagIds.join(","));
      params.set("tagMode", tagMode);
    }
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    const response = await fetch(`/api/platforms/commands?${params.toString()}`);
    if (!response.ok) return;

    const data = (await response.json()) as CommandPageResponse | Command[];
    if (Array.isArray(data)) {
      setCommands(data);
      setTotal(data.length);
      return;
    }

    setCommands(data.items);
    setTotal(data.total);
  }, [categoryId, hostTypeId, page, platformId, q, scopeMode, selectedTagIds, tagMode, vendorId]);

  const fetchAvailableTags = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("scope", scopeMode);
    if (scopeMode === "vendor") {
      if (vendorId) params.set("vendorId", vendorId);
    } else {
      if (categoryId) params.set("categoryId", categoryId);
      if (hostTypeId) params.set("hostTypeId", hostTypeId);
      if (platformId) params.set("platformId", platformId);
    }

    const response = await fetch(`/api/platforms/commands/tags?${params.toString()}`);
    if (!response.ok) return;

    const tags = (await response.json()) as Tag[];
    setAvailableTags(tags);

    const tagIdSet = new Set(tags.map((tag) => tag.id));
    setSelectedTagIds((prev) => {
      const next = prev.filter((id) => tagIdSet.has(id));
      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }
      return next;
    });
  }, [categoryId, hostTypeId, platformId, q, scopeMode, vendorId]);

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
  }, [q, categoryId, hostTypeId, platformId, selectedTagIds, scopeMode, tagMode, vendorId]);

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
  const openCreateModal = () => {
    setCreateEditorKey((prev) => prev + 1);
    setOpenCreate(true);
  };

  return (
    <DefaultLayout id="platforms" title="機種別情報">
    <Stack gap="md" p="md" style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
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
          <Button onClick={openCreateModal}>新規追加</Button>
        </Group>
      </Group>

      <CommandFilterPanel
        scopeMode={scopeMode}
        onScopeModeChange={setScopeMode}
        vendors={vendors}
        vendorId={vendorId}
        onVendorChange={setVendorId}
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
        tagMode={tagMode}
        onTagModeChange={setTagMode}
        onToggleTag={toggleTag}
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
          key={createEditorKey}
          initialContext={{
            categoryId,
            hostTypeId,
            platformId,
            vendorId,
            scopeMode: scopeMode === "vendor" ? "vendor" : (platformId ? "platform" : "common"),
            tags: selectedTagNames
          }}
          onCreated={fetchCommands}
        />
      </Modal>

    </Stack>
    </DefaultLayout>
  );
}
