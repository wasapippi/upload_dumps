"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Textarea,
  Tooltip
} from "@mantine/core";
import { Command, HostType, Platform, Tag } from "./types";
import { sortByBadgeOrder, sortByName } from "@/lib/badgeOrder";
import { isCommonPlaceholderName } from "@/lib/commonPlaceholder";
import { buildActorHeader } from "@/lib/actorClient";
import {
  applyBracketTemplate,
  extractBracketVariables,
  isSafeValue
} from "@/lib/commandTemplate";

type Vendor = { id: number; name: string };

const badgeStyle = { cursor: "pointer" } as const;
const normalizeTagValues = (values: string[]) =>
  Array.from(
    new Map(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => [value.toLowerCase(), value])
    ).values()
  );

export const CommandDetailModal = ({
  command,
  opened,
  disableDelete = false,
  disableDeleteTooltip = "削除できません",
  onUpdated,
  onDeleted,
  onClose
}: {
  command: Command | null;
  opened: boolean;
  disableDelete?: boolean;
  disableDeleteTooltip?: string;
  onUpdated?: () => void;
  onDeleted?: () => void;
  onClose: () => void;
}) => {
  const sessionState = useSession();
  const actorHeader = useMemo(() => buildActorHeader(sessionState?.data?.user?.name), [sessionState?.data?.user?.name]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commandText, setCommandText] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [hostTypeId, setHostTypeId] = useState<string>("");
  const [platformId, setPlatformId] = useState<string>("");
  const [vendorId, setVendorId] = useState<string>("");
  const [scopeMode, setScopeMode] = useState<"common" | "platform" | "vendor">("common");
  const visibility = "PUBLIC" as const;
  const [deviceBindingMode, setDeviceBindingMode] = useState<"INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE">(
    "INCLUDE_IN_DEVICE"
  );
  const [danger, setDanger] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [updatedBy, setUpdatedBy] = useState("");
  const [baseUpdatedAt, setBaseUpdatedAt] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [copyError, setCopyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hostTypeListRef = useRef<HTMLDivElement | null>(null);
  const platformListRef = useRef<HTMLDivElement | null>(null);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const loadMasters = async () => {
    const [hostTypeRes, platformRes, vendorRes] = await Promise.all([
      fetch("/api/platforms/host-types"),
      fetch("/api/platforms/platforms"),
      fetch("/api/platforms/vendors")
    ]);
    if (hostTypeRes.ok) setHostTypes(await hostTypeRes.json());
    if (platformRes.ok) setPlatforms(await platformRes.json());
    if (vendorRes.ok) setVendors(await vendorRes.json());
  };

  useEffect(() => {
    if (!opened) return;
    loadMasters();
  }, [opened]);

  useEffect(() => {
    if (!command) return;
    setTitle(command.title ?? "");
    setDescription(command.description ?? "");
    setCommandText(command.commandText ?? "");
    setCategoryId(command.hostType?.category?.id ? String(command.hostType.category.id) : "");
    setHostTypeId(command.hostTypeId ? String(command.hostTypeId) : "");
    setPlatformId(command.platformId ? String(command.platformId) : "");
    setVendorId(command.vendorId ? String(command.vendorId) : "");
    setScopeMode(command.vendorId && !command.platformId ? "vendor" : command.platformId ? "platform" : "common");
    setDeviceBindingMode(
      command.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "EXCLUDE_FROM_DEVICE" : "INCLUDE_IN_DEVICE"
    );
    setDanger(Boolean(command.danger));
    setTags(command.tags.map((tagLink) => tagLink.tag.name));
    setUpdatedBy(command.updatedBy ?? "");
    setBaseUpdatedAt(command.updatedAt);
    setCopyError(null);
    setSaveError(null);
  }, [command]);

  const variables = useMemo(() => extractBracketVariables(commandText), [commandText]);

  useEffect(() => {
    setValues((prev) => {
      const nextValues: Record<string, string> = {};
      for (const variable of variables) {
        nextValues[variable] = prev[variable] ?? "";
      }
      return nextValues;
    });
  }, [variables]);

  const categories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; groupOrderIndex?: number }>();
    for (const hostType of hostTypes) {
      if (!hostType.category) continue;
      map.set(hostType.category.id, {
        id: hostType.category.id,
        name: hostType.category.name,
        groupOrderIndex: hostType.category.groupOrderIndex
      });
    }
    return sortByBadgeOrder(Array.from(map.values()));
  }, [hostTypes]);

  const filteredHostTypes = useMemo(() => {
    if (!categoryId) return hostTypes;
    const id = Number(categoryId);
    return sortByBadgeOrder(hostTypes.filter((hostType) => hostType.categoryId === id));
  }, [categoryId, hostTypes]);

  const filteredPlatforms = useMemo(() => {
    if (!hostTypeId && !categoryId) return sortByName(platforms);
    if (hostTypeId) {
      const selectedHostTypeId = Number(hostTypeId);
      const selectedHostType = hostTypes.find((hostType) => hostType.id === selectedHostTypeId);
      // 共通ホスト種別は機種を絞り込まない（既存の機種指定を保持する）
      if (selectedHostType && isCommonPlaceholderName(selectedHostType.name)) {
        return sortByName(platforms);
      }
      return sortByName(platforms.filter((platform) =>
        (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === selectedHostTypeId)
      ));
    }
    const selectedCategoryId = Number(categoryId);
    const selectableHostTypeIds = new Set(
      hostTypes.filter((hostType) => hostType.categoryId === selectedCategoryId).map((hostType) => hostType.id)
    );
    if (selectableHostTypeIds.size === 0) return sortByName(platforms);
    return sortByName(platforms.filter((platform) =>
      (platform.hostTypeLinks ?? []).some((link) => selectableHostTypeIds.has(link.hostTypeId))
    ));
  }, [categoryId, hostTypeId, hostTypes, platforms]);

  const availableVendors = useMemo(() => {
    if (vendors.length > 0) {
      return [...vendors].sort((a, b) => a.name.localeCompare(b.name));
    }
    const map = new Map<number, { id: number; name: string }>();
    for (const platform of platforms) {
      if (!platform.vendor) continue;
      map.set(platform.vendor.id, platform.vendor);
    }
    return sortByName(Array.from(map.values()));
  }, [platforms, vendors]);
  const commonHostTypeId = useMemo(
    () => hostTypes.find((item) => isCommonPlaceholderName(item.name))?.id ?? null,
    [hostTypes]
  );
  const visibleCategories = useMemo(() => {
    const filtered = categories.filter((item) => !isCommonPlaceholderName(item.name));
    if (!categoryId) return filtered;
    if (filtered.some((item) => String(item.id) === categoryId)) return filtered;
    const selected = categories.find((item) => String(item.id) === categoryId);
    return selected ? [selected, ...filtered] : filtered;
  }, [categories, categoryId]);
  const visibleHostTypes = useMemo(() => {
    const filtered = filteredHostTypes.filter((item) => !isCommonPlaceholderName(item.name));
    if (!hostTypeId) return filtered;
    if (filtered.some((item) => String(item.id) === hostTypeId)) return filtered;
    const selected = filteredHostTypes.find((item) => String(item.id) === hostTypeId);
    return selected ? [selected, ...filtered] : filtered;
  }, [filteredHostTypes, hostTypeId]);

  useEffect(() => {
    if (!hostTypeId || hostTypes.length === 0) return;
    if (!filteredHostTypes.some((hostType) => String(hostType.id) === hostTypeId)) {
      setHostTypeId("");
    }
  }, [filteredHostTypes, hostTypeId, hostTypes.length]);

  useEffect(() => {
    if (!platformId || platforms.length === 0) return;
    if (!filteredPlatforms.some((platform) => String(platform.id) === platformId)) {
      setPlatformId("");
    }
  }, [filteredPlatforms, platformId, platforms.length]);

  useEffect(() => {
    if (scopeMode === "platform") {
      if (!platformId && filteredPlatforms[0]) {
        setPlatformId(String(filteredPlatforms[0].id));
      }
      if (platformId) {
        const selected = platforms.find((item) => String(item.id) === platformId);
        if (selected?.vendor) setVendorId(String(selected.vendor.id));
      }
      return;
    }
    if (scopeMode === "vendor") {
      setPlatformId("");
      if (!vendorId && availableVendors[0]) {
        setVendorId(String(availableVendors[0].id));
      }
      return;
    }
    setPlatformId("");
    setVendorId("");
  }, [availableVendors, filteredPlatforms, platformId, platforms, scopeMode, vendorId]);

  useEffect(() => {
    if (!hostTypeId) return;
    const selected = hostTypeListRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null;
    selected?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [hostTypeId, visibleHostTypes]);

  useEffect(() => {
    if (scopeMode !== "platform" || !platformId) return;
    const selected = platformListRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null;
    selected?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [filteredPlatforms, platformId, scopeMode]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      params.set("scope", "command");
      if (tagInput.trim()) params.set("q", tagInput.trim());
      const response = await fetch(`/api/platforms/tags/suggest?${params.toString()}`);
      if (!response.ok || !active) return;
      setTagSuggestions(await response.json());
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tagInput]);

  const preview = useMemo(() => applyBracketTemplate(commandText, values), [commandText, values]);

  const validation = useMemo(() => {
    for (const variable of variables) {
      const value = (values[variable] ?? "").trim();
      if (!value) return { valid: false, message: `変数 [${variable}] を入力してください` };
      if (!isSafeValue(value)) return { valid: false, message: "改行/制御文字は使えません" };
    }
    return { valid: true, message: "" };
  }, [variables, values]);

  const handleCopy = async () => {
    if (!command) return;
    setCopyError(null);

    if (danger) {
      const confirmed = window.confirm("danger コマンドです。コピーして実行してよいですか？");
      if (!confirmed) return;
    }

    if (!validation.valid) {
      setCopyError(validation.message || "入力を確認してください");
      return;
    }

    await navigator.clipboard.writeText(preview);
  };

  const handleSave = async () => {
    if (!command) return;
    setSaveError(null);
    const resolvedHostTypeId =
      scopeMode === "platform"
        ? (hostTypeId
          ? Number(hostTypeId)
          : (command.hostTypeId ?? commonHostTypeId))
        : commonHostTypeId;
    if (scopeMode === "vendor" && !vendorId) {
      setSaveError("ベンダを選択してください。");
      return;
    }

    const response = await fetch(`/api/platforms/commands/${command.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...actorHeader },
      body: JSON.stringify({
        title,
        description,
        commandText,
        hostTypeId: resolvedHostTypeId ?? null,
        platformId: scopeMode === "platform" && platformId ? Number(platformId) : null,
        vendorId: scopeMode === "vendor" && vendorId ? Number(vendorId) : null,
        visibility,
        deviceBindingMode,
        danger,
        tags,
        updatedAt: baseUpdatedAt
      })
    });

    if (!response.ok) {
      try {
        const body = await response.json();
        if (response.status === 409) {
          setSaveError("他で更新されました。再読み込みしてください。");
        } else {
          setSaveError(String(body?.error ?? "保存に失敗しました。"));
        }
      } catch {
        setSaveError(response.status === 409 ? "他で更新されました。再読み込みしてください。" : "保存に失敗しました。");
      }
      return;
    }

    onUpdated?.();
    const saved = await response.json();
    if (saved?.updatedBy) setUpdatedBy(saved.updatedBy);
    if (saved?.updatedAt) setBaseUpdatedAt(saved.updatedAt);
    onClose();
  };

  const handleDelete = async () => {
    if (!command) return;
    const ok = window.confirm(`「${command.title}」を削除しますか？`);
    if (!ok) return;

    let response = await fetch(`/api/platforms/commands/${command.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...actorHeader },
      body: JSON.stringify({ delete: true })
    });
    if (response.status === 404) {
      response = await fetch(`/api/commands/${command.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...actorHeader },
        body: JSON.stringify({ delete: true })
      });
    }
    if (!response.ok) {
      setSaveError("削除に失敗しました。");
      return;
    }

    onUpdated?.();
    onDeleted?.();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} size="xl" title="コマンド詳細">
      {command ? (
        <Stack gap="md">
          <Group gap="md">
            <Text size="sm" c="dimmed">最終更新者: {updatedBy || "Unknown"}</Text>
            <Text size="sm" c="dimmed">更新日時: {baseUpdatedAt ? new Date(baseUpdatedAt).toLocaleString() : "-"}</Text>
          </Group>

          <TextInput label="タイトル" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
          <TextInput label="説明" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
          <Textarea
            label="コマンド本文"
            description="[] で囲まれた文字列を変数として扱います"
            value={commandText}
            onChange={(e) => setCommandText(e.currentTarget.value)}
            minRows={4}
          />

          <Text size="sm" fw={600}>適用範囲</Text>
          <Group gap="xs">
            <Badge
              style={badgeStyle}
              variant={scopeMode === "platform" ? "filled" : "light"}
              color={scopeMode === "platform" ? "blue" : "gray"}
              onClick={() => setScopeMode("platform")}
            >
              機種固有
            </Badge>
            <Badge
              style={badgeStyle}
              variant={scopeMode === "vendor" ? "filled" : "light"}
              color={scopeMode === "vendor" ? "cyan" : "gray"}
              onClick={() => setScopeMode("vendor")}
            >
              ベンダ共通
            </Badge>
          </Group>

          {scopeMode === "vendor" ? (
            <Stack gap={6}>
              <Text size="sm" fw={600}>ベンダ</Text>
              <Group gap="xs" wrap="wrap">
                {availableVendors.map((item) => (
                  <Badge
                    key={item.id}
                    style={badgeStyle}
                    variant={vendorId === String(item.id) ? "filled" : "light"}
                    color={vendorId === String(item.id) ? "cyan" : "gray"}
                    onClick={() => setVendorId(String(item.id))}
                  >
                    {item.name}
                  </Badge>
                ))}
              </Group>
              {!hostTypeId ? (
                <Text size="xs" c="dimmed">ホスト種別未選択でも保存できます（自動で Vendor-Shared を使用）。</Text>
              ) : null}
            </Stack>
          ) : (
            <>
              <Text size="sm" fw={600}>分類</Text>
              <Group gap="xs" wrap="wrap">
                {visibleCategories.map((item) => (
                  <Badge
                    key={item.id}
                    style={badgeStyle}
                    variant={categoryId === String(item.id) ? "filled" : "light"}
                    color={categoryId === String(item.id) ? "blue" : "gray"}
                    onClick={() => setCategoryId(String(item.id))}
                  >
                    {item.name}
                  </Badge>
                ))}
              </Group>

              <Text size="sm" fw={600}>ホスト種別</Text>
              <Group
                ref={hostTypeListRef}
                gap="xs"
                wrap="wrap"
                style={{
                  maxHeight: 112,
                  overflowY: "auto",
                  alignContent: "flex-start",
                  border: "1px solid var(--mantine-color-default-border)",
                  borderRadius: 8,
                  padding: 8
                }}
              >
                {visibleHostTypes.map((item) => (
                  <Badge
                    key={item.id}
                    data-selected={hostTypeId === String(item.id) ? "true" : "false"}
                    style={badgeStyle}
                    variant={hostTypeId === String(item.id) ? "filled" : "light"}
                    color={hostTypeId === String(item.id) ? "blue" : "gray"}
                    onClick={() => {
                      setHostTypeId(String(item.id));
                      setCategoryId(String(item.categoryId));
                    }}
                  >
                    {item.name}
                  </Badge>
                ))}
              </Group>

              <Text size="sm" fw={600}>機種名</Text>
              <Group
                ref={platformListRef}
                gap="xs"
                wrap="wrap"
                style={{
                  maxHeight: 112,
                  overflowY: "auto",
                  alignContent: "flex-start",
                  border: "1px solid var(--mantine-color-default-border)",
                  borderRadius: 8,
                  padding: 8
                }}
              >
                {scopeMode === "platform"
                  ? filteredPlatforms.map((item) => (
                      <Badge
                        key={item.id}
                        data-selected={platformId === String(item.id) ? "true" : "false"}
                        style={badgeStyle}
                        variant={platformId === String(item.id) ? "filled" : "light"}
                        color={platformId === String(item.id) ? "blue" : "gray"}
                        onClick={() => {
                          setPlatformId(String(item.id));
                          if (item.vendor) setVendorId(String(item.vendor.id));
                        }}
                      >
                        {item.name}
                      </Badge>
                    ))
                  : null}
              </Group>
            </>
          )}

          <Text size="sm" fw={600}>タグ (複数)</Text>
          <TagsInput
            placeholder="タグ入力"
            value={tags}
            data={tagSuggestions.map((tag) => tag.name)}
            searchValue={tagInput}
            onSearchChange={setTagInput}
            onChange={(values) => setTags(normalizeTagValues(values))}
          />

          <Text size="sm" fw={600}>装置情報連携</Text>
          <Group gap="xs">
            <Badge
              style={badgeStyle}
              variant={deviceBindingMode === "INCLUDE_IN_DEVICE" ? "filled" : "light"}
              color={deviceBindingMode === "INCLUDE_IN_DEVICE" ? "teal" : "gray"}
              onClick={() => setDeviceBindingMode("INCLUDE_IN_DEVICE")}
            >
              連携する
            </Badge>
            <Badge
              style={badgeStyle}
              variant={deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "filled" : "light"}
              color={deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "teal" : "gray"}
              onClick={() => setDeviceBindingMode("EXCLUDE_FROM_DEVICE")}
            >
              連携しない
            </Badge>
          </Group>

          <Checkbox label="危険コマンド" checked={danger} onChange={(e) => setDanger(e.currentTarget.checked)} />

          {variables.map((variable) => (
            <TextInput
              key={variable}
              label={`[${variable}]`}
              value={values[variable] ?? ""}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setValues((prev) => ({ ...prev, [variable]: value }));
              }}
              required
            />
          ))}

          <Textarea label="最終コマンドプレビュー" value={preview} readOnly minRows={3} />

          {copyError ? <Text size="sm" c="red">{copyError}</Text> : null}
          {saveError ? <Text size="sm" c="red">{saveError}</Text> : null}

          <Group justify="space-between">
            <Tooltip label={disableDelete ? disableDeleteTooltip : ""} withArrow disabled={!disableDelete}>
              <span>
                <Button color="red" variant="light" onClick={handleDelete} disabled={disableDelete}>
                  削除
                </Button>
              </span>
            </Tooltip>
            <Group>
              <Button variant="light" onClick={handleCopy} disabled={!validation.valid}>コピー</Button>
              <Button onClick={handleSave}>保存</Button>
            </Group>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
};
