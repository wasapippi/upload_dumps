"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Group, Paper, SegmentedControl, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { CommandPaginationBar } from "@/components/commands/CommandPaginationBar";
import { PlatformLinkEditorModal } from "@/components/commands/PlatformLinkEditorModal";
import { HostType, Platform, PlatformLink, Tag } from "@/components/commands/types";

const PAGE_SIZE = 20;
type Vendor = { id: number; name: string };
type Category = { id: number; name: string; groupOrderIndex: number };

const badgeStyle = { cursor: "pointer" } as const;
const platformKey = (link: PlatformLink) => (link.platformId ? String(link.platformId) : (link.vendorId ? `vendor-${link.vendorId}` : "common"));

export default function LinksPage() {
  const [links, setLinks] = useState<PlatformLink[]>([]);
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

  const [openModal, setOpenModal] = useState(false);
  const [editingLink, setEditingLink] = useState<PlatformLink | null>(null);
  const [title, setTitle] = useState("");
  const [urlTemplate, setUrlTemplate] = useState("");
  const [commentTemplate, setCommentTemplate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [deviceBindingMode, setDeviceBindingMode] = useState<"INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE">("INCLUDE_IN_DEVICE");
  const [linkScope, setLinkScope] = useState<"platform" | "vendor">("platform");
  const [editorCategoryId, setEditorCategoryId] = useState<string>("");
  const [editorHostTypeId, setEditorHostTypeId] = useState<string>("");
  const [editorPlatformId, setEditorPlatformId] = useState<string>("");
  const [editorVendorId, setEditorVendorId] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchMasters = useCallback(async () => {
    const [categoryRes, hostTypeRes, platformRes, vendorRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/host-types"),
      fetch("/api/platforms"),
      fetch("/api/vendors")
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

  const fetchLinks = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (scopeMode === "vendor") {
      if (vendorId) params.set("vendorId", vendorId);
    } else {
      if (hostTypeId) params.set("hostTypeId", hostTypeId);
      if (platformId) params.set("platformId", platformId);
    }
    if (selectedTagIds.length > 0) {
      params.set("tagIds", selectedTagIds.join(","));
      params.set("tagMode", tagMode);
    }
    const res = await fetch(`/api/platform-links?${params.toString()}`);
    if (!res.ok) return;
    let items = (await res.json()) as PlatformLink[];
    if (categoryId && !hostTypeId) {
      const cId = Number(categoryId);
      items = items.filter((item) => item.hostType?.categoryId === cId);
    }
    setLinks(Array.isArray(items) ? items : []);
  }, [categoryId, hostTypeId, platformId, q, scopeMode, selectedTagIds, tagMode, vendorId]);

  const fetchAvailableTags = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (scopeMode === "vendor") {
      if (vendorId) params.set("vendorId", vendorId);
    } else {
      if (hostTypeId) params.set("hostTypeId", hostTypeId);
      if (platformId) params.set("platformId", platformId);
    }
    const res = await fetch(`/api/platform-links/tags?${params.toString()}`);
    if (!res.ok) return;
    const tags = (await res.json()) as Tag[];
    setAvailableTags(tags);
    const tagIdSet = new Set(tags.map((tag) => tag.id));
    setSelectedTagIds((prev) => {
      const next = prev.filter((id) => tagIdSet.has(id));
      if (next.length === prev.length && next.every((id, index) => id === prev[index])) return prev;
      return next;
    });
  }, [hostTypeId, platformId, q, scopeMode, vendorId]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchLinks();
    fetchAvailableTags();
  }, [fetchAvailableTags, fetchLinks]);

  useEffect(() => {
    setPage(1);
  }, [q, categoryId, hostTypeId, platformId, selectedTagIds, scopeMode, tagMode, vendorId]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };
  const handleEditorCategoryChange = (value: string) => {
    setEditorCategoryId(value);
    setEditorHostTypeId("");
    setEditorPlatformId("");
  };

  const pagedLinks = useMemo(() => {
    const start = Math.max(page - 1, 0) * PAGE_SIZE;
    return links.slice(start, start + PAGE_SIZE);
  }, [links, page]);
  const totalPages = Math.max(1, Math.ceil(links.length / PAGE_SIZE));
  const editorPlatforms = useMemo(() => {
    if (!editorHostTypeId) return platforms;
    const selectedHostTypeId = Number(editorHostTypeId);
    return platforms.filter((platform) =>
      (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === selectedHostTypeId)
    );
  }, [editorHostTypeId, platforms]);
  const editorHostTypes = useMemo(() => {
    if (!editorCategoryId) return hostTypes;
    const selectedCategoryId = Number(editorCategoryId);
    return hostTypes.filter((hostType) => hostType.categoryId === selectedCategoryId);
  }, [editorCategoryId, hostTypes]);

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

  const groupedPagedLinks = useMemo(() => {
    const sorted = [...pagedLinks].sort((a, b) => {
      const gA = a.hostType?.groupOrderIndex ?? Number.MAX_SAFE_INTEGER;
      const gB = b.hostType?.groupOrderIndex ?? Number.MAX_SAFE_INTEGER;
      if (gA !== gB) return gA - gB;
      const commonA = a.platformId ? 1 : 0;
      const commonB = b.platformId ? 1 : 0;
      if (commonA !== commonB) return commonA - commonB;
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      return a.id - b.id;
    });

    const map = new Map<number, { hostTypeName: string; platforms: Map<string, PlatformLink[]> }>();
    for (const link of sorted) {
      const hId = link.hostTypeId;
      if (!map.has(hId)) {
        map.set(hId, {
          hostTypeName: link.hostType?.name ?? `HostType-${hId}`,
          platforms: new Map()
        });
      }
      const key = platformKey(link);
      const group = map.get(hId)!;
      if (!group.platforms.has(key)) group.platforms.set(key, []);
      group.platforms.get(key)!.push(link);
    }
    return Array.from(map.entries()).map(([hostTypeId, value]) => ({ hostTypeId, ...value }));
  }, [pagedLinks]);

  const openCreate = () => {
    setEditingLink(null);
    setTitle("");
    setUrlTemplate("");
    setCommentTemplate("");
    setTags([]);
    setDeviceBindingMode("INCLUDE_IN_DEVICE");
    setLinkScope(scopeMode === "vendor" ? "vendor" : "platform");
    setEditorCategoryId(categoryId);
    setEditorHostTypeId(hostTypeId);
    setEditorPlatformId(platformId);
    setEditorVendorId(vendorId);
    setSaveError(null);
    setOpenModal(true);
  };

  const openEdit = (link: PlatformLink) => {
    setEditingLink(link);
    setTitle(link.title ?? "");
    setUrlTemplate(link.urlTemplate ?? "");
    setCommentTemplate(link.commentTemplate ?? "");
    setTags((link.tags ?? []).map((item) => item.tag.name));
    setDeviceBindingMode(link.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "EXCLUDE_FROM_DEVICE" : "INCLUDE_IN_DEVICE");
    setLinkScope(link.vendorId && !link.platformId ? "vendor" : "platform");
    setEditorCategoryId(link.hostType?.categoryId ? String(link.hostType.categoryId) : "");
    setEditorHostTypeId(String(link.hostTypeId ?? ""));
    setEditorPlatformId(link.platformId ? String(link.platformId) : "");
    setEditorVendorId(link.vendorId ? String(link.vendorId) : "");
    setSaveError(null);
    setOpenModal(true);
  };

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      params.set("scope", "link");
      if (tagInput.trim()) params.set("q", tagInput.trim());
      const res = await fetch(`/api/tags/suggest?${params.toString()}`);
      if (!res.ok || !active) return;
      const data = (await res.json()) as Tag[];
      setTagSuggestions(Array.isArray(data) ? data : []);
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tagInput]);

  const saveLink = async () => {
    const selectedHostTypeId = editorHostTypeId || editingLink?.hostTypeId?.toString();
    if (linkScope !== "vendor" && !selectedHostTypeId) {
      setSaveError("ホスト種別を選択してください。");
      return;
    }
    if (linkScope === "platform" && !editorPlatformId && !editingLink?.platformId) {
      setSaveError("機種名を選択してください。");
      return;
    }
    if (linkScope === "vendor" && !editorVendorId && !editingLink?.vendorId) {
      setSaveError("ベンダを選択してください。");
      return;
    }
    const payload = {
      title,
      urlTemplate,
      commentTemplate: commentTemplate || null,
      tags,
      platformId: linkScope === "platform" ? Number(editorPlatformId || editingLink?.platformId || 0) || null : null,
      vendorId: linkScope === "vendor" ? Number(editorVendorId || editingLink?.vendorId || 0) || null : null,
      hostTypeId: selectedHostTypeId ? Number(selectedHostTypeId) : null,
      visibility: "PUBLIC",
      deviceBindingMode,
      updatedAt: editingLink?.updatedAt
    };
    const res = await fetch(editingLink ? `/api/platform-links/${editingLink.id}` : "/api/platform-links", {
      method: editingLink ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      setSaveError(res.status === 409 ? "他で更新されました。再読み込みしてください。" : "保存に失敗しました。");
      return;
    }
    setOpenModal(false);
    await fetchLinks();
    await fetchAvailableTags();
  };

  const deleteEditingLink = async () => {
    if (!editingLink) return;
    const ok = window.confirm(`「${editingLink.title}」を削除しますか？`);
    if (!ok) return;
    const res = await fetch(`/api/platform-links/${editingLink.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setOpenModal(false);
    await fetchLinks();
    await fetchAvailableTags();
  };

  const openDisplayedLinksInTabs = () => {
    const targets = pagedLinks
      .map((link) => link.resolvedUrl ?? link.urlTemplate)
      .filter((url): url is string => Boolean(url));
    if (targets.length === 0) return;
    if (targets.length >= 2) {
      const ok = window.confirm(`${targets.length} 件のタブを開きます。よろしいですか？`);
      if (!ok) return;
    }
    const tabs: Window[] = [];
    for (let i = 0; i < targets.length; i += 1) {
      const tab = window.open("", "_blank");
      if (!tab) break;
      tabs.push(tab);
    }
    tabs.forEach((tab, index) => {
      tab.location.href = targets[index];
    });
  };

  return (
    <Stack p="md" gap="md">
      <Group justify="space-between">
        <Text fw={700} size="xl">関連リンク一覧</Text>
        <Group align="flex-end">
          <TextInput size="xs" w={260} placeholder="検索" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
          <Button onClick={openCreate}>新規追加</Button>
        </Group>
      </Group>

      <Stack gap="xs">
        <Group justify="flex-start" align="center" gap="sm">
          <Text size="sm" fw={600}>表示モード</Text>
          <SegmentedControl
            size="xs"
            value={scopeMode}
            onChange={(value) => setScopeMode(value as "normal" | "vendor")}
            data={[
              { label: "通常", value: "normal" },
              { label: "ベンダ共有", value: "vendor" }
            ]}
          />
        </Group>

        {scopeMode === "vendor" ? (
          <>
            <Text size="sm" fw={600}>ベンダ</Text>
            <Group gap="xs" wrap="wrap">
              <Badge style={badgeStyle} variant={vendorId === "" ? "filled" : "light"} color={vendorId === "" ? "cyan" : "gray"} onClick={() => setVendorId("")}>全て</Badge>
              {vendors.map((v) => (
                <Badge key={v.id} style={badgeStyle} variant={vendorId === String(v.id) ? "filled" : "light"} color={vendorId === String(v.id) ? "cyan" : "gray"} onClick={() => setVendorId(String(v.id))}>{v.name}</Badge>
              ))}
            </Group>
          </>
        ) : (
          <>
            <Text size="sm" fw={600}>分類</Text>
            <Group gap="xs" wrap="wrap">
              <Badge style={badgeStyle} variant={categoryId === "" ? "filled" : "light"} color={categoryId === "" ? "blue" : "gray"} onClick={() => setCategoryId("")}>全て</Badge>
              {categories.map((c) => (
                <Badge key={c.id} style={badgeStyle} variant={categoryId === String(c.id) ? "filled" : "light"} color={categoryId === String(c.id) ? "blue" : "gray"} onClick={() => setCategoryId(String(c.id))}>{c.name}</Badge>
              ))}
            </Group>
            <Text size="sm" fw={600}>ホスト種別</Text>
            <Group gap="xs" wrap="wrap">
              <Badge style={badgeStyle} variant={hostTypeId === "" ? "filled" : "light"} color={hostTypeId === "" ? "blue" : "gray"} onClick={() => setHostTypeId("")}>全て</Badge>
              {filteredHostTypes.map((h) => (
                <Badge key={h.id} style={badgeStyle} variant={hostTypeId === String(h.id) ? "filled" : "light"} color={hostTypeId === String(h.id) ? "blue" : "gray"} onClick={() => setHostTypeId(String(h.id))}>{h.name}</Badge>
              ))}
            </Group>
            <Text size="sm" fw={600}>機種名</Text>
            <Group gap="xs" wrap="wrap">
              <Badge style={badgeStyle} variant={platformId === "" ? "filled" : "light"} color={platformId === "" ? "blue" : "gray"} onClick={() => setPlatformId("")}>全て</Badge>
              {filteredPlatforms.map((p) => (
                <Badge key={p.id} style={badgeStyle} variant={platformId === String(p.id) ? "filled" : "light"} color={platformId === String(p.id) ? "blue" : "gray"} onClick={() => setPlatformId(String(p.id))}>{p.name}</Badge>
              ))}
            </Group>
          </>
        )}

        <Group justify="flex-start" align="center" gap="xs">
          <Text size="sm" fw={600}>タグ</Text>
          <SegmentedControl
            size="xs"
            value={tagMode}
            onChange={(value) => setTagMode(value as "and" | "or")}
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
              <Badge key={tag.id} style={badgeStyle} variant={selected ? "filled" : "light"} color={selected ? "teal" : "gray"} onClick={() => toggleTag(tag.id)}>
                {tag.name}
              </Badge>
            );
          })}
        </Group>
      </Stack>

      <CommandPaginationBar
        total={links.length}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        onCopyAll={openDisplayedLinksInTabs}
        copyDisabled={pagedLinks.length === 0}
        copyLabel="表示中をまとめて別タブで開く"
      />

      <Stack gap="md">
        {groupedPagedLinks.map((hostGroup) => (
          <Stack key={hostGroup.hostTypeId} gap="xs">
            <Text fw={700} size="sm">{hostGroup.hostTypeName}</Text>
            {Array.from(hostGroup.platforms.entries()).map(([key, list]) => {
              const platformLabel =
                key === "common"
                  ? "共通"
                  : key.startsWith("vendor-")
                    ? `${list[0].vendor?.name ?? "ベンダ"} 共通`
                    : (list[0].platform?.name ?? "機種固有");
              return (
                <Stack key={`${hostGroup.hostTypeId}-${key}`} gap={4}>
                  <Text size="xs" c="dimmed">{platformLabel}</Text>
                  {list.map((link) => (
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
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                            <Text fw={600} size="sm" lineClamp={1}>{link.title}</Text>
                            <a href={link.resolvedUrl ?? link.urlTemplate} target="_blank" rel="noreferrer" style={{ fontSize: 12, wordBreak: "break-all" }}>
                              {link.resolvedUrl ?? link.urlTemplate}
                            </a>
                            <Group gap={6}>
                              <Badge size="xs" color={link.vendorId && !link.platformId ? "cyan" : "gray"} variant="light">
                                {link.vendorId && !link.platformId ? "ベンダ共通" : "機種固有"}
                              </Badge>
                              {(link.tags ?? []).map((item) => (
                                <Badge key={`${link.id}-${item.tag.id}`} size="xs" color="teal" variant="light">
                                  {item.tag.name}
                                </Badge>
                              ))}
                            </Group>
                          </Stack>
                          <Button size="compact-xs" variant="light" onClick={() => openEdit(link)}>詳細</Button>
                        </Group>
                      </Paper>
                    </Tooltip>
                  ))}
                </Stack>
              );
            })}
          </Stack>
        ))}
        {pagedLinks.length === 0 ? <Text size="sm" c="dimmed">表示できるリンクはありません。</Text> : null}
      </Stack>

      <PlatformLinkEditorModal
        opened={openModal}
        onClose={() => setOpenModal(false)}
        modalTitle={editingLink ? "リンク詳細" : "リンク新規追加"}
        title={title}
        onTitleChange={setTitle}
        linkScope={linkScope}
        onLinkScopeChange={setLinkScope}
        showTargetSelectors
        categories={categories}
        categoryId={editorCategoryId}
        onCategoryChange={handleEditorCategoryChange}
        hostTypes={editorHostTypes}
        hostTypeId={editorHostTypeId}
        onHostTypeChange={setEditorHostTypeId}
        platforms={editorPlatforms}
        platformId={editorPlatformId}
        onPlatformChange={setEditorPlatformId}
        vendors={vendors}
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
        error={saveError}
        onDelete={editingLink ? deleteEditingLink : undefined}
        onSave={saveLink}
      />
    </Stack>
  );
}
