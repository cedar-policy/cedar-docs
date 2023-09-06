---
layout: default
title: Populate the policy scope
parent: Best practices
nav_order: 4
---

# Best practice: When possible, populate the policy scope
{: .no_toc }
The [policy scope](terminology.html#policy) is the portion of a Cedar policy statement after the `permit` or `forbid` keywords and between the opening parenthesis.

![\[Illustrates the structure of a &Cedar; policy, including the scope.\]](images/structure-of-policy.png)

We recommend that you populate the values for `principal` and `resource` whenever possible. This lets you index your policies in storage for more efficient retrieval, which can improve performance. If you need to grant the same permissions to many different principals or resources, we recommend that you use a policy template and attach it to each principal and resource pair.

Avoid creating one large policy that contains lists of principals and resources in a `when` clause. Doing so will likely cause you to run into scalability limits or operational challenges. For example, in order to add or remove a single user from a large list within a policy, it is necessary to read the whole policy, edit the list, write the new policy in full, and handle concurrency errors if one administrator overwrites another’s changes. In contrast, by using many fine-grained permissions, adding or removing a user is as simple as adding or removing the single policy that applies to them.
