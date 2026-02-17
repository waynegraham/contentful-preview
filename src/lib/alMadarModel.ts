import model from "../../data-model.json";

type RawModelField = {
  id?: string;
  name?: string;
  localized?: boolean;
  type?: string;
};

const rawFields = (model.fields as RawModelField[]).filter(
  (field): field is Required<Pick<RawModelField, "id" | "name">> & RawModelField =>
    Boolean(field.id && field.name),
);

export const alMadarContentTypeId = model.sys?.id ?? "alMadarCsv";
export const alMadarDisplayField = model.displayField ?? "title";

export const alMadarFields = rawFields.map((field) => ({
  id: field.id,
  name: field.name,
  localized: Boolean(field.localized),
  type: field.type ?? "Symbol",
}));
