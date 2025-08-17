type DataSourcePayload = {
  event: string;
  items: DataSourceResult;
};

type DataSourceResult = DataSourceResultItem[];

type DataSourceResultItem = Item | ItemGroup;

type Item = {
  disabled?: boolean;
  label?: string;
  value: string;
};

type ItemGroup = {
  label?: string;
  children: Item[];
};
