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
  platformName?: string;
};

export const HostTypeFixedPreviewAction = ({ hostName, hostTypeId, platformName }: Props) => {
  const [opened, setOpened] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState("");

  const normalizedHostTypeId = String(hostTypeId ?? "");
  const normalizedPlatformName = (platformName ?? "").trim();

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

  const platformsByName = useMemo(() => {
    if (!normalizedPlatformName) return [] as Platform[];
    return platforms.filter((platform) => platform.name === normalizedPlatformName);
  }, [normalizedPlatformName, platforms]);

  const resolvedHostTypeId = useMemo(() => {
    if (normalizedHostTypeId) return normalizedHostTypeId;
    const fromPlatform = platformsByName[0]?.hostTypeLinks?.[0]?.hostTypeId;
    return fromPlatform ? String(fromPlatform) : "";
  }, [normalizedHostTypeId, platformsByName]);

  const selectedHostType = useMemo(
    () => hostTypes.find((item) => String(item.id) === resolvedHostTypeId) ?? null,
    [hostTypes, resolvedHostTypeId]
  );

  const availablePlatforms = useMemo(() => {
    if (normalizedPlatformName) return platformsByName;
    if (!resolvedHostTypeId) return [] as Platform[];
    const hId = Number(resolvedHostTypeId);
    return platforms.filter((platform) =>
      (platform.hostTypeLinks ?? []).some((link) => link.hostTypeId === hId)
    );
  }, [normalizedPlatformName, platformsByName, platforms, resolvedHostTypeId]);

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

  if ((normalizedPlatformName || resolvedHostTypeId) && availablePlatforms.length === 0) {
    return null;
  }
  if (!resolvedHostTypeId) {
    return null;
  }

  return (
    <>
      <Tooltip label="機種固定プレビュー">
        <ActionIcon
          variant="subtle"
          color="green"
          size="sm"
          disabled={!resolvedHostTypeId}
          onClick={() => setOpened(true)}
        >
          <IconDeviceDesktop size="1.0rem" />
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
        hostTypeId={resolvedHostTypeId}
        platformId={selectedPlatformId}
        platformOptions={availablePlatforms.map((item) => ({ id: String(item.id), name: item.name }))}
        onPlatformSelect={setSelectedPlatformId}
      />
    </>
  );
};
