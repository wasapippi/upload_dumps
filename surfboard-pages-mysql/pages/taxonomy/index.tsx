"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Checkbox,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput
} from "@mantine/core";
import { HostType, Platform } from "@/components/commands/types";

type Category = { id: number; name: string; groupOrderIndex: number };
type Vendor = { id: number; name: string };

type EditMode = "category" | "hostType" | "platform" | "vendor";

export default function TaxonomyPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<EditMode>("category");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [groupOrderIndex, setGroupOrderIndex] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<string>("");
  const [vendorId, setVendorId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [mappingHostTypeId, setMappingHostTypeId] = useState<string>("");
  const [mappingPlatformIds, setMappingPlatformIds] = useState<number[]>([]);
  const [mappingSaving, setMappingSaving] = useState(false);

  const load = useCallback(async () => {
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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!mappingHostTypeId && hostTypes[0]) {
      setMappingHostTypeId(String(hostTypes[0].id));
    }
  }, [hostTypes, mappingHostTypeId]);

  useEffect(() => {
    if (!mappingHostTypeId) {
      setMappingPlatformIds([]);
      return;
    }
    const targetHostTypeId = Number(mappingHostTypeId);
    const selected = platforms
      .filter((platform) =>
        (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === targetHostTypeId)
      )
      .map((platform) => platform.id);
    setMappingPlatformIds(selected);
  }, [mappingHostTypeId, platforms]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setGroupOrderIndex(1);
    setCategoryId("");
    setVendorId("");
    setError(null);
  };

  const openCreate = (nextMode: EditMode) => {
    resetForm();
    setMode(nextMode);
    setModalOpen(true);
  };

  const openEditCategory = (item: Category) => {
    resetForm();
    setMode("category");
    setEditingId(item.id);
    setName(item.name);
    setGroupOrderIndex(item.groupOrderIndex);
    setModalOpen(true);
  };

  const openEditHostType = (item: HostType) => {
    resetForm();
    setMode("hostType");
    setEditingId(item.id);
    setName(item.name);
    setGroupOrderIndex(item.groupOrderIndex);
    setCategoryId(String(item.categoryId));
    setModalOpen(true);
  };

  const openEditPlatform = (item: Platform) => {
    resetForm();
    setMode("platform");
    setEditingId(item.id);
    setName(item.name);
    setVendorId(item.vendor?.id ? String(item.vendor.id) : "");
    setModalOpen(true);
  };

  const openEditVendor = (item: Vendor) => {
    resetForm();
    setMode("vendor");
    setEditingId(item.id);
    setName(item.name);
    setModalOpen(true);
  };

  const save = async () => {
    setError(null);
    if (!name.trim()) {
      setError("名称は必須です。");
      return;
    }

    const payload: Record<string, unknown> = { name: name.trim() };
    let url = "";

    if (mode === "category") {
      payload.groupOrderIndex = groupOrderIndex;
      url = editingId ? `/api/platforms/categories/${editingId}` : "/api/platforms/categories";
    } else if (mode === "hostType") {
      if (!categoryId) {
        setError("分類は必須です。");
        return;
      }
      payload.categoryId = Number(categoryId);
      payload.groupOrderIndex = groupOrderIndex;
      url = editingId ? `/api/platforms/host-types/${editingId}` : "/api/platforms/host-types";
    } else if (mode === "platform") {
      if (!vendorId) {
        setError("ベンダは必須です。");
        return;
      }
      payload.vendorId = Number(vendorId);
      url = editingId ? `/api/platforms/platforms/${editingId}` : "/api/platforms/platforms";
    } else {
      url = editingId ? `/api/platforms/vendors/${editingId}` : "/api/platforms/vendors";
    }

    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      try {
        const body = await res.json();
        setError(String(body?.error ?? "保存に失敗しました。"));
      } catch {
        setError("保存に失敗しました。");
      }
      return;
    }

    setModalOpen(false);
    resetForm();
    await load();
  };

  const remove = async () => {
    if (!editingId) return;
    const ok = window.confirm("削除しますか？");
    if (!ok) return;

    let url = "";
    if (mode === "category") url = `/api/platforms/categories/${editingId}`;
    else if (mode === "hostType") url = `/api/platforms/host-types/${editingId}`;
    else if (mode === "platform") url = `/api/platforms/platforms/${editingId}`;
    else url = `/api/platforms/vendors/${editingId}`;

    let res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete: true })
    });
    if (!res.ok && res.status === 409) {
      try {
        const body = await res.json();
        const related = body?.related ?? {};
        const details = Object.entries(related)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
        const confirmCascade = window.confirm(
          `関連データも削除します。\n\n${details}\n\nこのまま削除しますか？`
        );
        if (!confirmCascade) return;
        res = await fetch(`${url}?cascade=1`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delete: true, cascade: true })
        });
      } catch {
        // no-op
      }
    }

    if (!res.ok) {
      try {
        const body = await res.json();
        setError(String(body?.error ?? "削除に失敗しました。"));
      } catch {
        setError("削除に失敗しました。");
      }
      return;
    }

    setModalOpen(false);
    resetForm();
    await load();
  };

  const modalTitle = useMemo(() => {
    if (mode === "category") return editingId ? "分類を編集" : "分類を追加";
    if (mode === "hostType") return editingId ? "ホスト種別を編集" : "ホスト種別を追加";
    if (mode === "platform") return editingId ? "機種名を編集" : "機種名を追加";
    return editingId ? "ベンダを編集" : "ベンダを追加";
  }, [editingId, mode]);

  const toggleMappingPlatform = (platformId: number) => {
    setMappingPlatformIds((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]
    );
  };

  const saveMappings = async () => {
    if (!mappingHostTypeId) return;
    setMappingSaving(true);
    const res = await fetch("/api/platforms/host-type-platforms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostTypeId: Number(mappingHostTypeId),
        platformIds: mappingPlatformIds
      })
    });
    if (!res.ok) {
      setMappingSaving(false);
      setError("紐づけ保存に失敗しました。");
      return;
    }
    await load();
    setMappingSaving(false);
  };

  return (
    <Stack p="md" gap="md">
      <Text fw={700} size="xl">分類/ホスト種別/機種名/ベンダ 管理</Text>

      <Tabs defaultValue="category">
        <Tabs.List>
          <Tabs.Tab value="category">分類</Tabs.Tab>
          <Tabs.Tab value="hostType">ホスト種別</Tabs.Tab>
          <Tabs.Tab value="platform">機種名</Tabs.Tab>
          <Tabs.Tab value="vendor">ベンダ</Tabs.Tab>
          <Tabs.Tab value="mapping">紐づけ</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="category" pt="sm">
          <Group justify="flex-end" mb="xs">
            <Button onClick={() => openCreate("category")}>分類を追加</Button>
          </Group>
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>名称</Table.Th>
                <Table.Th>並び</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {categories.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.id}</Table.Td>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td>{item.groupOrderIndex}</Table.Td>
                  <Table.Td>
                    <Button size="compact-xs" variant="light" onClick={() => openEditCategory(item)}>編集</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="hostType" pt="sm">
          <Group justify="flex-end" mb="xs">
            <Button onClick={() => openCreate("hostType")}>ホスト種別を追加</Button>
          </Group>
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>名称</Table.Th>
                <Table.Th>分類</Table.Th>
                <Table.Th>並び</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hostTypes.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.id}</Table.Td>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td>{item.category?.name}</Table.Td>
                  <Table.Td>{item.groupOrderIndex}</Table.Td>
                  <Table.Td>
                    <Button size="compact-xs" variant="light" onClick={() => openEditHostType(item)}>編集</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="platform" pt="sm">
          <Group justify="flex-end" mb="xs">
            <Button onClick={() => openCreate("platform")}>機種名を追加</Button>
          </Group>
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>名称</Table.Th>
                <Table.Th>ベンダ</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {platforms.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.id}</Table.Td>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td>{item.vendor?.name}</Table.Td>
                  <Table.Td>
                    <Button size="compact-xs" variant="light" onClick={() => openEditPlatform(item)}>編集</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="vendor" pt="sm">
          <Group justify="flex-end" mb="xs">
            <Button onClick={() => openCreate("vendor")}>ベンダを追加</Button>
          </Group>
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>名称</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {vendors.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.id}</Table.Td>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td>
                    <Button size="compact-xs" variant="light" onClick={() => openEditVendor(item)}>編集</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="mapping" pt="sm">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-end">
              <Select
                label="ホスト種別"
                data={hostTypes.map((item) => ({ label: item.name, value: String(item.id) }))}
                value={mappingHostTypeId}
                onChange={(value) => setMappingHostTypeId(value ?? "")}
                searchable
                w={360}
              />
              <Button onClick={saveMappings} loading={mappingSaving}>
                紐づけ保存
              </Button>
            </Group>

            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>選択</Table.Th>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>機種名</Table.Th>
                  <Table.Th>ベンダ</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {platforms.map((item) => {
                  const checked = mappingPlatformIds.includes(item.id);
                  return (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Checkbox checked={checked} onChange={() => toggleMappingPlatform(item.id)} />
                      </Table.Td>
                      <Table.Td>{item.id}</Table.Td>
                      <Table.Td>{item.name}</Table.Td>
                      <Table.Td>{item.vendor?.name}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        <Stack gap="sm">
          <TextInput label="名称" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
          {mode === "category" || mode === "hostType" ? (
            <NumberInput
              label="並び順"
              value={groupOrderIndex}
              onChange={(value) => setGroupOrderIndex(Number(value || 0))}
              min={0}
            />
          ) : null}
          {mode === "hostType" ? (
            <Select
              label="分類"
              data={categories.map((item) => ({ label: item.name, value: String(item.id) }))}
              value={categoryId}
              onChange={(value) => setCategoryId(value ?? "")}
              searchable
              required
            />
          ) : null}
          {mode === "platform" ? (
            <Select
              label="ベンダ"
              data={vendors.map((item) => ({ label: item.name, value: String(item.id) }))}
              value={vendorId}
              onChange={(value) => setVendorId(value ?? "")}
              searchable
              required
            />
          ) : null}
          {error ? <Text size="sm" c="red">{error}</Text> : null}
          <Group justify="space-between">
            <Group>{editingId ? <Button color="red" variant="light" onClick={remove}>削除</Button> : null}</Group>
            <Group>
              <Button variant="light" onClick={() => setModalOpen(false)}>キャンセル</Button>
              <Button onClick={save}>保存</Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
