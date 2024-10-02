---
layout: default
title: Resource containers
nav_order: 5
---

# Best practice: Every resource lives in a container

{: .no_toc }

When you design an authorization model, every action must be associated with a particular resource. With an action such as `viewFile`, the resource that you can apply it to is intuitive: an individual file, or perhaps a collection of files within a folder. However, an operation such as `createFile` is less intuitive. When modeling the capability to create a file, what resource does it apply to? It can't be the file itself, because the file doesn’t exist yet.

This is an example of the generalized problem of resource creation. Resource creation is a bootstrapping problem. There must be a way for something to have permission to create resources even when no resources exist yet. The solution is to recognize that every resource must exist within some container, and it is the container itself that acts as the anchor point for permissions. For example, if a folder already exists in the system, the ability to create a file can be modeled as a permission on that folder, since that is the location where permissions are necessary to instantiate the new resource.

```Cedar
permit (
    principal == User::"6688f676-1aa9-456a-acf4-228340b54e9d",
    action == Action::"createFile",
    resource == Folder::"c863f89b-461f-4fc2-b638-e5fa5f79a48b"
);
```

But what if no folder exists? Perhaps this is a brand new customer account in an application where no resources exist yet. In this situation, there is still a context that can be intuitively understood by asking: where can the customer create new files? You don't want them to be able to create files inside any random customer account. Rather, there is an implied context: the customer’s own account boundary. Therefore, the account itself represents the container for resource creation, and this can be explicitly modeled in a policy similar to the following example.

```Cedar
// Grants permission to create files within an account,
// or within any sub-folder inside the account.
permit (
    principal == User::"6688f676-1aa9-456a-acf4-228340b54e9d",
    action == Action::"createFile",
    resource in Account::"c863f89b-461f-4fc2-b638-e5fa5f79a48b"
);
```

Yet, what if no accounts exist either? You might choose to design the customer sign-up workflow so that the it creates new accounts in the system. If so, you’ll need a container to hold the outermost boundary in which the process can create the accounts. This root level container represents the system as a whole and might be named something like “system root”. However, the decision for whether this is needed, and what to name it is up to you, the application owner.

For this sample application, the resulting container hierarchy would therefore appears as follows:

![\[Illustrates the hierarchy of a container.\]](images/resource-lives-in-container.png)

This is one sample hierarchy. Others are valid as well. The thing to remember is that resource creation always happens within the context of a resource container. These containers can be implicit, such as an account boundary, and it can be easy to overlook them. When designing your authorization model, be sure to note these implicit assumptions so they can be formally documented and represented in the authorization model.
