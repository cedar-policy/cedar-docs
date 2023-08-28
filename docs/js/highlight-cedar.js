/*
Language: Cedar
Website: https://github.com/cedar-policy
*/
function cedar(hljs) {
  const GLOBALS = ["decimal", "ip"];

  const VARIABLES = ["principal", "action", "resource", "context"];

  const KEYWORDS = {
    keyword: ["permit", "forbid", "when", "unless", "if", "then", "else"],
    literal: ["true", "false"],
    built_in: GLOBALS,
    variable: VARIABLES,
  };

  const OPERATORS = {
    begin:
      /(?<!\w)/.source +
      "(" +
      [
        "&&",
        "\\|\\|",
        "==",
        "!=",
        ">=",
        "<=",
        ">",
        "<",
        "\\+",
        "-",
        "\\*",
        "in",
        "like",
        "has",
      ].join("|") +
      ")" +
      /(?!\w)/.source,
    scope: "operator",
    relevance: 0,
  };

  const INTEGER = {
    className: "number",
    begin: `0|\-?[1-9](_?[0-9])*`,
    relevance: 0,
  };

  const METHODS = {
    className: "title",
    begin: `(?=\.)(contains|containsAll|containsAny)(?=\\()`,
    relevance: 0,
  };

  const DECIMAL_METHODS = {
    className: "title",
    begin: `(?=\.)(lessThan|lessThanOrEqual|greaterThan|greaterThanOrEqual)(?=\\()`,
    relevance: 0,
  };

  const IP_METHODS = {
    className: "title",
    begin: `(?=\.)(isIpV4|isIpV6|isLoopback|isMulticast|isInRange)(?=\\()`,
    relevance: 0,
  };

  return {
    case_insensitive: false,
    keywords: KEYWORDS,
    contains: [
      hljs.QUOTE_STRING_MODE,
      hljs.C_LINE_COMMENT_MODE,
      INTEGER,
      OPERATORS,
      METHODS,
      DECIMAL_METHODS,
      IP_METHODS,
    ],
  };
}
