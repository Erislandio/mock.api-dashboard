export function generatePayloadFromSchema(schemaObj: any): any {
  try {
    if (typeof schemaObj === 'string') schemaObj = JSON.parse(schemaObj);
    
    function generate(schema: any): any {
      if (!schema) return null;
      if (schema.type === 'object') {
        const obj: Record<string, any> = {};
        if (schema.properties) {
          for (const [key, prop] of Object.entries(schema.properties) as [string, any][]) {
            obj[key] = generate(prop);
          }
        }
        return obj;
      }
      if (schema.type === 'array') {
        if (schema.items) {
          return [generate(schema.items)];
        }
        return [];
      }
      if (schema.type === 'string') {
        if (schema.enum && schema.enum.length > 0) return schema.enum[0];
        if (schema.format === 'email') return 'user@example.com';
        if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
        if (schema.format === 'date-time') return new Date().toISOString();
        return 'string_value';
      }
      if (schema.type === 'number' || schema.type === 'integer') {
        return 123;
      }
      if (schema.type === 'boolean') {
        return true;
      }
      return null;
    }
    
    return generate(schemaObj) || {};
  } catch (e) {
    return {};
  }
}
