---
layout: default
title: Using groups compared to attributes
parent: Best practices
nav_order: 5
---

# Tip: Choosing between group-based or attributes-based access control
{: .no_toc }
Consider a file-sharing application that wishes to grant access based on file type, such as giving access to view JPEG files, but not other file types.

Would this be best achieved by labeling each file with an attribute named `fileType`, or by adding the files to a group named `jpegFiles` that represents the collection?

Using an attribute supports policies like the following:

```
permit (
    principal == User::"5a250ea5-89bb-4b07-9a97-c8632e876124", // "alice"
    action == Action::"readFile",
    resource
)
when {
    resource.fileType == "JPEG"
};
```

Using a group supports policies like the following:

```
permit (
    principal == User::"5a250ea5-89bb-4b07-9a97-c8632e876124", // "alice"
    action == Action::"readFile",
    resource in FileCollection::"39537fd1-da04-488e-8d37-65f4582ffb69" //"JPEG Files"
);
```

In this example, it might not make a significant difference and the choice is down to user preferences. However, in other situations, there are distinct benefits to one approach over the other.

Attribute-based policies are helpful when the conditional expressions may be more complicated than simply checking equality. Imagine if the goal was to instead grant access to files under a certain size:

```
permit (
    principal == User::"5a250ea5-89bb-4b07-9a97-c8632e876124", // "alice"
    action == Action::"readFile",
    resource
)
when {
    resource.fileSizeBytes <= 1000000
};
```

The attribute-based approach fits naturally with conditional expressions, but would require more effort to achieve using groups. It would necessitate knowing which conditional expressions will be written and to construct groups representing those conditions, such as `Files_under_1MB`.

In contrast, group-based policies are helpful when the resources might be organized into collections with inheritance of permissions.

![\[Illustrates a hierarchy of folders and files.\]](images/hierarchy.png)

This organizational approach fits naturally with group-based policies. Another benefit of using groups is that it’s possible to iterate over the policies attached to a principal and determine which resource groups they have access to. This can be useful if an application wishes to render an interface that displays this information to end-users.

Getting the same behavior by using attributes would require attaching an attribute to the resource that contains the transitive closure of all parent folders. Although it's possible, it's a less natural fit and harder to do correctly as folders are added, removed, or rearranged.

In the end, both approaches are valid, and the choice often comes down to whatever most naturally aligns with the application's interface. For example, if end users see resources organized into hierarchical collections, then reflecting that in the Cedar authorization model is the most natural fit. In contrast, if end users see resources with arbitrary attributes and can write arbitrary rules for access management, then the attribute-based approach would most naturally align with the application's interface.
