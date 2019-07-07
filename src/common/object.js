export function toPlainDotNotationObject(obj, prefix) {
  return Object.entries(obj).reduce((acc, curr) => {
    const [key, value] = curr;
    if (typeof value === 'object') {
      const plainObj = toPlainDotNotationObject(value, key);
      const prefixed = prefix
        ? Object.entries(plainObj)
          .reduce((a, [k, v]) => ({ ...a, [`${prefix}.${k}`]: v }), {})
        : plainObj;
      return { ...acc, ...prefixed };
    } else {
      const newKey = prefix ? `${prefix}.${key}` : key;
      return { ...acc, [newKey]: value };
    }
  }, {});
};
