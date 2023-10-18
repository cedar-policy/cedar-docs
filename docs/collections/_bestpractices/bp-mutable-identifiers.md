---
layout: default
title: Avoid mutable identifiers
nav_order: 6
---

# Security requirement: Avoid mutable identifiers in policies
{: .no_toc }

Mutable identifiers can't be used in policy statements. An example of a mutable identifier is a user name or group name in a workforce directory, where the value of the name can change. Usage of such a name in a policy may appear as follows:

```cedar
permit (
    principal in Group::"TeamExample",
    action in ...,
    resource in ...
);
```

If the group name was changed, it would no longer match this policy. If the group was deleted and the name was reused for a different group, the new group members would receive the permissions of any policies that hadn’t been removed when the original group was deleted.

For these reasons, policies must refer to only unique, normalized, immutable, and non-recyclable identifiers. Use universally unique identifiers (UUIDs) or similar formats that meet the same criteria, such as sequence numbers or uniform resource names (URNs).

```cedar
permit (
    principal in Group::"fcaf664d4f89fec0cda8", // "TeamExample"
    action in ...,
    resource in ...
);
```
