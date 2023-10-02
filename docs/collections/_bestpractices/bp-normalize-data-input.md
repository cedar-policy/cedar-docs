---
layout: default
title: Normalize data input
nav_order: 2
---

# Security requirement: Normalize input data prior to invoking the authorization APIs
{: .no_toc }

The Cedar policy language omits some well-known operators, including those used to format data and to manipulate and transform strings and lists. This omission is intentional. One reason why is that these operators disrupt the ability to apply automated reasoning techniques to Cedar policy statements. Another reason that Cedar does not provide operators is that Cedar is designed to support situations where policy authors can reside outside the service team, or even be external customers. To provide a safe, intuitive policy authoring experience for these audiences, each individual policy author should not be required to discover and apply appropriate formatting rules.

As a result, application owners should format data prior to passing it into the authorization APIs. For example, instead of passing the following data in the context record:

```json
{
  "url": "https://example.com/path/to/page?name=alice&amp;color=red"
}
```

The information should be pre-formatted into something more accessible by policy authors:

```json
{
  "url": {
    "transport": "https",
    "host": "example.com",
    "path": "/path/to/page"
    "queryParams": {
      "name": "alice",
      "color": "red"
    }
}
```

Special attention should be paid to the normalization of strings. For example, consider the following URL which resolves to the same resource as the example above.

```json
{
  "url": "https://EXAMPLE.COM////path/to/page?name=alice&amp;color=red"
}
```

Note the capitalization of `EXAMPLE.COM` and multiple `/` characters at the beginning of the path. All must be normalized into a consistent representation prior to authorization. Otherwise, as shown in the following example policy, the rules may not behave as the author expects.

```cedar
permit (principal, action, resource)
when {
  context.url.host == "example.com" && // Won't match "EXAMPLE.COM"
  context.url.path == "/path/to/page"  // Won't match "///path/to/page"
};
```

Normalization requirements also apply to entity identifiers. For example, consider a service that accepts UUIDs with or without embedded dashes, or with different capitalization:

```
// All of the following will return the same object.
service.getObject(objectId: "a9edd19b-46f3-486b-887d-4c378aced880");
service.getObject(objectId: "A9EDD19B-46F3-486B-887D-4C378ACED880"):
service.getObject(objectId: "a9edd19b46f3486b887d4c378aced880");
```

If a service accepts all formats of the identifier, which format can be reliably used in Cedar policies? The service must choose one normalized format and use it consistently during authorization queries. The impacts of doing otherwise can lead to a risk, as illustrated in the following example:

```cedar
// This policy won't match if the Object ID is provided in a different format.
// This allows the caller to bypass the forbid rule and retrieve the object.
forbid (
  principal,
  action == Action::"getObject",
  resource == Object::"a9edd19b-46f3-486b-887d-4c378aced880"
);
```

As these examples demonstrate, pre-normalization of data is important for policy analysis, policy authoring, and the overall security of the application. Careful consideration should be given to ensure that all string inputs are normalized prior to invoking the authorization APIs.
