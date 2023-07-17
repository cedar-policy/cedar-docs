---
layout: default
title: Don't embed permissions in attributes
parent: Best practices
nav_order: 4
---

# Best practice: Avoid embedding permissions inside attributes
{: .no_toc }

Attributes are best used as an *input* to the authorization decision. Don't use attributes to represent the permissions themselves, such as by declaring an attribute named “permittedFolders” on a User:

```
// ANTI-PATTERN: comingling permissions into user attributes
{
    "id": "df82e4ad-949e-44cb-8acf-2d1acda71798",
    "name": "alice",  
    "email": "alice@example.com",
    "permittedFolders": [
        "Folder::"c943927f-d803-4f40-9a53-7740272cb969",
        "Folder::"661817a9-d478-4096-943d-4ef1e082d19a",
        "Folder::"b8ee140c-fa09-46c3-992e-099438930894"
    ]
}
```

And, subsequently using the attribute within a policy:

```
// ANTI-PATTERN
permit (
    principal,
    action == Action::"readFile",
    resource
)
when {
    resource in principal.permittedFolders
};
```

This approach transforms what would otherwise be a simple authorization model, where a specific principal has access to a specific folder, into an attributes-based access control (ABAC) model with the accompanying tradeoffs. One such tradeoff is that it becomes more difficult to quickly determine who has permission to a resource. In the preceding example, to determine who has access to a particular folder, it is necessary to iterate over every user to check if that folder is listed in their attributes, and doing so with the special awareness that there is a policy that grants access when they do.

Another risk with this approach is the scaling factors when permissions are packed together inside a single `User` record. If the user has access to many things, the cumulative size of their `User` record will grow and perhaps approach the maximum limit of whatever system is storing the data.

Instead, we recommend that you represent this scenario using multiple individual policies, perhaps usin policy templates to minimize repetition.

```//BETTER PATTERN
permit (
    principal == User::"df82e4ad-949e-44cb-8acf-2d1acda71798",
    action == Action::"readFile",
    resource in Folder::"c943927f-d803-4f40-9a53-7740272cb969"
);

permit (
    principal == User::"df82e4ad-949e-44cb-8acf-2d1acda71798",
    action == Action::"readFile",
    resource in Folder::"661817a9-d478-4096-943d-4ef1e082d19a"
);

permit (
    principal == User::"df82e4ad-949e-44cb-8acf-2d1acda71798",
    action == Action::"readFile",
    resource in Folder::"b8ee140c-fa09-46c3-992e-099438930894"
);
```

Cedar can efficiently handle many individual, fine-grained policies during authorization evaluation. Modeling things in this way is more manageable and auditable over time.
