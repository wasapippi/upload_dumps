"use client";

import { useEffect, useMemo, useState } from "react";
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
  Textarea
} from "@mantine/core";
import { Command, HostType, Platform, Tag } from "./types";
import {
  applyBracketTemplate,
  extractBracketVariables,
  isSafeValue
} from "@/lib/commandTemplate";

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
  onUpdated,
  onDeleted,
  onClose
}: {
  command: Command | null;
  opened: boolean;
  onUpdated?: () => void;
  onDeleted?: () => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commandText, setCommandText] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [hostTypeId, setHostTypeId] = useState<string>("");
  const [platformId, setPlatformId] = useState<string>("");
  const [danger, setDanger] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [updatedBy, setUpdatedBy] = useState("");
  const [baseUpdatedAt, setBaseUpdatedAt] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [copyError, setCopyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const loadMasters = async () => {
    const [hostTypeRes, platformRes] = await Promise.all([
      fetch("/api/host-types"),
      fetch("/api/platforms")
    ]);
    if (hostTypeRes.ok) setHostTypes(await hostTypeRes.json());
    if (platformRes.ok) setPlatforms(await platformRes.json());
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

  const preview = useMemo(() => applyBracketTemplate(commandText, values), [commandText, values]);

  const validation = useMemo(() => {
    for (const variable of variables) {
      const value = (values[variable] ?? "").trim();
      if (!value) {
        return { valid: false, message: `変数 [${variable}] を入力してください` };
      }
      if (!isSafeValue(value)) {
        return { valid: false, message: "改行/制御文字は使えません" };
      }
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

    const response = await fetch(`/api/commands/${command.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        commandText,
        hostTypeId: Number(hostTypeId),
        platformId: platformId ? Number(platformId) : null,
        danger,
        tags,
        updatedAt: baseUpdatedAt
      })
    });

    if (!response.ok) {
      if (response.status === 409) {
        setSaveError("他で更新されました。再読み込みしてください。");
      } else {
        setSaveError("保存に失敗しました。");
      }
      return;
    }

    onUpdated?.();
    const saved = await response.json();
    if (saved?.updatedBy) {
      setUpdatedBy(saved.updatedBy);
    }
    if (saved?.updatedAt) {
      setBaseUpdatedAt(saved.updatedAt);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!command) return;
    const ok = window.confirm(`「${command.title}」を削除しますか？`);
    if (!ok) return;

    const response = await fetch(`/api/commands/${command.id}`, {
      method: "DELETE"
    });
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
            <Text size="sm" c="dimmed">最終編集者: {updatedBy || "Unknown"}</Text>
            <Text size="sm" c="dimmed">
              更新日時: {baseUpdatedAt ? new Date(baseUpdatedAt).toLocaleString() : "-"}
            </Text>
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

          <Text size="sm" fw={600}>ホスト種別 (単一)</Text>
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

          <Text size="sm" fw={600}>機種名 (単一 / 任意)</Text>
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

          <Text size="sm" fw={600}>タグ (複数)</Text>
          <TagsInput
            placeholder="タグ入力"
            value={tags}
            data={tagSuggestions.map((tag) => tag.name)}
            searchable
            searchValue={tagInput}
            onSearchChange={setTagInput}
            onChange={(values) => setTags(normalizeTagValues(values))}
          />

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
            <Button color="red" variant="light" onClick={handleDelete}>削除</Button>
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
