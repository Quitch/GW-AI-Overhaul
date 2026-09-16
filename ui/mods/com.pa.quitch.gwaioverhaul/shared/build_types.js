// PA's unit-type expression language, evaluated against a unit's tags. The ES5
// twin of scripts/lib/build-types.js. See races.md, "Capability cells".
define(() => {
  const tokenize = (expression) =>
    String(expression || "").match(/\w+|[()&|-]/g) || [];

  const matches = (expression, tags) => {
    const tokens = tokenize(expression);
    let index = 0;
    const has = (tag) => (tags || []).includes(tag);

    const parseAtom = () => {
      const token = tokens[index++];
      if (token === "(") {
        const value = parseOr();
        if (tokens[index] === ")") {
          index++;
        }
        return value;
      }
      return !!token && /^\w+$/.test(token) && has(token);
    };

    const parseAnd = () => {
      let value = parseAtom();
      while (tokens[index] === "&" || tokens[index] === "-") {
        const op = tokens[index++];
        const right = parseAtom();
        value = op === "&" ? value && right : value && !right;
      }
      return value;
    };

    var parseOr = () => {
      let value = parseAnd();
      while (tokens[index] === "|") {
        index++;
        const right = parseAnd();
        value = value || right;
      }
      return value;
    };

    if (!tokens.length) {
      return false;
    }
    return parseOr();
  };

  return { matches };
});
