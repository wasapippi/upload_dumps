"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Textarea
} from "@mantine/core";
import { Command, HostType, Platform, Tag } from "./types";
import { sortByBadgeOrder, sortByName } from "@/lib/badgeOrder";
import { isCommonPlaceholderName } from "@/lib/commonPlaceholder";
import { buildActorHeader } from "@/lib/actorClient";
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

export const CommandEditor = ({
  initialCommand,
  initialContext,
  lockHostType = false,
  lockPlatform = false,
  onCreated
}: {
  initialCommand?: Command | null;
  initialContext?: {
    categoryId?: string;
    hostTypeId?: string;
    platformId?: string;
    vendorId?: string;
    scopeMode?: "common" | "platform" | "vendor";
    tags?: string[];
  };
  lockHostType?: boolean;
  lockPlatform?: boolean;
  onCreated?: () => void;
}) => {
  const sessionState = useSession();
  const actorHeader = useMemo(() => buildActorHeader(sessionState?.data?.user?.name), [sessionState?.data?.user?.name]);
  const [title, setTitle] = useState(initialCommand?.title ?? "");
  const [description, setDescription] = useState(initialCommand?.description ?? "");
  const [commandText, setCommandText] = useState(initialCommand?.commandText ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    initialCommand?.hostType?.category?.id
      ? String(initialCommand.hostType.category.id)
      : (initialContext?.categoryId ?? "")
  );
  const [hostTypeId, setHostTypeId] = useState<string>(
    initialCommand?.hostTypeId ? String(initialCommand.hostTypeId) : (initialContext?.hostTypeId ?? "")
  );
  const [platformId, setPlatformId] = useState<string>(
    initialCommand?.platformId ? String(initialCommand.platformId) : (initialContext?.platformId ?? "")
  );
  const [vendorId, setVendorId] = useState<string>(initialCommand?.vendorId ? String(initialCommand.vendorId) : "");
  const [scopeMode, setScopeMode] = useState<"common" | "platform" | "vendor">(
    initialCommand?.vendorId && !initialCommand?.platformId
      ? "vendor"
      : initialCommand?.platformId
        ? "platform"
        : initialContext?.scopeMode
          ? initialContext.scopeMode
          : initialContext?.platformId
          ? "platform"
          : "common"
  );
  const visibility = "PUBLIC" as const;
  const [deviceBindingMode, setDeviceBindingMode] = useState<"INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE">(
    initialCommand?.deviceBindingMode === "EXCLUDE_FROM_DEVICE"
      ? "EXCLUDE_FROM_DEVICE"
      : "INCLUDE_IN_DEVICE"
  );
  const [danger, setDanger] = useState(initialCommand?.danger ?? false);

  const [tagsLayer1, setTagsLayer1] = useState<string[]>(
    initialCommand?.tags.map((tagLink) => tagLink.tag.name) ?? (initialContext?.tags ?? [])
  );
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);

  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState<string | null>(
    initialCommand?.updatedAt ?? null
  );
  const initialCategoryId = initialContext?.categoryId ?? "";
  const initialHostTypeId = initialContext?.hostTypeId ?? "";
  const initialPlatformId = initialContext?.platformId ?? "";
  const initialVendorId = initialContext?.vendorId ?? "";
  const initialScopeMode = initialContext?.scopeMode;
  const initialTagsKey = (initialContext?.tags ?? []).join("\u0001");
  const initialTags = useMemo(() => initialContext?.tags ?? [], [initialContext?.tags, initialTagsKey]);

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
    loadMasters();
  }, []);

  useEffect(() => {
    if (!initialCommand) return;
    setTitle(initialCommand.title ?? "");
    setDescription(initialCommand.description ?? "");
    setCommandText(initialCommand.commandText ?? "");
    setCategoryId(initialCommand.hostType?.category?.id ? String(initialCommand.hostType.category.id) : "");
    setHostTypeId(String(initialCommand.hostTypeId ?? ""));
    setPlatformId(initialCommand.platformId ? String(initialCommand.platformId) : "");
    setVendorId(initialCommand.vendorId ? String(initialCommand.vendorId) : "");
    setScopeMode(
      initialCommand.vendorId && !initialCommand.platformId
        ? "vendor"
        : initialCommand.platformId
          ? "platform"
          : "common"
    );
    setDeviceBindingMode(
      initialCommand.deviceBindingMode === "EXCLUDE_FROM_DEVICE"
        ? "EXCLUDE_FROM_DEVICE"
        : "INCLUDE_IN_DEVICE"
    );
    setDanger(Boolean(initialCommand.danger));
    setTagsLayer1(initialCommand.tags.map((tagLink) => tagLink.tag.name));
    setCurrentUpdatedAt(initialCommand.updatedAt ?? null);
  }, [initialCommand]);

  useEffect(() => {
    if (initialCommand) return;
    setCategoryId(initialCategoryId);
    setHostTypeId(initialHostTypeId);
    setPlatformId(initialPlatformId);
    setVendorId(initialVendorId);
    setScopeMode(
      initialScopeMode
        ? initialScopeMode
        : initialPlatformId
          ? "platform"
          : "platform"
    );
    setDeviceBindingMode("INCLUDE_IN_DEVICE");
    setTagsLayer1(initialTags);
  }, [initialCategoryId, initialCommand, initialHostTypeId, initialPlatformId, initialScopeMode, initialTags, initialVendorId]);

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

  const filteredPlatformsWithoutForced = useMemo(() => {
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

  const filteredPlatforms = useMemo(() => {
    if (!platformId) return filteredPlatformsWithoutForced;
    if (filteredPlatformsWithoutForced.some((item) => String(item.id) === platformId)) {
      return filteredPlatformsWithoutForced;
    }
    const selected = platforms.find((item) => String(item.id) === platformId);
    return selected ? [selected, ...filteredPlatformsWithoutForced] : filteredPlatformsWithoutForced;
  }, [filteredPlatformsWithoutForced, platformId, platforms]);

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
  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (item) => !isCommonPlaceholderName(item.name) || String(item.id) === categoryId
      ),
    [categories, categoryId]
  );
  const visibleHostTypes = useMemo(
    () =>
      filteredHostTypes.filter(
        (item) => !isCommonPlaceholderName(item.name) || String(item.id) === hostTypeId
      ),
    [filteredHostTypes, hostTypeId]
  );

  useEffect(() => {
    if (!hostTypeId || lockHostType || hostTypes.length === 0) return;
    if (!filteredHostTypes.some((hostType) => String(hostType.id) === hostTypeId)) {
      setHostTypeId("");
    }
  }, [filteredHostTypes, hostTypeId, hostTypes.length, lockHostType]);

  useEffect(() => {
    if (!platformId || lockPlatform || platforms.length === 0) return;
    if (!filteredPlatformsWithoutForced.some((platform) => String(platform.id) === platformId)) {
      setPlatformId("");
    }
  }, [filteredPlatformsWithoutForced, lockPlatform, platformId, platforms.length]);

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

  const hostTypeMap = useMemo(() => new Map(hostTypes.map((x) => [String(x.id), x])), [hostTypes]);
  const platformMap = useMemo(() => new Map(platforms.map((x) => [String(x.id), x])), [platforms]);
  const vendorMap = useMemo(
    () =>
      new Map(
        platforms
          .map((platform) => platform.vendor)
          .filter((vendor): vendor is NonNullable<Platform["vendor"]> => Boolean(vendor))
          .map((vendor) => [String(vendor.id), vendor])
      ),
    [platforms]
  );

  const handleSave = async ({ keepContext }: { keepContext: boolean }) => {
    setSaving(true);
    setError(null);

    const resolvedHostTypeId =
      scopeMode === "platform"
        ? (hostTypeId
          ? Number(hostTypeId)
          : (initialCommand?.hostTypeId ?? commonHostTypeId))
        : commonHostTypeId;
    if (!title.trim() || !commandText.trim()) {
      setError("必須項目を入力してください。");
      setSaving(false);
      return;
    }
    if (scopeMode === "common" && !commonHostTypeId) {
      setError("共通ホスト種別が見つかりません。taxonomyで「共通」を作成してください。");
      setSaving(false);
      return;
    }
    if (scopeMode === "vendor" && !vendorId) {
      setError("ベンダを選択してください。");
      setSaving(false);
      return;
    }
    if (!resolvedHostTypeId) {
      setError("共通ホスト種別が見つかりません。taxonomyで「共通」を作成してください。");
      setSaving(false);
      return;
    }

    const payload = {
      title,
      description,
      commandText,
      hostTypeId: resolvedHostTypeId ? Number(resolvedHostTypeId) : null,
      platformId: scopeMode === "platform" && platformId ? Number(platformId) : null,
      vendorId: scopeMode === "vendor" && vendorId ? Number(vendorId) : null,
      visibility,
      deviceBindingMode,
      danger,
      tags: tagsLayer1
    };

    const response = await fetch(initialCommand ? `/api/platforms/commands/${initialCommand.id}` : "/api/platforms/commands", {
      method: initialCommand ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", ...actorHeader },
      body: JSON.stringify({ ...payload, updatedAt: currentUpdatedAt })
    });

    if (!response.ok) {
      try {
        const body = await response.json();
        if (response.status === 409) {
          setError("他で更新されました。再読み込みしてください。");
        } else {
          setError(String(body?.error ?? "保存に失敗しました。"));
        }
      } catch {
        setError(response.status === 409 ? "他で更新されました。再読み込みしてください。" : "保存に失敗しました。");
      }
      setSaving(false);
      return;
    }

    const saved = await response.json();

    if (initialCommand) {
      setCurrentUpdatedAt(saved.updatedAt ?? currentUpdatedAt);
    } else if (keepContext) {
      setTitle("");
      setDescription("");
      setCommandText("");
      setDanger(false);
      onCreated?.();
    } else if (onCreated) {
      onCreated();
    } else {
      window.location.href = `/commands/${saved.id}/edit`;
    }

    setSaving(false);
  };

  return (
    <Stack gap="lg">
      <TextInput label="タイトル" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
      <TextInput label="説明" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
      <Textarea
        label="コマンド本文"
        description="変数は [ifName] のように [] で指定"
        value={commandText}
        onChange={(e) => setCommandText(e.currentTarget.value)}
        minRows={4}
        required
      />

      <Stack gap={6}>
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
      </Stack>

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
            <Text size="xs" c="dimmed">
              ホスト種別未選択でも保存できます（自動で Vendor-Shared を使用）。
            </Text>
          ) : null}
        </Stack>
      ) : null}

      {scopeMode !== "vendor" ? (
        <>
          <Stack gap={6}>
        <Text size="sm" fw={600}>分類</Text>
        <Group gap="xs" wrap="wrap">
          {visibleCategories.map((item) => (
            <Badge
              key={item.id}
              style={badgeStyle}
              variant={categoryId === String(item.id) ? "filled" : "light"}
              color={categoryId === String(item.id) ? "blue" : "gray"}
              onClick={() => {
                if (lockHostType) return;
                setCategoryId(String(item.id));
              }}
            >
              {item.name}
            </Badge>
          ))}
        </Group>
      </Stack>

      <Stack gap={6}>
        <Text size="sm" fw={600}>ホスト種別</Text>
        <Group gap="xs" wrap="wrap">
          {visibleHostTypes.map((item) => (
            <Badge
              key={item.id}
              style={badgeStyle}
              variant={hostTypeId === String(item.id) ? "filled" : "light"}
              color={hostTypeId === String(item.id) ? "blue" : "gray"}
              onClick={() => {
                if (lockHostType) return;
                setHostTypeId(String(item.id));
                setCategoryId(String(item.categoryId));
              }}
            >
              {item.name}
            </Badge>
          ))}
        </Group>
      </Stack>

      <Stack gap={6}>
        <Text size="sm" fw={600}>機種名</Text>
        <Group
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
                  style={badgeStyle}
                  variant={platformId === String(item.id) ? "filled" : "light"}
                  color={platformId === String(item.id) ? "blue" : "gray"}
                  onClick={() => {
                    if (lockPlatform) return;
                    setPlatformId(String(item.id));
                    if (item.vendor) setVendorId(String(item.vendor.id));
                  }}
                >
                  {item.name}
                </Badge>
              ))
            : null}
        </Group>
      </Stack>
        </>
      ) : null}

      <Stack gap={6}>
        <Text size="sm" fw={600}>タグ (複数)</Text>
        <TagsInput
          placeholder="タグ入力"
          value={tagsLayer1}
          data={tagSuggestions.map((tag) => tag.name)}
          searchValue={tagInput}
          onSearchChange={setTagInput}
          onChange={(values) => setTagsLayer1(normalizeTagValues(values))}
        />
      </Stack>

      <Stack gap={6}>
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
      </Stack>

      <Checkbox label="危険コマンド" checked={danger} onChange={(e) => setDanger(e.currentTarget.checked)} />

      {error ? <Text size="sm" c="red">{error}</Text> : null}

      <Divider />
      <Group justify="flex-end">
        {!initialCommand ? (
          <Button variant="light" onClick={() => handleSave({ keepContext: true })} loading={saving}>
            保存して次を入力
          </Button>
        ) : null}
        <Button onClick={() => handleSave({ keepContext: false })} loading={saving}>
          保存
        </Button>
      </Group>

      {!initialCommand ? (
        <Text size="xs" c="dimmed">
          連続投入時は 分類/ホスト種別/機種名/タグ を維持したまま、タイトル・説明・本文のみクリアされます。
        </Text>
      ) : null}

      {categoryId ? (
        <Text size="xs" c="dimmed">
          選択中 分類: {categories.find((x) => String(x.id) === categoryId)?.name ?? ""}
        </Text>
      ) : null}
      {hostTypeId && hostTypeMap.has(hostTypeId) ? (
        <Text size="xs" c="dimmed">選択中 ホスト種別: {hostTypeMap.get(hostTypeId)?.name}</Text>
      ) : null}
      {scopeMode === "platform" && platformId && platformMap.has(platformId) ? (
        <Text size="xs" c="dimmed">選択中 機種名: {platformMap.get(platformId)?.name}</Text>
      ) : null}
      {scopeMode === "vendor" && vendorId && vendorMap.has(vendorId) ? (
        <Text size="xs" c="dimmed">選択中 ベンダ: {vendorMap.get(vendorId)?.name}</Text>
      ) : null}
    </Stack>
  );
};
