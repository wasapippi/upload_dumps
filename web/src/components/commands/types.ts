export type Tag = {
  id: number;
  name: string;
  normalizedName: string;
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

export type HostType = {
  id: number;
  name: string;
  categoryId: number;
  groupOrderIndex: number;
  category?: {
    id: number;
    name: string;
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
  danger: boolean;
  orderIndex: number;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
  hostType: HostType;
  platform?: Platform | null;
  variables: CommandVariable[];
  tags: CommandTag[];
};
