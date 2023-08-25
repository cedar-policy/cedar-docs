---
layout: default
title: Focus on resources, not APIs
parent: Best practices
nav_order: 9
---

# Design: Focus on the resources, not the API operations
{: .no_toc }
In most consumer-facing applications, permissions should be modeled around the resources used by the application. For example, a file sharing application might represent permissions as actions that can be performed on a file or folder. This is a good, simple model that abstracts away the underlying implementation and the supporting service API operations.

In contrast, some types of applications, particularly web services, frequently design permissions around the API operations themselves. For example, if a web service provided an API named `createThing()`, the authorization model would define a corresponding action named `createThing`. This works in many situations and makes it easy to understand the permissions; to invoke `createThing` operation, you need the `createThing` action permission.
However, there are circumstances in which this API-centric approach is less than optimal. This is because the API operations are merely proxies for what customers truly want to protect: the underlying data and resources. If multiple API operations control access to the same resources, it can become difficult for administrators to reason about the many paths through which users can access the resources, and manage that access accordingly.

To illustrate, consider a user directory holding the members of an organization. Users can be organized into groups, and one of the security goals is to prohibit discovery of group memberships by unauthorized parties. This service provides two API operations:

+ `listMembersOfGroup`
+ `listGroupMembershipsForUser`

Both operations enable a user to discover group membership, so the permissions administrator must remember to coordinate access to both of them. Further compounding the difficulty, the service may later decide to release a new API to address more use cases, such as the following:

+ `isUserInGroups` &ndash; a new API to quickly test if a user belongs in one or more groups

From a security perspective, this new API has opened a 3rd path to discover group memberships, thereby disrupting the carefully crafted permissions of the administrator.
Instead, we recommend that you move from an API focused to a resource focused authorization model. The resource focused approach ignores the API semantics and focuses on the underlying data and common operations. Applying this approach to the group membership example would lead to an abstract permission, such as `viewGroupMembership`, which each API would invoke.

| API name | Permissions |
| --- |--- |
| `listMembersOfGroup` | Requires `viewGroupMembership` permission on the user directory |
| `listGroupMembershipsForUser` | Requires `viewGroupMembership` permission on the user directory |
| `isUserInGroups` | Requires `viewGroupMembership` permission on the user directory |

By defining this one permission, an administrator can successfully control access to the discovery of group membership. As a tradeoff, each API must now document the permissions it enforces, and an administrator must consult this documentation when crafting permissions. This can be a valid tradeoff when necessary to meet a customer’s security expectations.
