---
layout: default
title: Compound authorization
nav_order: 2
---

# Best practice: Compound authorization is normal

{: .no_toc }

Compound authorization occurs when a single user activity, such as clicking a button in your application's interface, requires multiple individual authorization queries to determine whether that activity is permitted. For example, moving a file to a new directory in a file system might require three different permissions: the ability to delete a file from the source directory, the ability to add a file to the destination directory, and possibly the ability to touch the file itself (depending on the application).

If you're new to designing an authorization model, you might think that every authorization decision must be resolvable in a single authorization query. But this can lead to overly complex models and convoluted policy statements. In practice, using compound authorizations can be useful in helping you to produce a simpler authorization model. One measure of a well-designed authorization model is that when you have sufficiently decomposed individual actions, your compound operations, such as moving a file, can be represented by an intuitive aggregation of primitives.

Another situation where compound authorization occurs is when multiple parties are involved in the process of granting a permission. Consider an organizational directory where users can be members of groups. A simple approach is to give the group owner permission to add anyone. However, what if you want your users to first consent to being added? This introduces a handshake agreement in which both the user and the group must consent to the membership. To accomplish this, you can introduce another permission that is bound to the user and specifies whether the user can be added to any group, or to a particular group. When a caller subsequently attempts to add members to a group, the application must enforce both sides of the permissions: that the caller has permission to add members to the specified group, and that the individual user being added has the permissions to be added. When N-way handshakes exist, it is common to observe N compound authorization queries to enforce each portion of the agreement.

If you find yourself with a design challenge where multiple resources are involved and it is unclear how to model the permissions, it can be a sign that you have a compound authorization scenario. In this case, a solution might be found by decomposing the operation into multiple, individual authorization checks.
