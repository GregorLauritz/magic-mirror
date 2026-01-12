import { compileSchema, draft04, JsonError, JsonSchema, SchemaNode } from 'json-schema-library';

export const getJsonSchemaValidationResult = async (schema: JsonSchema, data: unknown): Promise<JsonError[]> => {
  const jsonSchema: SchemaNode = compileSchema(schema, { drafts: [draft04] });
  const { errors } = jsonSchema.validate(data);
  return errors;
};

export const hasJsonSchemaValidationErrors = async (schema: JsonSchema, data: unknown): Promise<boolean> => {
  const errors = await getJsonSchemaValidationResult(schema, data);
  return errors.length > 0;
};
