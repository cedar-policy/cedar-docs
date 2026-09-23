---
layout: default
title: Policy examples
nav_order: 8
---

# Policy examples {#policy-examples}
{: .no_toc }

The following policy examples are based on the schema defined for the hypothetical application called PhotoFlash described in [Example scenario](../overview/scenario.html).

<details open markdown="block" id="toc">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Allows access to individual entities {#allow-acces-indivuals}
This following example shows how you might create a policy that allows the user `alice` to view the photo `VacationPhoto94.jpg`.

```Cedar
permit(
  principal == User::"alice", 
  action == Action::"view", 
  resource == Photo::"VacationPhoto94.jpg"
);
```

## Allows access to groups of entities {#allow-acces-groups}
This following example shows how you might create a policy that allows anyone in the `alice_friends` group to view the photo `VacationPhoto94.jpg`.

```Cedar
permit(
  principal in Group::"alice_friends", 
  action == Action::"view", 
  resource == Photo::"VacationPhoto94.jpg"
);
```
This following example shows how you might create a policy that allows the user `alice` to view any photo in the album `alice_vacation`.

```Cedar
permit(
  principal == User::"alice", 
  action == Action::"view", 
  resource in Album::"alice_vacation"
);
```
This following example shows how you might create a policy that allows the user `alice` to view, edit, or delete any photo in the album `alice_vacation`.

```Cedar
permit(
  principal == User::"alice", 
  action in [Action::"view", Action::"edit", Action::"delete"], 
  resource in Album::"alice_vacation"
);
```
This following example shows how you might create a policy that allows permissions for the user `alice` in the album `alice_vacation`, where `admin_actions` is a group of actions defined in the schema that contains the actions to view, edit, and delete a photo.

```Cedar
permit(
  principal == User::"alice", 
  action in Action::"admin_actions",
  resource in Album::"alice_vacation"
);
```
This following example shows how you might create a policy that allows permissions for the user `alice` in the album `alice_vacation`, where `viewer_actions` is a group of actions defined in the schema that contains the actions to view and comment on a photo. The user `alice` is also granted the `edit` permission by the second action listed in the policy.

```Cedar
permit(
  principal == User::"alice", 
  action in [Action::"viewer_actions", Action::"edit"],
  resource in Album::"alice_vacation"
);
```
## Allows access for any entity {#allow-any}
This following example shows how you might create a policy that allows any authenticated principal to view the album `alice_vacation`.
```Cedar
permit(
  principal,
  action == Action::"view", 
  resource in Album::"alice_vacation"
);
```
This following example shows how you might create a policy that allows the user `alice` to list all the albums in the `jane` account, list the photos in each album, and view photos in the account.
```Cedar
permit(
  principal == User::"alice", 
  action in [Action::"listAlbums", Action::"listPhotos", Action::"view"],
  resource in Account::"jane"
);
```
This following example shows how you might create a policy that allows the user `alice` to perform any action on resources in the album `jane_vacation`.
```Cedar
permit(
  principal == User::"alice", 
  action,
  resource in Album::"jane_vacation"
);
```
## Allows access for attributes of an entity (ABAC) {#allow-abac}
Attribute-based access control (ABAC) is an authorization strategy that defines permissions based on attributes. Cedar allows attributes to be attached to principals, resources, and request context. These can then be referenced within a policy's `when` or `unless` clause to have authorization depend on attribute values.

This following example shows how you might create a policy that allows any principal in the `HardwareEngineering` department with a job level of greater than or equal to 5 to view and list photos in the album `device_prototypes`.
```Cedar
permit(
  principal,
  action in [Action::"listPhotos", Action::"view"],
  resource in Album::"device_prototypes"
)
when {
  principal.department == "HardwareEngineering" &&
  principal.jobLevel >= 5
};
```
This following example shows how you might create a policy that allows the user `alice` to view any resource of file type `JPEG`.
```Cedar
permit(
  principal == User::"alice",
  action == Action::"view",
  resource
)
when {
  resource.fileType == "JPEG"
};
```
An authorization request can also include a *context* with its own attributes. This following example shows how you might create a policy that allows the user `alice` to delete any resource, but only for requests made with multi-factor authentication.
```Cedar
permit(
  principal == User::"alice",
  action in Action::"delete",
  resource
) when { 
    context has authentication.usedMFA &&
    context.authentication.usedMFA
};
```
The attributes available in the context are defined for each action in the [`appliesTo`](../schema/schema.html#schema-actions) property for that action in your schema.

The context usually contains information that changes with each request. If you have properties of actions that are consistent across all requests, a better approach is to arrange those actions into functional action groups. For example, you can create an action named `ReadOnlyPhotoAccess` and set `Action::"ViewPhoto"` to be a member of `ReadOnlyPhotoAccess` as an action group. This following example shows how you might create a policy that grants Alice access to the read-only actions in that group. Other actions added to this group will automatically be authorized by this policy.
```Cedar
permit(
  principal == User::"alice",
  action in Action::"ReadOnlyPhotoAccess",
  resource
);
```
This following example shows how you might create a policy that allows all principals to perform any action on resources for which they are the `owner`.
```Cedar
permit(
  principal,
  action,
  resource
)
when {
  principal == resource.owner
};
```
This following example shows how you might create a policy that allows any principal to view any resource if the `department` attribute for the principal matches the `department` attribute of the resource's owner.

**Note**: If an entity doesn't have an attribute mentioned in a policy condition, then the policy will be ignored when making an authorization decision and evaluation of that policy fails for that entity. For example, any principal that does not have a `department` attribute cannot be granted access to any resource by this policy. 

```Cedar
permit(
  principal,
  action == Action::"view",
  resource
)
when {
  principal.department == resource.owner.department
};
```
This following example shows how you might create a policy that allows any principal to perform any action on a resource if the principal is the `owner` of the resource OR if the principal is part of the `admins` group for the resource.
```Cedar
permit(
  principal,
  action,
  resource,
)
when {
  principal == resource.owner ||
  resource.admins.contains(principal)
};
```

## Denies access {#deny-access}
If a policy contains `forbid` for the effect of the policy, it constrains permissions instead of granting permissions.

**Note**: During authorization, if both a `permit` and `forbid` policy are enforced, the `forbid` takes precedence.

Revisiting the earlier action group example, we can instead write a policy that denies access _unless_ the action is a `ReadOnlyPhotoAccess` action. This is not equivalent to the original policy. Because `forbid` overrides `permit`, Alice will never be authorized to perform any other actions.
```Cedar
forbid (
  principal == User::"alice",
  action,
  resource
)
unless {
  action in Action::"ReadOnlyPhotoAccess"
};
```
This following example shows how you might create a policy that denies access to all resources that have a `private` attribute unless the principal has the `owner` attribute for the resource.

```Cedar
forbid (
  principal,
  action,
  resource
)
when {
  resource.private
}
unless {
  principal == resource.owner
};
```
