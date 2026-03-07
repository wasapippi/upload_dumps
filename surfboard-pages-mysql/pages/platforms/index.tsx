"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Group, Paper, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { IconLink, IconSitemap, IconTerminal2 } from "@tabler/icons-react";
import { HostType, Platform } from "@/components/commands/types";

const badgeStyle = { cursor: "pointer" } as const;

export default function PlatformsPage() {
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [hostTypeId, setHostTypeId] = useState<string>("");
  const [q, setQ] = useState("");

  const fetchMasters = useCallback(async () => {
    const [hostTypeRes, platformRes] = await Promise.all([
      fetch("/api/platforms/host-types"),
      fetch("/api/platforms/platforms")
    ]);
    if (hostTypeRes.ok) setHostTypes(await hostTypeRes.json());
    if (platformRes.ok) setPlatforms(await platformRes.json());
  }, []);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

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

  useEffect(() => {
    if (!hostTypeId) return;
    if (!filteredHostTypes.some((hostType) => String(hostType.id) === hostTypeId)) {
      setHostTypeId("");
    }
  }, [filteredHostTypes, hostTypeId]);

  const filteredPlatforms = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    const byTaxonomy = platforms.filter((platform) => {
      if (!hostTypeId && !categoryId) return true;
      if (hostTypeId) {
        const selectedHostTypeId = Number(hostTypeId);
        return (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === selectedHostTypeId);
      }
      const selectableHostTypeIds = new Set(filteredHostTypes.map((item) => item.id));
      if (selectableHostTypeIds.size === 0) return true;
      return (platform.hostTypeLinks ?? []).some((link) => selectableHostTypeIds.has(link.hostTypeId));
    });

    if (!keyword) return byTaxonomy;
    return byTaxonomy.filter((platform) => {
      const base = `${platform.vendor?.name ?? ""} ${platform.name}`.toLowerCase();
      return base.includes(keyword);
    });
  }, [categoryId, filteredHostTypes, hostTypeId, platforms, q]);

  return (
    <Stack p="md" gap="md">
      <Text fw={700} size="xl">機種一覧</Text>

      <Group gap="xs">
        <Button
          component={Link}
          href="/platforms/commands"
          variant="light"
          color="blue"
          size="xs"
          leftSection={<IconTerminal2 size={14} />}
        >
          コマンド一覧
        </Button>
        <Button
          component={Link}
          href="/platforms/links"
          variant="light"
          color="blue"
          size="xs"
          leftSection={<IconLink size={14} />}
        >
          関連リンク一覧
        </Button>
        <Button
          component={Link}
          href="/taxonomy"
          variant="light"
          color="grape"
          size="xs"
          leftSection={<IconSitemap size={14} />}
        >
          分類/機種名管理
        </Button>
      </Group>

      <TextInput
        size="sm"
        w={320}
        placeholder="機種名 / ベンダ名 で検索"
        value={q}
        onChange={(event) => setQ(event.currentTarget.value)}
      />

      <Stack gap="xs">
        <Text size="sm" fw={600}>分類</Text>
        <Group gap="xs" wrap="wrap">
          <Badge
            style={badgeStyle}
            variant={categoryId === "" ? "filled" : "light"}
            color={categoryId === "" ? "blue" : "gray"}
            onClick={() => setCategoryId("")}
          >
            全て
          </Badge>
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

      <Stack gap="xs">
        <Text size="sm" fw={600}>ホスト種別</Text>
        <Group gap="xs" wrap="wrap">
          <Badge
            style={badgeStyle}
            variant={hostTypeId === "" ? "filled" : "light"}
            color={hostTypeId === "" ? "blue" : "gray"}
            onClick={() => setHostTypeId("")}
          >
            全て
          </Badge>
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

      <Group justify="space-between">
        <Text fw={600}>検索結果</Text>
        <Text size="sm" c="dimmed">{filteredPlatforms.length} 件</Text>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
        {filteredPlatforms.map((platform) => (
          <Paper
            key={platform.id}
            withBorder
            p="sm"
            radius="sm"
            component={Link}
            href={`/platforms/${platform.id}`}
          >
            <Stack gap={4}>
              <Text fw={600}>{platform.name}</Text>
              <Text size="sm" c="dimmed">{platform.vendor?.name ?? "Vendor未設定"}</Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
