export type Tag = {
  id: number;
  name: string;
  normalizedName: string;
  kind?: "COMMAND" | "LINK";
};

export type CommandVariable = {
  id?: number;
  name: string;
  label: string;
  required: boolean;
  defaultValue?: string | null;
  placeholder?: string | null;
  regex?: string | null;
};

export type CommandTag = {
  tag: Tag;
};

export type PlatformLinkTag = {
  tag: Tag;
};

export type HostType = {
  id: number;
  name: string;
  categoryId: number;
  groupOrderIndex: number;
  category?: {
    id: number;
    name: string;
    groupOrderIndex?: number;
  };
};

export type Platform = {
  id: number;
  name: string;
  vendor?: {
    id: number;
    name: string;
  };
  hostTypeLinks?: Array<{
    hostTypeId: number;
    hostType?: {
      id: number;
      categoryId: number;
    };
  }>;
};

export type Command = {
  id: number;
  title: string;
  description?: string | null;
  commandText: string;
  hostTypeId: number;
  platformId?: number | null;
  vendorId?: number | null;
  visibility?: "PUBLIC" | "PRIVATE";
  ownerUserId?: string | null;
  deviceBindingMode?: "INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE";
  danger: boolean;
  orderIndex: number;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
  hostType: HostType;
  platform?: Platform | null;
  vendor?: {
    id: number;
    name: string;
  } | null;
  variables: CommandVariable[];
  tags: CommandTag[];
};

export type PlatformLink = {
  id: number;
  title: string;
  urlTemplate: string;
  commentTemplate?: string | null;
  platformId?: number | null;
  vendorId?: number | null;
  hostTypeId: number;
  visibility: "PUBLIC" | "PRIVATE";
  ownerUserId?: string | null;
  deviceBindingMode?: "INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE";
  orderIndex: number;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
  hostType?: HostType;
  platform?: Platform | null;
  vendor?: {
    id: number;
    name: string;
  } | null;
  tags?: PlatformLinkTag[];
  resolvedUrl?: string;
  resolvedComment?: string;
};
