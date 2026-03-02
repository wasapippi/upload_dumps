export type Tag = { id: number; name: string };

export type Command = {
  id: number;
  title: string;
  description: string | null;
  commandText: string;
  danger: 0 | 1 | boolean;
  orderIndex: number;
  hostTypeId: number;
  hostTypeName: string;
  categoryName: string;
  platformId: number | null;
  platformName: string | null;
  vendorId: number | null;
  vendorName: string | null;
  tags: Tag[];
};
