export type AbiEntry = StructEntry | EnumEntry | FunctionEntry | TypeAliasEntry;

export interface StructEntry {
  type: "struct";
  name: string;
  fields: Field[];
  generics?: string[];
}

export interface EnumEntry {
  type: "enum";
  name: string;
  variants: Variant[];
}

export interface FunctionEntry {
  type: "fn";
  name: string;
  method: "init" | "get" | "post" | "callback";
  inputs: Field[];
  output: TypeDefinition | null;
}

export interface Field {
  name: string;
  type: TypeDefinition;
}

export interface Variant {
  name: string;
  fields: Field[];
}

export interface TypeDefinition {
  kind: "Path" | "Tuple" | "Array" | "TypeAlias";

  path?: string[];
  generic_args?: TypeDefinition[];

  tuple_args?: TypeDefinition[];

  elem?: TypeDefinition;
  len?: number;

  target?: TypeDefinition;
  generics?: string[];
}

export interface TypeAliasEntry {
  type: "type_alias";
  name: string;
  generics?: string[];
  target: TypeDefinition;
}

export interface GeneratorOptions {
  importPath?: string;
}
