"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { FixedPlatformPreviewModal } from "./FixedPlatformPreviewModal";
import { HostType, Platform } from "./types";

type Category = { id: number; name: string };

type Props = {
  hostName?: string;
  hostTypeId?: string | number | null;
};

export const HostTypeFixedPreviewAction = ({ hostName, hostTypeId }: Props) => {
  const [opened, setOpened] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState("");

  const normalizedHostTypeId = String(hostTypeId ?? "");

  useEffect(() => {
    const fetchMasters = async () => {
      const [categoryRes, hostTypeRes, platformRes] = await Promise.all([
        fetch("/api/platforms/categories"),
        fetch("/api/platforms/host-types"),
        fetch("/api/platforms/platforms")
      ]);
      if (categoryRes.ok) setCategories(await categoryRes.json());
      if (hostTypeRes.ok) setHostTypes(await hostTypeRes.json());
      if (platformRes.ok) setPlatforms(await platformRes.json());
    };
    fetchMasters();
  }, []);

  const selectedHostType = useMemo(
    () => hostTypes.find((item) => String(item.id) === normalizedHostTypeId) ?? null,
    [hostTypes, normalizedHostTypeId]
  );

  const availablePlatforms = useMemo(() => {
    if (!normalizedHostTypeId) return [] as Platform[];
    const hId = Number(normalizedHostTypeId);
    return platforms.filter((platform) =>
      (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === hId)
    );
  }, [normalizedHostTypeId, platforms]);

  useEffect(() => {
    if (availablePlatforms.length === 0) {
      setSelectedPlatformId("");
      return;
    }
    if (availablePlatforms.some((item) => String(item.id) === selectedPlatformId)) return;
    setSelectedPlatformId(String(availablePlatforms[0].id));
  }, [availablePlatforms, selectedPlatformId]);

  const selectedPlatform = useMemo(
    () => availablePlatforms.find((item) => String(item.id) === selectedPlatformId) ?? null,
    [availablePlatforms, selectedPlatformId]
  );

  const categoryLabel = useMemo(() => {
    if (!selectedHostType) return "未指定";
    return categories.find((item) => item.id === selectedHostType.categoryId)?.name ?? "未指定";
  }, [categories, selectedHostType]);

  return (
    <>
      <Tooltip label="機種固定プレビュー">
        <ActionIcon
          variant="light"
          size="lg"
          disabled={!normalizedHostTypeId}
          onClick={() => setOpened(true)}
        >
          <IconDeviceDesktop size={18} />
        </ActionIcon>
      </Tooltip>

      <FixedPlatformPreviewModal
        opened={opened}
        onClose={() => setOpened(false)}
        hostName={hostName}
        scopeModeLabel="通常"
        categoryLabel={categoryLabel}
        hostTypeLabel={selectedHostType?.name ?? "未指定"}
        selectedPlatformLabel={selectedPlatform?.name ?? "未指定"}
        selectedPlatformVendorId={selectedPlatform?.vendor?.id ? String(selectedPlatform.vendor.id) : ""}
        hostTypeId={normalizedHostTypeId}
        platformId={selectedPlatformId}
        platformOptions={availablePlatforms.map((item) => ({ id: String(item.id), name: item.name }))}
        onPlatformSelect={setSelectedPlatformId}
      />
    </>
  );
};
