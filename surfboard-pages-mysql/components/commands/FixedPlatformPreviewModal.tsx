"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Group, Modal, Paper, SegmentedControl, Stack, Tabs, Text, TextInput, Tooltip } from "@mantine/core";
import { Command, HostType, Platform, PlatformLink, Tag } from "./types";
import { CommandList } from "./CommandList";
import { CommandPaginationBar } from "./CommandPaginationBar";
import { PlatformLinkEditorModal } from "./PlatformLinkEditorModal";
import { CommandEditor } from "./CommandEditor";
import { urlEllipsisStyle } from "@/lib/urlEllipsis";

type Category = { id: number; name: string };
type Vendor = { id: number; name: string };

export const FixedPlatformPreviewModal = ({
  opened,
  onClose,
  scopeModeLabel,
  categoryLabel,
  hostTypeLabel,
  hostName,
  selectedPlatformLabel,
  selectedPlatformVendorId,
  hostTypeId,
  platformId,
  platformOptions,
  onPlatformSelect,
  initialQ,
  initialTagIds,
  initialTagMode
}: {
  opened: boolean;
  onClose: () => void;
  scopeModeLabel: string;
  categoryLabel: string;
  hostTypeLabel: string;
  hostName?: string;
  selectedPlatformLabel: string;
  selectedPlatformVendorId?: string;
  hostTypeId: string;
  platformId: string;
  platformOptions?: Array<{ id: string; name: string }>;
  onPlatformSelect?: (platformId: string) => void;
  initialQ?: string;
  initialTagIds?: number[];
  initialTagMode?: "and" | "or";
}) => {
  const COMMAND_PAGE_SIZE = 20;
  const LINK_PAGE_SIZE = 10;
  const [allCommands, setAllCommands] = useState<Command[]>([]);
  const [commandQ, setCommandQ] = useState(initialQ ?? "");
  const [commandPage, setCommandPage] = useState(1);
  const [commandTagMode, setCommandTagMode] = useState<"and" | "or">(initialTagMode ?? "and");
  const [selectedCommandTagIds, setSelectedCommandTagIds] = useState<number[]>(initialTagIds ?? []);
  const [commandCopyAllAction, setCommandCopyAllAction] = useState<(() => void) | null>(null);
  const [openCommandCreate, setOpenCommandCreate] = useState(false);

  const [allLinks, setAllLinks] = useState<PlatformLink[]>([]);
  const [availableLinkTags, setAvailableLinkTags] = useState<Tag[]>([]);
  const [selectedLinkTagIds, setSelectedLinkTagIds] = useState<number[]>([]);
  const [linkTagMode, setLinkTagMode] = useState<"and" | "or">("and");
  const [linkQ, setLinkQ] = useState("");
  const [linkPage, setLinkPage] = useState(1);
  const [openLinkDetail, setOpenLinkDetail] = useState(false);
  const [editingLink, setEditingLink] = useState<PlatformLink | null>(null);
  const [linkScope, setLinkScope] = useState<"platform" | "vendor" | "common">("platform");
  const [deviceBindingMode, setDeviceBindingMode] = useState<"INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE">("INCLUDE_IN_DEVICE");
  const [linkTitle, setLinkTitle] = useState("");
  const [urlTemplate, setUrlTemplate] = useState("");
  const [commentTemplate, setCommentTemplate] = useState("");
  const [linkTags, setLinkTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [editorCategoryId, setEditorCategoryId] = useState<string>("");
  const [editorHostTypeId, setEditorHostTypeId] = useState<string>(hostTypeId);
  const [editorPlatformId, setEditorPlatformId] = useState<string>(platformId);
  const [editorVendorId, setEditorVendorId] = useState<string>(selectedPlatformVendorId ?? "");
  const handleLinkScopeChange = (value: "platform" | "vendor" | "common") => {
    setLinkScope(value);
    if (value === "common") {
      setEditorCategoryId("");
      setEditorHostTypeId("");
      setEditorPlatformId("");
      setEditorVendorId("");
      return;
    }
    if (value === "vendor") {
      setEditorPlatformId("");
      return;
    }
    setEditorVendorId("");
  };

  useEffect(() => {
    if (!opened) return;
    const loadMasters = async () => {
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
    };
    loadMasters();
  }, [opened]);

  useEffect(() => {
    setEditorHostTypeId(hostTypeId);
    setEditorPlatformId(platformId);
    setEditorVendorId(selectedPlatformVendorId ?? "");
    const currentHostType = hostTypes.find((item) => String(item.id) === hostTypeId);
    if (currentHostType) {
      setEditorCategoryId(String(currentHostType.categoryId));
    }
  }, [hostTypeId, hostTypes, platformId, selectedPlatformVendorId]);

  const fetchCommands = useCallback(async () => {
    if (!platformId) {
      setAllCommands([]);
      return;
    }

    const params = new URLSearchParams();
    params.set("scope", "normal");
    params.set("forDevice", "1");
    params.set("platformId", platformId);
    if (hostTypeId) params.set("hostTypeId", hostTypeId);

    const res = await fetch(`/api/platforms/commands?${params.toString()}`);
    if (!res.ok) {
      setAllCommands([]);
      return;
    }

    const data = await res.json();
    setAllCommands(Array.isArray(data) ? data : []);
  }, [hostTypeId, platformId]);

  useEffect(() => {
    if (!opened) return;
    fetchCommands();
  }, [fetchCommands, opened]);

  useEffect(() => {
    if (!opened) return;
    setCommandQ(initialQ ?? "");
    setCommandTagMode(initialTagMode ?? "and");
    setSelectedCommandTagIds(initialTagIds ?? []);
    setCommandPage(1);
  }, [initialQ, initialTagIds, initialTagMode, opened]);

  const availableCommandTags = useMemo(() => {
    const map = new Map<number, Tag>();
    allCommands.forEach((command) => {
      (command.tags ?? []).forEach((item) => {
        if (!map.has(item.tag.id)) {
          map.set(item.tag.id, item.tag);
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCommands]);

  useEffect(() => {
    const idSet = new Set(availableCommandTags.map((tag) => tag.id));
    setSelectedCommandTagIds((prev) => prev.filter((id) => idSet.has(id)));
  }, [availableCommandTags]);

  useEffect(() => {
    setCommandPage(1);
  }, [commandQ, commandTagMode, selectedCommandTagIds]);

  const filteredCommandsByTag = useMemo(() => {
    if (selectedCommandTagIds.length === 0) return allCommands;
    const selectedSet = new Set(selectedCommandTagIds);
    return allCommands.filter((command) => {
      const tagIds = new Set((command.tags ?? []).map((item) => item.tag.id));
      if (commandTagMode === "or") {
        return selectedCommandTagIds.some((id) => tagIds.has(id));
      }
      return Array.from(selectedSet).every((id) => tagIds.has(id));
    });
  }, [allCommands, commandTagMode, selectedCommandTagIds]);

  const filteredCommands = useMemo(() => {
    const needle = commandQ.trim().toLowerCase();
    if (!needle) return filteredCommandsByTag;
    return filteredCommandsByTag.filter((command) => {
      const title = (command.title ?? "").toLowerCase();
      const description = (command.description ?? "").toLowerCase();
      const commandText = (command.commandText ?? "").toLowerCase();
      return title.includes(needle) || description.includes(needle) || commandText.includes(needle);
    });
  }, [commandQ, filteredCommandsByTag]);

  const commandTotal = filteredCommands.length;
  const commandTotalPages = Math.max(1, Math.ceil(commandTotal / COMMAND_PAGE_SIZE));
  const safeCommandPage = Math.min(commandPage, commandTotalPages);
  const pagedCommands = useMemo(() => {
    const start = (safeCommandPage - 1) * COMMAND_PAGE_SIZE;
    return filteredCommands.slice(start, start + COMMAND_PAGE_SIZE);
  }, [filteredCommands, safeCommandPage]);

  useEffect(() => {
    const loadLinkTags = async () => {
      if (!opened || !platformId) {
        setAvailableLinkTags([]);
        setSelectedLinkTagIds([]);
        return;
      }
      const normalParams = new URLSearchParams();
      normalParams.set("platformId", platformId);
      if (hostTypeId) normalParams.set("hostTypeId", hostTypeId);
      const commonParams = new URLSearchParams();
      commonParams.set("platformId", platformId);
      commonParams.set("scope", "common");
      const [normalRes, commonRes] = await Promise.all([
        fetch(`/api/platforms/platform-links/tags?${normalParams.toString()}`),
        fetch(`/api/platforms/platform-links/tags?${commonParams.toString()}`)
      ]);
      if (!normalRes.ok && !commonRes.ok) {
        setAvailableLinkTags([]);
        setSelectedLinkTagIds([]);
        return;
      }
      const normalTags = normalRes.ok ? ((await normalRes.json()) as Tag[]) : [];
      const commonTags = commonRes.ok ? ((await commonRes.json()) as Tag[]) : [];
      const merged = new Map<number, Tag>();
      [...normalTags, ...commonTags].forEach((tag) => merged.set(tag.id, tag));
      const data = Array.from(merged.values());
      setAvailableLinkTags(data);
      const idSet = new Set(data.map((tag) => tag.id));
      setSelectedLinkTagIds((prev) => {
        const next = prev.filter((id) => idSet.has(id));
        if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
          return prev;
        }
        return next;
      });
    };
    loadLinkTags();
  }, [hostTypeId, opened, platformId]);

  useEffect(() => {
    const loadLinks = async () => {
      if (!opened || !platformId) {
        setAllLinks([]);
        return;
      }
      const normalParams = new URLSearchParams();
      normalParams.set("platformId", platformId);
      if (hostTypeId) normalParams.set("hostTypeId", hostTypeId);
      if (hostName?.trim()) normalParams.set("hostName", hostName.trim());
      const commonParams = new URLSearchParams();
      commonParams.set("platformId", platformId);
      commonParams.set("scope", "common");
      if (hostName?.trim()) commonParams.set("hostName", hostName.trim());
      const [normalRes, commonRes] = await Promise.all([
        fetch(`/api/platforms/platform-links?${normalParams.toString()}`),
        fetch(`/api/platforms/platform-links?${commonParams.toString()}`)
      ]);
      if (!normalRes.ok && !commonRes.ok) {
        setAllLinks([]);
        return;
      }
      const normalLinks = normalRes.ok ? ((await normalRes.json()) as PlatformLink[]) : [];
      const commonLinks = commonRes.ok ? ((await commonRes.json()) as PlatformLink[]) : [];
      const merged = new Map<number, PlatformLink>();
      [...normalLinks, ...commonLinks].forEach((link) => merged.set(link.id, link));
      setAllLinks(Array.from(merged.values()));
    };
    loadLinks();
  }, [hostTypeId, opened, platformId]);

  useEffect(() => {
    setLinkPage(1);
  }, [linkQ, selectedLinkTagIds, linkTagMode]);

  const links = useMemo(() => {
    if (selectedLinkTagIds.length === 0) return allLinks;
    const selectedSet = new Set(selectedLinkTagIds);
    return allLinks.filter((link) => {
      const tagIds = new Set((link.tags ?? []).map((item) => item.tag.id));
      if (linkTagMode === "or") {
        return selectedLinkTagIds.some((id) => tagIds.has(id));
      }
      return Array.from(selectedSet).every((id) => tagIds.has(id));
    });
  }, [allLinks, linkTagMode, selectedLinkTagIds]);

  const filteredLinks = useMemo(() => {
    const needle = linkQ.trim().toLowerCase();
    if (!needle) return links;
    return links.filter((link) => {
      const title = (link.title ?? "").toLowerCase();
      const url = (link.resolvedUrl ?? link.urlTemplate ?? "").toLowerCase();
      const comment = (link.resolvedComment ?? link.commentTemplate ?? "").toLowerCase();
      return title.includes(needle) || url.includes(needle) || comment.includes(needle);
    });
  }, [linkQ, links]);

  const linkTotal = filteredLinks.length;
  const linkTotalPages = Math.max(1, Math.ceil(linkTotal / LINK_PAGE_SIZE));
  const safeLinkPage = Math.min(linkPage, linkTotalPages);
  const pagedLinks = useMemo(() => {
    const start = (safeLinkPage - 1) * LINK_PAGE_SIZE;
    return filteredLinks.slice(start, start + LINK_PAGE_SIZE);
  }, [filteredLinks, safeLinkPage]);
  const groupedPagedLinks = useMemo(() => {
    const map = new Map<number, { hostTypeName: string; platforms: Map<string, PlatformLink[]> }>();
    pagedLinks.forEach((link) => {
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
  }, [pagedLinks]);

  const filteredEditorHostTypes = useMemo(() => {
    if (!editorCategoryId) return hostTypes;
    return hostTypes.filter((item) => item.categoryId === Number(editorCategoryId));
  }, [editorCategoryId, hostTypes]);

  const filteredEditorPlatforms = useMemo(() => {
    let matched = platforms;
    if (editorHostTypeId) {
      const selectedHostTypeId = Number(editorHostTypeId);
      matched = platforms.filter((platform) =>
        (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === selectedHostTypeId)
      );
    } else if (editorCategoryId) {
      const selectedCategoryId = Number(editorCategoryId);
      const selectableHostTypeIds = new Set(
        hostTypes.filter((hostType) => hostType.categoryId === selectedCategoryId).map((hostType) => hostType.id)
      );
      if (selectableHostTypeIds.size > 0) {
        matched = platforms.filter((platform) =>
          (platform.hostTypeLinks ?? []).some((link) => selectableHostTypeIds.has(link.hostTypeId))
        );
      }
    }
    if (!editorPlatformId) return matched;
    if (matched.some((platform) => String(platform.id) === editorPlatformId)) return matched;
    const selected = platforms.find((platform) => String(platform.id) === editorPlatformId);
    return selected ? [selected, ...matched] : matched;
  }, [editorCategoryId, editorHostTypeId, editorPlatformId, hostTypes, platforms]);

  useEffect(() => {
    if (linkScope !== "platform") return;
    if (editorPlatformId) return;
    if (platformId) {
      setEditorPlatformId(platformId);
    }
  }, [editorPlatformId, linkScope, platformId]);

  const openDisplayedLinksInTabs = () => {
    const targets = pagedLinks
      .map((link) => link.resolvedUrl ?? link.urlTemplate)
      .map((url) => url?.trim())
      .filter((url): url is string => Boolean(url));
    if (targets.length === 0) return;
    if (targets.length >= 2) {
      const ok = window.confirm(`${targets.length} 件のタブを開きます。よろしいですか？`);
      if (!ok) return;
    }
    const normalizedTargets = targets
      .map((rawUrl) => {
        try {
          return new URL(rawUrl, window.location.origin).toString();
        } catch {
          return null;
        }
      })
      .filter((url): url is string => Boolean(url));

    const openedTabs: Window[] = [];
    for (let i = 0; i < normalizedTargets.length; i += 1) {
      const tab = window.open("", "_blank");
      if (!tab) break;
      openedTabs.push(tab);
    }

    openedTabs.forEach((tab, index) => {
      tab.location.href = normalizedTargets[index];
    });

    if (openedTabs.length === 0) {
      window.alert("タブを開けませんでした。ブラウザのポップアップブロック設定を確認してください。");
    }
  };

  useEffect(() => {
    if (!openLinkDetail) return;
    let active = true;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      params.set("scope", "link");
      if (tagInput.trim()) params.set("q", tagInput.trim());
      const res = await fetch(`/api/platforms/tags/suggest?${params.toString()}`);
      if (!res.ok || !active) return;
      const data = (await res.json()) as Tag[];
      setTagSuggestions(Array.isArray(data) ? data : []);
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [openLinkDetail, tagInput]);

  const openDetailModal = (link: PlatformLink) => {
    setEditingLink(link);
    handleLinkScopeChange(link.vendorId && !link.platformId ? "vendor" : link.platformId ? "platform" : "common");
    setDeviceBindingMode(link.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "EXCLUDE_FROM_DEVICE" : "INCLUDE_IN_DEVICE");
    setLinkTitle(link.title ?? "");
    setUrlTemplate(link.urlTemplate ?? "");
    setCommentTemplate(link.commentTemplate ?? "");
    setLinkTags((link.tags ?? []).map((item) => item.tag.name));
    setTagInput("");
    setTagSuggestions([]);
    setSaveError(null);
    setEditorHostTypeId(String(link.hostTypeId ?? hostTypeId));
    const fallbackCategoryId =
      link.hostType?.categoryId ??
      hostTypes.find((item) => item.id === link.hostTypeId)?.categoryId ??
      null;
    setEditorCategoryId(fallbackCategoryId ? String(fallbackCategoryId) : "");
    setEditorPlatformId(String(link.platformId ?? platformId));
    setEditorVendorId(String(link.vendorId ?? selectedPlatformVendorId ?? ""));
    setOpenLinkDetail(true);
  };

  const openCreateModal = () => {
    setEditingLink(null);
    handleLinkScopeChange("platform");
    setDeviceBindingMode("INCLUDE_IN_DEVICE");
    setLinkTitle("");
    setUrlTemplate("");
    setCommentTemplate("");
    setLinkTags([]);
    setTagInput("");
    setTagSuggestions([]);
    setSaveError(null);
    const currentHostType = hostTypes.find((item) => String(item.id) === hostTypeId);
    setEditorCategoryId(currentHostType ? String(currentHostType.categoryId) : "");
    setEditorHostTypeId(hostTypeId);
    setEditorPlatformId(platformId);
    setEditorVendorId(selectedPlatformVendorId ?? "");
    setOpenLinkDetail(true);
  };

  const saveLink = async () => {
    const numericPlatformId = Number(editorPlatformId || platformId || 0);
    const commonHostTypeId = hostTypes.find((item) => item.name === "共通")?.id ?? null;
    const numericHostTypeId =
      linkScope === "common"
        ? Number(commonHostTypeId || 0)
        : Number(editorHostTypeId || hostTypeId || 0);
    const numericVendorId =
      Number(editorVendorId || editingLink?.vendorId || selectedPlatformVendorId || 0) || null;
    const resolvedHostTypeId = Number(editingLink?.hostTypeId ?? numericHostTypeId);

    if (linkScope === "platform" && !Number.isFinite(numericPlatformId)) {
      setSaveError("機種名を選択してください。");
      return;
    }
    if (linkScope === "vendor" && !numericVendorId) {
      setSaveError("ベンダを選択してください。");
      return;
    }
    if (!Number.isFinite(resolvedHostTypeId) || resolvedHostTypeId <= 0) {
      if (linkScope === "common") {
        setSaveError("共通ホスト種別が見つかりません。taxonomyで「共通」を作成してください。");
        return;
      }
      setSaveError("ホスト種別を選択してください。");
      return;
    }

    const payload = {
      title: linkTitle,
      urlTemplate,
      commentTemplate: commentTemplate || null,
      tags: linkTags,
      platformId: linkScope === "platform" ? numericPlatformId : null,
      vendorId: linkScope === "vendor" ? numericVendorId : null,
      hostTypeId: resolvedHostTypeId,
      visibility: editingLink?.visibility ?? "PUBLIC",
      deviceBindingMode,
      updatedAt: editingLink?.updatedAt
    };
    const res = await fetch(editingLink ? `/api/platforms/platform-links/${editingLink.id}` : "/api/platforms/platform-links", {
      method: editingLink ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      setSaveError(res.status === 409 ? "他で更新されました。再読み込みしてください。" : "保存に失敗しました。");
      return;
    }
    setOpenLinkDetail(false);
    const params = new URLSearchParams();
    params.set("platformId", platformId);
    const normalParams = new URLSearchParams(params);
    if (hostTypeId) normalParams.set("hostTypeId", hostTypeId);
    if (hostName?.trim()) normalParams.set("hostName", hostName.trim());
    const commonParams = new URLSearchParams(params);
    commonParams.set("scope", "common");
    if (hostName?.trim()) commonParams.set("hostName", hostName.trim());
    if (selectedLinkTagIds.length > 0) {
      normalParams.set("tagIds", selectedLinkTagIds.join(","));
      normalParams.set("tagMode", linkTagMode);
      commonParams.set("tagIds", selectedLinkTagIds.join(","));
      commonParams.set("tagMode", linkTagMode);
    }
    const [normalRes, commonRes] = await Promise.all([
      fetch(`/api/platforms/platform-links?${normalParams.toString()}`),
      fetch(`/api/platforms/platform-links?${commonParams.toString()}`)
    ]);
    if (normalRes.ok || commonRes.ok) {
      const normalLinks = normalRes.ok ? ((await normalRes.json()) as PlatformLink[]) : [];
      const commonLinks = commonRes.ok ? ((await commonRes.json()) as PlatformLink[]) : [];
      const merged = new Map<number, PlatformLink>();
      [...normalLinks, ...commonLinks].forEach((link) => merged.set(link.id, link));
      setAllLinks(Array.from(merged.values()));
    }
  };

  const detailHref = platformId ? `/platforms/${platformId}` : "";

  return (
    <Modal opened={opened} onClose={onClose} title={hostName?.trim() || "機種固定ページプレビュー"} size="85%">
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap={6} wrap="wrap">
            <Badge variant="light" color="gray">表示モード: {scopeModeLabel}</Badge>
            <Badge variant="light" color="gray">分類: {categoryLabel}</Badge>
            <Badge variant="light" color="gray">ホスト種別: {hostTypeLabel}</Badge>
            <Badge variant="light" color="gray">機種名: {selectedPlatformLabel}</Badge>
          </Group>
          {detailHref ? (
            <Button
              component="a"
              href={detailHref}
              target="_blank"
              rel="noreferrer"
              size="xs"
              variant="light"
            >
              個別ページを開く
            </Button>
          ) : null}
        </Group>
        {platformOptions && platformOptions.length > 1 && onPlatformSelect ? (
          <Stack gap={4}>
            <Text size="sm" fw={600}>機種名</Text>
            <Group gap="xs" wrap="wrap">
              {platformOptions.map((option) => (
                <Badge
                  key={option.id}
                  style={{ cursor: "pointer" }}
                  variant={option.id === platformId ? "filled" : "light"}
                  color={option.id === platformId ? "blue" : "gray"}
                  onClick={() => onPlatformSelect(option.id)}
                >
                  {option.name}
                </Badge>
              ))}
            </Group>
          </Stack>
        ) : null}
        <Tabs defaultValue="commands">
          <Tabs.List>
            <Tabs.Tab value="commands">関連コマンド</Tabs.Tab>
            <Tabs.Tab value="links">関連リンク</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="commands" pt="sm">
            <Group justify="space-between" align="flex-end" mb={6}>
              <TextInput
                size="xs"
                w={260}
                placeholder="検索"
                value={commandQ}
                onChange={(event) => setCommandQ(event.currentTarget.value)}
              />
              <Group gap="xs" align="center">
                <CommandPaginationBar
                  total={commandTotal}
                  page={safeCommandPage}
                  totalPages={commandTotalPages}
                  onPrev={() => setCommandPage((prev) => Math.max(prev - 1, 1))}
                  onNext={() => setCommandPage((prev) => Math.min(prev + 1, commandTotalPages))}
                  onCopyAll={() => commandCopyAllAction?.()}
                  copyDisabled={pagedCommands.length === 0}
                />
                <Button size="xs" onClick={() => setOpenCommandCreate(true)}>
                  コマンド追加
                </Button>
              </Group>
            </Group>
            <Stack gap="xs" mb="xs">
              <Group justify="flex-start" align="center" gap="xs">
                <Text size="sm" fw={600}>タグ</Text>
                <SegmentedControl
                  size="xs"
                  value={commandTagMode}
                  onChange={(value) => setCommandTagMode(value as "and" | "or")}
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
                {availableCommandTags.map((tag) => {
                  const selected = selectedCommandTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      style={{ cursor: "pointer" }}
                      variant={selected ? "filled" : "light"}
                      color={selected ? "teal" : "gray"}
                      onClick={() =>
                        setSelectedCommandTagIds((prev) =>
                          prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                        )
                      }
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </Group>
            </Stack>
            <CommandList
              commands={pagedCommands}
              disableDeleteInDetail
              disableDeleteTooltip="機種別個別ページから削除してください。"
              onRegisterCopyAll={(fn) => setCommandCopyAllAction(() => fn)}
              onRefresh={fetchCommands}
            />
          </Tabs.Panel>

          <Tabs.Panel value="links" pt="sm">
            <Stack gap="xs">
              <Group justify="space-between" align="flex-end" mb={6}>
                <TextInput
                  size="xs"
                  w={260}
                  placeholder="検索"
                  value={linkQ}
                  onChange={(event) => setLinkQ(event.currentTarget.value)}
                />
                <Group gap="xs" align="center">
                  <CommandPaginationBar
                    total={linkTotal}
                    page={safeLinkPage}
                    totalPages={linkTotalPages}
                    onPrev={() => setLinkPage((prev) => Math.max(prev - 1, 1))}
                    onNext={() => setLinkPage((prev) => Math.min(prev + 1, linkTotalPages))}
                    onCopyAll={openDisplayedLinksInTabs}
                    copyDisabled={pagedLinks.length === 0}
                    copyLabel="表示中をまとめて別タブで開く"
                  />
                  <Button size="xs" onClick={openCreateModal}>リンク追加</Button>
                </Group>
              </Group>
              <Stack gap={6} mb="xs">
                <Group justify="flex-start" align="center" gap="xs">
                  <Text size="sm" fw={600}>タグ</Text>
                  <SegmentedControl
                    size="xs"
                    value={linkTagMode}
                    onChange={(value) => setLinkTagMode(value as "and" | "or")}
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
                        key={`preview-link-filter-${tag.id}`}
                        style={{ cursor: "pointer" }}
                        variant={selected ? "filled" : "light"}
                        color={selected ? "teal" : "gray"}
                        onClick={() =>
                          setSelectedLinkTagIds((prev) =>
                            prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                          )
                        }
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </Group>
              </Stack>
              {groupedPagedLinks.map((hostGroup) => (
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
                                  <Button size="compact-xs" variant="light" onClick={() => openDetailModal(link)}>
                                    詳細
                                  </Button>
                                </Group>
                                <Group gap={6}>
                                  <Badge
                                    size="xs"
                                    color={!link.vendorId && !link.platformId ? "violet" : link.vendorId && !link.platformId ? "cyan" : "gray"}
                                    variant="light"
                                  >
                                    {!link.vendorId && !link.platformId ? "全装置共有" : link.vendorId && !link.platformId ? "ベンダ共通" : "機種固有"}
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
                        ))}
                      </Stack>
                    );
                  })}
                </Stack>
              ))}
              {pagedLinks.length === 0 ? (
                <Text size="sm" c="dimmed">表示できるリンクはありません。</Text>
              ) : null}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
      <PlatformLinkEditorModal
        opened={openLinkDetail}
        onClose={() => setOpenLinkDetail(false)}
        modalTitle={editingLink ? "リンク詳細" : "リンク新規追加"}
        title={linkTitle}
        onTitleChange={setLinkTitle}
        linkScope={linkScope}
        onLinkScopeChange={handleLinkScopeChange}
        showTargetSelectors
        categories={categories}
        categoryId={editorCategoryId}
        onCategoryChange={(value) => {
          setEditorCategoryId(value);
          setEditorHostTypeId("");
          setEditorPlatformId("");
        }}
        hostTypes={filteredEditorHostTypes}
        hostTypeId={editorHostTypeId}
        onHostTypeChange={(value) => {
          setEditorHostTypeId(value);
          setEditorPlatformId("");
        }}
        platforms={filteredEditorPlatforms}
        platformId={editorPlatformId}
        onPlatformChange={setEditorPlatformId}
        vendors={vendors}
        vendorId={editorVendorId}
        onVendorChange={setEditorVendorId}
        urlTemplate={urlTemplate}
        onUrlTemplateChange={setUrlTemplate}
        commentTemplate={commentTemplate}
        onCommentTemplateChange={setCommentTemplate}
        tags={linkTags}
        onTagsChange={setLinkTags}
        tagInput={tagInput}
        onTagInputChange={setTagInput}
        tagSuggestions={tagSuggestions}
        deviceBindingMode={deviceBindingMode}
        onDeviceBindingModeChange={setDeviceBindingMode}
        updatedBy={editingLink?.updatedBy}
        updatedAt={editingLink?.updatedAt}
        error={saveError}
        onSave={saveLink}
      />
      <Modal
        opened={openCommandCreate}
        onClose={() => setOpenCommandCreate(false)}
        title="コマンド新規作成"
        size="xl"
      >
        <CommandEditor
          initialContext={{
            hostTypeId,
            platformId,
            scopeMode: "platform",
            tags: []
          }}
          lockHostType
          lockPlatform
          onCreated={() => {
            setOpenCommandCreate(false);
            fetchCommands();
          }}
        />
      </Modal>
    </Modal>
  );
};
