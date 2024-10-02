---
layout: default
title: Meta-permissions
nav_order: 10
---

# Design: Implement meta-permissions as policies
{: .no_toc }

Authorization systems must contend not only with permissions to resources, but also who has the permission to modify permissions. These meta-permissions, or admin permissions, are themselves a part of the authorization model and should be included in the design exercise.

One simple approach to meta-permissions is to introduce a new action, such as `editPermissions`, that can be referenced in policies just like any other action.

```cedar
permit (
    principal == User::"&ExampleToken1;",
    action == Action::"editPermissions",
    resource in Account::"&ExampleToken2;"
);
```

The application would then confirm whether a principal has this capability whenever they attempt to modify permissions on a resource.

Richer implementations may choose more granular meta-permissions, such as `editReadPermissions` or `editWritePermissions`. Alternatively, an ABAC-style approach can be used in which resources are decorated with an attribute such as `owner`, and a global ABAC rule that allows owners to manage access:

```cedar
permit (
    principal,
    action == Action::"editPermissions",
    resource
)
when {
    principal == resource.owner
};
```

The ABAC-style approach also makes it very important to protect the value of `owner` and who can change it. The solution that any application chooses ties back to the user experience. Application designers must decide which principals can have these meta-permissions and how they manage them in the application UX. With that understanding in place, the administrative experience can be mapped into a corresponding authorization model.
