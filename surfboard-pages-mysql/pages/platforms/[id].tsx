"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Group,
  Modal,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { useRouter } from "next/router";
import { Command, HostType, Platform, PlatformLink, Tag } from "@/components/commands/types";
import { CommandEditor } from "@/components/commands/CommandEditor";
import { PlatformCommandTab } from "@/components/commands/PlatformCommandTab";
import { PlatformLinksTab } from "@/components/commands/PlatformLinksTab";
import { PlatformLinkEditorModal } from "@/components/commands/PlatformLinkEditorModal";
import { sortByBadgeOrder, sortByName } from "@/lib/badgeOrder";

type Category = { id: number; name: string; groupOrderIndex: number };

export default function PlatformDetailPage() {
  const router = useRouter();
  const hostName = typeof router.query.hostName === "string" ? router.query.hostName : "";
  const platformId = Number(router.query.id);

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [hostTypeId, setHostTypeId] = useState<string>("");
  const [linkHostName, setLinkHostName] = useState<string>(hostName);
  const [commands, setCommands] = useState<Command[]>([]);
  const [links, setLinks] = useState<PlatformLink[]>([]);
  const [availableCommandTags, setAvailableCommandTags] = useState<Tag[]>([]);
  const [selectedCommandTagIds, setSelectedCommandTagIds] = useState<number[]>([]);
  const [commandTagMode, setCommandTagMode] = useState<"and" | "or">("and");
  const [availableLinkTags, setAvailableLinkTags] = useState<Tag[]>([]);
  const [selectedLinkTagIds, setSelectedLinkTagIds] = useState<number[]>([]);
  const [linkTagMode, setLinkTagMode] = useState<"and" | "or">("and");
  const [commandReorderMode, setCommandReorderMode] = useState(false);
  const [linkReorderMode, setLinkReorderMode] = useState(false);

  const [openLinkModal, setOpenLinkModal] = useState(false);
  const [openCommandModal, setOpenCommandModal] = useState(false);
  const [editingLink, setEditingLink] = useState<PlatformLink | null>(null);
  const [title, setTitle] = useState("");
  const [urlTemplate, setUrlTemplate] = useState("");
  const [commentTemplate, setCommentTemplate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [deviceBindingMode, setDeviceBindingMode] = useState<"INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE">(
    "INCLUDE_IN_DEVICE"
  );
  const [linkScope, setLinkScope] = useState<"platform" | "vendor" | "common">("platform");
  const [editorCategoryId, setEditorCategoryId] = useState<string>("");
  const [editorHostTypeId, setEditorHostTypeId] = useState<string>("");
  const [editorPlatformId, setEditorPlatformId] = useState<string>("");
  const [editorPlatformIds, setEditorPlatformIds] = useState<string[]>([]);
  const [editorVendorId, setEditorVendorId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const selectedPlatform = useMemo(
    () => platforms.find((item) => item.id === platformId) ?? null,
    [platformId, platforms]
  );
  const selectedHostType = useMemo(
    () => hostTypes.find((item) => String(item.id) === hostTypeId) ?? null,
    [hostTypeId, hostTypes]
  );

  const selectableHostTypes = useMemo(() => {
    if (!selectedPlatform) return sortByBadgeOrder(hostTypes);
    const idSet = new Set((selectedPlatform.hostTypeLinks ?? []).map((link) => link.hostTypeId));
    if (idSet.size === 0) return sortByBadgeOrder(hostTypes);
    return sortByBadgeOrder(hostTypes.filter((item) => idSet.has(item.id)));
  }, [hostTypes, selectedPlatform]);
  const editorPlatforms = useMemo(() => {
    if (!editorHostTypeId && !editorCategoryId) return sortByName(platforms);
    if (editorHostTypeId) {
      const selectedHostTypeId = Number(editorHostTypeId);
      return sortByName(platforms.filter((platform) =>
        (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === selectedHostTypeId)
      ));
    }
    const selectedCategoryId = Number(editorCategoryId);
    const selectableHostTypeIds = new Set(
      hostTypes.filter((hostType) => hostType.categoryId === selectedCategoryId).map((hostType) => hostType.id)
    );
    if (selectableHostTypeIds.size === 0) return sortByName(platforms);
    return sortByName(platforms.filter((platform) =>
      (platform.hostTypeLinks ?? []).some((link) => selectableHostTypeIds.has(link.hostTypeId))
    ));
  }, [editorCategoryId, editorHostTypeId, hostTypes, platforms]);
  const editorHostTypes = useMemo(() => {
    if (!editorCategoryId) return sortByBadgeOrder(hostTypes);
    const selectedCategoryId = Number(editorCategoryId);
    return sortByBadgeOrder(hostTypes.filter((hostType) => hostType.categoryId === selectedCategoryId));
  }, [editorCategoryId, hostTypes]);

  useEffect(() => {
    if (!hostTypeId && selectableHostTypes[0]) {
      setHostTypeId(String(selectableHostTypes[0].id));
    }
  }, [hostTypeId, selectableHostTypes]);

  useEffect(() => {
    if (!hostTypeId) return;
    if (selectableHostTypes.some((item) => String(item.id) === hostTypeId)) return;
    if (selectableHostTypes[0]) {
      setHostTypeId(String(selectableHostTypes[0].id));
    }
  }, [hostTypeId, selectableHostTypes]);

  useEffect(() => {
    if (!editorHostTypeId) return;
    if (!editorHostTypes.some((item) => String(item.id) === editorHostTypeId)) {
      setEditorHostTypeId("");
    }
  }, [editorHostTypeId, editorHostTypes]);

  useEffect(() => {
    if (!editorHostTypeId) return;
    const selected = hostTypes.find((item) => String(item.id) === editorHostTypeId);
    if (!selected) return;
    setEditorCategoryId(String(selected.categoryId));
  }, [editorHostTypeId, hostTypes]);

  const fetchMasters = useCallback(async () => {
    const [platformRes, hostTypeRes, categoryRes] = await Promise.all([
      fetch("/api/platforms/platforms"),
      fetch("/api/platforms/host-types"),
      fetch("/api/platforms/categories")
    ]);
    if (platformRes.ok) setPlatforms(await platformRes.json());
    if (hostTypeRes.ok) setHostTypes(await hostTypeRes.json());
    if (categoryRes.ok) setCategories(await categoryRes.json());
  }, []);

  const fetchCommands = useCallback(async () => {
    if (!platformId || !hostTypeId) return;
    const params = new URLSearchParams();
    params.set("platformId", String(platformId));
    params.set("hostTypeId", hostTypeId);
    if (selectedCommandTagIds.length > 0) {
      params.set("tagIds", selectedCommandTagIds.join(","));
      params.set("tagMode", commandTagMode);
    }
    const res = await fetch(`/api/platforms/commands?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setCommands(Array.isArray(data) ? data : data.items ?? []);
  }, [commandTagMode, hostTypeId, platformId, selectedCommandTagIds]);

  const fetchAvailableCommandTags = useCallback(async () => {
    if (!platformId || !hostTypeId) return;
    const params = new URLSearchParams();
    params.set("platformId", String(platformId));
    params.set("hostTypeId", hostTypeId);
    const res = await fetch(`/api/platforms/commands/tags?${params.toString()}`);
    if (!res.ok) return;
    const tags = (await res.json()) as Tag[];
    setAvailableCommandTags(tags);
    const tagIdSet = new Set(tags.map((tag) => tag.id));
    setSelectedCommandTagIds((prev) => {
      const next = prev.filter((id) => tagIdSet.has(id));
      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }
      return next;
    });
  }, [hostTypeId, platformId]);

  const fetchAvailableLinkTags = useCallback(async () => {
    if (!platformId || !hostTypeId) return;
    const normalParams = new URLSearchParams();
    normalParams.set("platformId", String(platformId));
    normalParams.set("hostTypeId", hostTypeId);
    const commonParams = new URLSearchParams();
    commonParams.set("platformId", String(platformId));
    commonParams.set("scope", "common");

    const [normalRes, commonRes] = await Promise.all([
      fetch(`/api/platforms/platform-links/tags?${normalParams.toString()}`),
      fetch(`/api/platforms/platform-links/tags?${commonParams.toString()}`)
    ]);
    if (!normalRes.ok && !commonRes.ok) return;
    const normalTags = normalRes.ok ? ((await normalRes.json()) as Tag[]) : [];
    const commonTags = commonRes.ok ? ((await commonRes.json()) as Tag[]) : [];
    const merged = new Map<number, Tag>();
    [...normalTags, ...commonTags].forEach((tag) => merged.set(tag.id, tag));
    const tags = Array.from(merged.values());
    setAvailableLinkTags(tags);
    const tagIdSet = new Set(tags.map((tag) => tag.id));
    setSelectedLinkTagIds((prev) => {
      const next = prev.filter((id) => tagIdSet.has(id));
      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }
      return next;
    });
  }, [hostTypeId, platformId]);

  const fetchLinks = useCallback(async () => {
    if (!platformId || !hostTypeId) return;
    const normalParams = new URLSearchParams();
    normalParams.set("platformId", String(platformId));
    normalParams.set("hostTypeId", hostTypeId);
    const commonParams = new URLSearchParams();
    commonParams.set("platformId", String(platformId));
    commonParams.set("scope", "common");
    if (selectedLinkTagIds.length > 0) {
      normalParams.set("tagIds", selectedLinkTagIds.join(","));
      normalParams.set("tagMode", linkTagMode);
      commonParams.set("tagIds", selectedLinkTagIds.join(","));
      commonParams.set("tagMode", linkTagMode);
    }
    if (linkHostName.trim()) {
      normalParams.set("hostName", linkHostName.trim());
      commonParams.set("hostName", linkHostName.trim());
    }
    const [normalRes, commonRes] = await Promise.all([
      fetch(`/api/platforms/platform-links?${normalParams.toString()}`),
      fetch(`/api/platforms/platform-links?${commonParams.toString()}`)
    ]);
    if (!normalRes.ok && !commonRes.ok) return;
    const normalLinks = normalRes.ok ? ((await normalRes.json()) as PlatformLink[]) : [];
    const commonLinks = commonRes.ok ? ((await commonRes.json()) as PlatformLink[]) : [];
    const merged = new Map<number, PlatformLink>();
    [...normalLinks, ...commonLinks].forEach((link) => merged.set(link.id, link));
    setLinks(Array.from(merged.values()));
  }, [hostTypeId, linkHostName, linkTagMode, platformId, selectedLinkTagIds]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchCommands();
    fetchLinks();
    fetchAvailableCommandTags();
    fetchAvailableLinkTags();
  }, [fetchAvailableCommandTags, fetchAvailableLinkTags, fetchCommands, fetchLinks]);

  useEffect(() => {
    setSelectedCommandTagIds([]);
    setSelectedLinkTagIds([]);
  }, [hostTypeId]);

  const toggleCommandTag = (tagId: number) => {
    setSelectedCommandTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleLinkTag = (tagId: number) => {
    setSelectedLinkTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };
  const handleEditorCategoryChange = (value: string) => {
    setEditorCategoryId(value);
    setEditorHostTypeId("");
    setEditorPlatformId("");
    setEditorPlatformIds([]);
  };
  const handleLinkScopeChange = (value: "platform" | "vendor" | "common") => {
    setLinkScope(value);
    if (value === "common") {
      setEditorCategoryId("");
      setEditorHostTypeId("");
      setEditorPlatformId("");
      setEditorPlatformIds([]);
      setEditorVendorId("");
      return;
    }
    if (value === "vendor") {
      setEditorPlatformId("");
      setEditorPlatformIds([]);
      return;
    }
    setEditorVendorId("");
  };

  const openCreateLink = () => {
    setEditingLink(null);
    setTitle("");
    setUrlTemplate("");
    setCommentTemplate("");
    setTags([]);
    setDeviceBindingMode("INCLUDE_IN_DEVICE");
    handleLinkScopeChange("platform");
    setEditorCategoryId(selectedHostType ? String(selectedHostType.categoryId) : "");
    setEditorHostTypeId(hostTypeId);
    setEditorPlatformId(String(platformId));
    setEditorPlatformIds(platformId ? [String(platformId)] : []);
    setEditorVendorId(selectedPlatform?.vendor?.id ? String(selectedPlatform.vendor.id) : "");
    setError(null);
    setOpenLinkModal(true);
  };

  const openEditLink = (link: PlatformLink) => {
    setEditingLink(link);
    setTitle(link.title ?? "");
    setUrlTemplate(link.urlTemplate ?? "");
    setCommentTemplate(link.commentTemplate ?? "");
    setTags((link.tags ?? []).map((item) => item.tag.name));
    setDeviceBindingMode(
      link.deviceBindingMode === "EXCLUDE_FROM_DEVICE"
        ? "EXCLUDE_FROM_DEVICE"
        : "INCLUDE_IN_DEVICE"
    );
    handleLinkScopeChange(link.vendorId && !link.platformId ? "vendor" : link.platformId ? "platform" : "common");
    const fallbackCategoryId =
      link.hostType?.categoryId ??
      hostTypes.find((item) => item.id === link.hostTypeId)?.categoryId ??
      null;
    setEditorCategoryId(fallbackCategoryId ? String(fallbackCategoryId) : "");
    setEditorHostTypeId(String(link.hostTypeId ?? hostTypeId));
    setEditorPlatformId(String(link.platformId ?? platformId));
    setEditorPlatformIds(link.platformId ? [String(link.platformId)] : [String(platformId)]);
    setEditorVendorId(String(link.vendorId ?? selectedPlatform?.vendor?.id ?? ""));
    setError(null);
    setOpenLinkModal(true);
  };

  const saveLink = async () => {
    if (!platformId || !hostTypeId) return;
    if (!title.trim() || !urlTemplate.trim()) {
      setError("タイトルとURLテンプレートは必須です。");
      return;
    }
    const commonHostTypeId = hostTypes.find((item) => item.name === "共通")?.id ?? null;
    const selectedHostTypeId =
      linkScope === "common"
        ? Number(commonHostTypeId || 0)
        : Number(editorHostTypeId || hostTypeId || commonHostTypeId || 0);
    const selectedVendorId = Number(editorVendorId || selectedPlatform?.vendor?.id || 0) || null;
    if (!selectedHostTypeId) {
      setError("共通ホスト種別が見つかりません。taxonomyで「共通」を作成してください。");
      return;
    }
    const selectedPlatformIds =
      linkScope === "platform"
        ? (editingLink
            ? [String(Number(editorPlatformId || editingLink?.platformId || platformId || 0))].filter((id) => id !== "0")
            : editorPlatformIds)
        : [];
    if (linkScope === "platform" && selectedPlatformIds.length === 0) {
      setError("機種名を選択してください。");
      return;
    }
    if (linkScope === "vendor" && !selectedVendorId) {
      setError("ベンダを選択してください。");
      return;
    }
    const payload = {
      title,
      urlTemplate,
      commentTemplate: commentTemplate || null,
      tags,
      platformId: linkScope === "platform" ? Number(selectedPlatformIds[0] || 0) || null : null,
      platformIds: linkScope === "platform" ? selectedPlatformIds.map((id) => Number(id)).filter((id) => id > 0) : [],
      vendorId: linkScope === "vendor" ? selectedVendorId : null,
      hostTypeId: selectedHostTypeId,
      visibility: "PUBLIC",
      deviceBindingMode,
      updatedAt: editingLink?.updatedAt
    };

    const res = await fetch(
      editingLink ? `/api/platforms/platform-links/${editingLink.id}` : "/api/platforms/platform-links",
      {
        method: editingLink ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );
    if (!res.ok) {
      let message = "保存に失敗しました。";
      try {
        const body = await res.json();
        if (typeof body?.error === "string" && body.error.trim()) {
          message = body.error;
        }
      } catch {
        // noop
      }
      if (res.status === 409) {
        message = "他で更新されました。再読み込みしてください。";
      }
      setError(message);
      return;
    }

    setOpenLinkModal(false);
    if (!editingLink) {
      // 新規作成直後はフィルタに隠れず確認できるよう、タグ絞り込みを解除する
      setSelectedLinkTagIds([]);
    }
    await fetchAvailableLinkTags();
    await fetchLinks();
  };

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (tagInput.trim()) params.set("q", tagInput.trim());
      params.set("scope", "link");
      const res = await fetch(`/api/platforms/tags/suggest?${params.toString()}`);
      if (!res.ok || !active) return;
      const data = (await res.json()) as Tag[];
      setTagSuggestions(Array.isArray(data) ? data : []);
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tagInput]);

  const deleteLink = async (link: PlatformLink) => {
    const ok = window.confirm(`「${link.title}」を削除しますか？`);
    if (!ok) return;
    let res = await fetch(`/api/platforms/platform-links/${link.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete: true })
    });
    if (res.status === 404) {
      res = await fetch(`/api/platform-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete: true })
      });
    }
    if (!res.ok) return;
    await fetchLinks();
  };

  const deleteEditingLink = async () => {
    if (!editingLink) return;
    await deleteLink(editingLink);
    setOpenLinkModal(false);
  };

  const reorderLinks = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const reordered = [...links];
    const [target] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, target);
    const res = await fetch("/api/platforms/platform-links/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((item) => item.id) })
    });
    if (!res.ok) return;
    await fetchLinks();
  };

  return (
    <Stack p="md" gap="md">
      <Text fw={700} size="xl">{selectedPlatform?.name ?? "機種詳細"}</Text>

      <Stack gap={4}>
        {hostName ? <Text size="sm" c="dimmed">呼び出しホスト名: {hostName}</Text> : null}
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={600}>ホスト種別</Text>
        <Group gap="xs" wrap="wrap">
          {selectableHostTypes.map((item) => (
            <Badge
              key={item.id}
              variant="light"
              color="gray"
            >
              {item.name}
            </Badge>
          ))}
        </Group>
      </Stack>

      <Tabs defaultValue="commands">
        <Tabs.List>
          <Tabs.Tab value="commands">関連コマンド</Tabs.Tab>
          <Tabs.Tab value="links">関連リンク</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="commands" pt="sm">
          <PlatformCommandTab
            commandReorderMode={commandReorderMode}
            onToggleReorderMode={() => setCommandReorderMode((prev) => !prev)}
            onOpenCreate={() => setOpenCommandModal(true)}
            commandTagMode={commandTagMode}
            onCommandTagModeChange={setCommandTagMode}
            availableCommandTags={availableCommandTags}
            selectedCommandTagIds={selectedCommandTagIds}
            onToggleCommandTag={toggleCommandTag}
            commands={commands}
            onRefresh={fetchCommands}
          />
        </Tabs.Panel>

        <Tabs.Panel value="links" pt="sm">
          <PlatformLinksTab
            linkReorderMode={linkReorderMode}
            onToggleReorderMode={() => setLinkReorderMode((prev) => !prev)}
            onOpenCreate={openCreateLink}
            linkTagMode={linkTagMode}
            onLinkTagModeChange={setLinkTagMode}
            availableLinkTags={availableLinkTags}
            selectedLinkTagIds={selectedLinkTagIds}
            onToggleLinkTag={toggleLinkTag}
            links={links}
            linkHostName={linkHostName}
            onLinkHostNameChange={setLinkHostName}
            onEditLink={openEditLink}
            onReorderLink={reorderLinks}
          />
        </Tabs.Panel>
      </Tabs>
      <PlatformLinkEditorModal
        opened={openLinkModal}
        onClose={() => setOpenLinkModal(false)}
        modalTitle={editingLink ? "リンク詳細" : "リンク新規追加"}
        title={title}
        onTitleChange={setTitle}
        linkScope={linkScope}
        onLinkScopeChange={handleLinkScopeChange}
        showTargetSelectors
        categories={categories}
        categoryId={editorCategoryId}
        onCategoryChange={handleEditorCategoryChange}
        hostTypes={editorHostTypes}
        hostTypeId={editorHostTypeId}
        onHostTypeChange={(value) => {
          setEditorHostTypeId(value);
          setEditorPlatformId("");
          setEditorPlatformIds([]);
        }}
        platforms={editorPlatforms}
        platformId={editorPlatformId}
        onPlatformChange={setEditorPlatformId}
        platformIds={editorPlatformIds}
        onPlatformIdsChange={setEditorPlatformIds}
        multiPlatformSelect={!editingLink && linkScope === "platform"}
        vendors={selectedPlatform?.vendor ? [{ id: selectedPlatform.vendor.id, name: selectedPlatform.vendor.name }] : []}
        vendorId={editorVendorId}
        onVendorChange={setEditorVendorId}
        urlTemplate={urlTemplate}
        onUrlTemplateChange={setUrlTemplate}
        commentTemplate={commentTemplate}
        onCommentTemplateChange={setCommentTemplate}
        tags={tags}
        onTagsChange={setTags}
        tagInput={tagInput}
        onTagInputChange={setTagInput}
        tagSuggestions={tagSuggestions}
        deviceBindingMode={deviceBindingMode}
        onDeviceBindingModeChange={setDeviceBindingMode}
        updatedBy={editingLink?.updatedBy}
        updatedAt={editingLink?.updatedAt}
        error={error}
        onDelete={editingLink ? deleteEditingLink : undefined}
        onSave={saveLink}
      />

      <Modal
        opened={openCommandModal}
        onClose={() => setOpenCommandModal(false)}
        title="コマンド新規作成"
        size="xl"
      >
        <CommandEditor
          initialContext={{
            categoryId: selectedHostType ? String(selectedHostType.categoryId) : "",
            hostTypeId,
            platformId: platformId ? String(platformId) : "",
            tags: []
          }}
          lockHostType
          lockPlatform
          onCreated={fetchCommands}
        />
      </Modal>
    </Stack>
  );
}
