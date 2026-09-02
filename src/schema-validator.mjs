const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function same(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) return left.length === right.length && left.every((value, index) => same(value, right[index]));
  if (isObject(left) && isObject(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return same(leftKeys, rightKeys) && leftKeys.every((key) => same(left[key], right[key]));
  }
  return false;
}

function jsonType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number" && Number.isInteger(value)) return "integer";
  return typeof value;
}

function resolveReference(root, reference) {
  if (!reference.startsWith("#/") ) throw new Error(`UNSUPPORTED_SCHEMA_REFERENCE:${reference}`);
  return reference.slice(2).split("/").reduce((value, part) => value?.[part.replaceAll("~1", "/").replaceAll("~0", "~")], root);
}

function checkFormat(value, format) {
  if (format !== "date-time") return true;
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && /T/.test(value);
}

function validate(value, schema, root, path, seen) {
  if (schema == null || schema === true) return [];
  if (schema === false) return [`${path}: schema forbids this value`];
  if (schema.$ref) {
    const target = resolveReference(root, schema.$ref);
    if (!target) return [`${path}: unresolved reference ${schema.$ref}`];
    const marker = `${schema.$ref}|${path}`;
    if (seen.has(marker)) return [];
    const nextSeen = new Set(seen).add(marker);
    return validate(value, target, root, path, nextSeen);
  }
  const errors = [];
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((candidate) => validate(value, candidate, root, path, new Set(seen)).length === 0).length;
    if (matches !== 1) errors.push(`${path}: oneOf matched ${matches} schemas`);
  }
  if (schema.anyOf && !schema.anyOf.some((candidate) => validate(value, candidate, root, path, new Set(seen)).length === 0)) errors.push(`${path}: anyOf matched no schemas`);
  if (schema.allOf) for (const candidate of schema.allOf) errors.push(...validate(value, candidate, root, path, seen));
  if (schema.const !== undefined && !same(value, schema.const)) errors.push(`${path}: expected const ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some((candidate) => same(value, candidate))) errors.push(`${path}: value is not in enum`);
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = jsonType(value);
    if (!types.includes(actual) && !(actual === "integer" && types.includes("number"))) return [...errors, `${path}: expected ${types.join(" or ")}, got ${actual}`];
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) errors.push(`${path}: shorter than minLength`);
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) errors.push(`${path}: longer than maxLength`);
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) errors.push(`${path}: does not match pattern`);
    if (schema.format && !checkFormat(value, schema.format)) errors.push(`${path}: invalid ${schema.format}`);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) errors.push(`${path}: number must be finite`);
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: fewer than minItems`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}: more than maxItems`);
    if (schema.uniqueItems) for (let index = 0; index < value.length; index += 1) if (value.slice(index + 1).some((item) => same(item, value[index]))) errors.push(`${path}: duplicate array item at ${index}`);
    if (schema.items) value.forEach((item, index) => errors.push(...validate(item, schema.items, root, `${path}[${index}]`, seen)));
  }
  if (isObject(value)) {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) errors.push(`${path}: fewer than minProperties`);
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) errors.push(`${path}: more than maxProperties`);
    for (const required of schema.required ?? []) if (!Object.prototype.hasOwnProperty.call(value, required)) errors.push(`${path}: missing required property ${required}`);
    const declared = new Set(Object.keys(schema.properties ?? {}));
    const patterns = Object.entries(schema.patternProperties ?? {});
    for (const key of keys) {
      if (schema.propertyNames) errors.push(...validate(key, schema.propertyNames, root, `${path}.${key} (name)`, seen));
      if (schema.properties?.[key]) errors.push(...validate(value[key], schema.properties[key], root, `${path}.${key}`, seen));
      const matchingPatterns = patterns.filter(([pattern]) => new RegExp(pattern).test(key));
      for (const [, patternSchema] of matchingPatterns) errors.push(...validate(value[key], patternSchema, root, `${path}.${key}`, seen));
      if (!declared.has(key) && matchingPatterns.length === 0 && schema.additionalProperties === false) errors.push(`${path}: unexpected property ${key}`);
      else if (!declared.has(key) && matchingPatterns.length === 0 && isObject(schema.additionalProperties)) errors.push(...validate(value[key], schema.additionalProperties, root, `${path}.${key}`, seen));
    }
  }
  return errors;
}

export function validateDocument(document, schema) {
  return validate(document, schema, schema, "$", new Set());
}

export function assertValidDocument(document, schema, label = "document") {
  const errors = validateDocument(document, schema);
  if (errors.length) throw new Error(`SCHEMA_VALIDATION_FAILED:${label}\n${errors.join("\n")}`);
  return true;
}
