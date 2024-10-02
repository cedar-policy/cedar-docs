---
layout: default
title: Other considerations
nav_order: 13
---

# Best practice: Consider other reasons to query authorization

{: .no_toc }

We usually associate authorization checks with user requests. The check is a way to determine whether the user has permission to perform that request. However, you can also use authorization data to influence the design of the application's interface. For example, you might want to display a home screen that shows a list of only those resources that the end-user can access. When viewing the details of a resource, you might want the interface to show only those operations that the user can perform on that resource.

These situations can introduce tradeoffs into the authorization model. For example, heavy reliance on attributed-based access control (ABAC) policies can make it more difficult to quickly answer the question "who has access to what?" This is because answering that question requires examining each rule against every principal and resource to determine if there is a match. As a result, a product that needs to optimize for listing only those resources accessible by the user might choose to use a role-based access control (RBAC) model. By using RBAC, it can be easier to iterate over all the policies attached to a user to determine resource access.
