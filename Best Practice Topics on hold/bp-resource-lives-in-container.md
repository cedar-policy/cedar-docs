---
layout: default
title: Every resource lives in a container
parent: Best practices
nav_order: 5
---

# Design: Every resource lives in a container

{: .no_toc }

When designing an authorization model, you must associate every action with a particular resource. With an action such as `viewFile`, the resource that it applies to is intuitive; it applies to an individual file, or perhaps to a collection of files within a folder. However, an operation such as `createFile` can be less intuitive. When modeling the capability to create a file, what is the resource the action applies to? It cannot be the file itself, because the file doesn’t exist yet.

This is an example of the generalized problem of resource creation. Resource creation is a bootstrapping problem, in that there must be a way for something to have permission to create resources even when no resources exist yet. The path to solving it is to recognize that every resource must exist within some container, and it is the container itself that acts as the anchor point for permissions. For example, if a folder pre-existed in the system, the ability to create a file can be modeled as a permission on that folder, since that is the location where permissions are necessary to instantiate the new resource.

```cedar
permit (
  principal == User::"&ExampleGuid1;",
  action == Action::"createFile",
  resource == Folder::"&ExampleGuid2;"
);
```

However, what if no folder exists yet? Perhaps this is a new customer account in an application where no resources exist yet. In this situation, there is still a context that can be intuitively understood by asking: where can the customer create new files? Most likely, they shouldn’t be able to create files inside any random customer account. Rather, there is an implied context, and that context is the customer’s own account boundary. Therefore, the account represents the container for resource creation, and this can be explicitly modeled in a policy similar to the following example.

```cedar
// Grants permission to create files within an account,
// or within any sub-folder inside the account.
permit (
  principal == User::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE11111",
  action == Action::"createFile",
  resource in Account::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE22222"
);
```

However, what if no accounts exist either? Perhaps we need to grant a software process that implements the customer sign-up workflow the ability to launch new accounts in the system. If so, we’ll need a container to hold the outermost boundary in which accounts can be launched. This root level container represents the system as a whole and might be named something like “system root” (although the decision of whether this is needed, and how to name it, is up to each application owner).

<!--![\[Sample hierarchy of containers up to accounts and a system root.\]](<img  width="80%" src="images/resource-lives-in-container.png"/>)-->

![\[Sample hierarchy of containers up to accounts and a system root.\]](images/resource-lives-in-container.png)

This is one sample hierarchy. Others are valid as well. The important point is that resource creation always happens within the context of a resource container. Often, these containers are implicit, such as an account boundary, and therefore it can be easy to overlook them. When designing your authorization model, you’ll want to note these implicit assumptions so they can be formally documented and represented in the authorization model.
