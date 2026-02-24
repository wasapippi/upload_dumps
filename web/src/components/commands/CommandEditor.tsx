"use client";

import { useEffect, useMemo, useState } from "react";
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
  onCreated
}: {
  initialCommand?: Command | null;
  initialContext?: {
    categoryId?: string;
    hostTypeId?: string;
    platformId?: string;
    tags?: string[];
  };
  onCreated?: () => void;
}) => {
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
  const [danger, setDanger] = useState(initialCommand?.danger ?? false);

  const [tagsLayer1, setTagsLayer1] = useState<string[]>(
    initialCommand?.tags.map((tagLink) => tagLink.tag.name) ?? (initialContext?.tags ?? [])
  );
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);

  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState<string | null>(
    initialCommand?.updatedAt ?? null
  );

  const loadMasters = async () => {
    const [hostTypeRes, platformRes] = await Promise.all([
      fetch("/api/host-types"),
      fetch("/api/platforms")
    ]);
    if (hostTypeRes.ok) setHostTypes(await hostTypeRes.json());
    if (platformRes.ok) setPlatforms(await platformRes.json());
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
    setDanger(Boolean(initialCommand.danger));
    setTagsLayer1(initialCommand.tags.map((tagLink) => tagLink.tag.name));
    setCurrentUpdatedAt(initialCommand.updatedAt ?? null);
  }, [initialCommand]);

  useEffect(() => {
    if (initialCommand) return;
    setCategoryId(initialContext?.categoryId ?? "");
    setHostTypeId(initialContext?.hostTypeId ?? "");
    setPlatformId(initialContext?.platformId ?? "");
    setTagsLayer1(initialContext?.tags ?? []);
  }, [initialCommand, initialContext]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (tagInput.trim()) params.set("q", tagInput.trim());
      if (categoryId) params.set("categoryId", categoryId);
      if (hostTypeId) params.set("hostTypeId", hostTypeId);
      if (platformId) params.set("platformId", platformId);
      const response = await fetch(`/api/commands/tags?${params.toString()}`);
      if (!response.ok || !active) return;
      setTagSuggestions(await response.json());
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [categoryId, hostTypeId, platformId, tagInput]);

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

  const hostTypeMap = useMemo(() => new Map(hostTypes.map((x) => [String(x.id), x])), [hostTypes]);
  const platformMap = useMemo(() => new Map(platforms.map((x) => [String(x.id), x])), [platforms]);

  const handleAddHostType = async () => {
    if (!categoryId) {
      window.alert("先に分類を選択してください。");
      return;
    }
    const name = window.prompt("追加するホスト種別名");
    if (!name) return;
    const response = await fetch("/api/host-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, categoryId: Number(categoryId) })
    });
    if (!response.ok) return;
    const created = (await response.json()) as HostType;
    setHostTypes((prev) => {
      const exists = prev.some((x) => x.id === created.id);
      return exists ? prev : [...prev, created].sort((a, b) => a.groupOrderIndex - b.groupOrderIndex);
    });
    setHostTypeId(String(created.id));
  };

  const handleAddPlatform = async () => {
    const name = window.prompt("追加する機種名");
    if (!name) return;
    const response = await fetch("/api/platforms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (!response.ok) return;
    const created = (await response.json()) as Platform;
    setPlatforms((prev) => {
      const exists = prev.some((x) => x.id === created.id);
      return exists ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
    });
    setPlatformId(String(created.id));
  };

  const handleSave = async ({ keepContext }: { keepContext: boolean }) => {
    setSaving(true);
    setError(null);

    if (!title.trim() || !commandText.trim() || !hostTypeId) {
      setError("必須項目を入力してください。");
      setSaving(false);
      return;
    }

    const payload = {
      title,
      description,
      commandText,
      hostTypeId: Number(hostTypeId),
      platformId: platformId ? Number(platformId) : null,
      danger,
      tags: tagsLayer1
    };

    const response = await fetch(
      initialCommand ? `/api/commands/${initialCommand.id}` : "/api/commands",
      {
        method: initialCommand ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, updatedAt: currentUpdatedAt })
      }
    );

    if (!response.ok) {
      if (response.status === 409) {
        setError("他で更新されました。再読み込みしてください。");
      } else {
        setError("保存に失敗しました。");
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
        <Text size="sm" fw={600}>分類 (単一)</Text>
        <Group gap="xs" wrap="wrap">
          {categories.map((item) => (
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
      </Stack>

      <Stack gap={6}>
        <Group justify="space-between">
          <Text size="sm" fw={600}>ホスト種別 (単一)</Text>
          <Button size="xs" variant="light" onClick={handleAddHostType}>ホスト種別を追加</Button>
        </Group>
        <Group gap="xs" wrap="wrap">
          {filteredHostTypes.map((item) => (
            <Badge
              key={item.id}
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
      </Stack>

      <Stack gap={6}>
        <Group justify="space-between">
          <Text size="sm" fw={600}>機種名 (単一 / 任意)</Text>
          <Button size="xs" variant="light" onClick={handleAddPlatform}>機種名を追加</Button>
        </Group>
        <Group gap="xs" wrap="wrap">
          <Badge
            style={badgeStyle}
            variant={platformId === "" ? "filled" : "light"}
            color={platformId === "" ? "blue" : "gray"}
            onClick={() => setPlatformId("")}
          >
            共通
          </Badge>
          {filteredPlatforms.map((item) => (
            <Badge
              key={item.id}
              style={badgeStyle}
              variant={platformId === String(item.id) ? "filled" : "light"}
              color={platformId === String(item.id) ? "blue" : "gray"}
              onClick={() => setPlatformId(String(item.id))}
            >
              {item.vendor ? `${item.vendor.name}/${item.name}` : item.name}
            </Badge>
          ))}
        </Group>
      </Stack>

      <Stack gap={6}>
        <Text size="sm" fw={600}>タグ (複数)</Text>
        <TagsInput
          placeholder="タグ入力"
          value={tagsLayer1}
          data={tagSuggestions.map((tag) => tag.name)}
          searchable
          searchValue={tagInput}
          onSearchChange={setTagInput}
          onChange={(values) => setTagsLayer1(normalizeTagValues(values))}
        />
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
      {platformId && platformMap.has(platformId) ? (
        <Text size="xs" c="dimmed">選択中 機種名: {platformMap.get(platformId)?.name}</Text>
      ) : null}
    </Stack>
  );
};
