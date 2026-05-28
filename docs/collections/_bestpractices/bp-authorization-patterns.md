---
layout: default
title: Identify your authorization patterns
nav_order: 2
---

# Best practice: Identify your authorization patterns
{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

Every API endpoint in your application maps to one of a small number of authorization patterns. Identifying which pattern each endpoint follows will help you determine how to construct your authorization requests — specifically, what the principal, action, resource, and entity slice should be for each call.

## The patterns

### Single-resource read, update, or delete

A principal performing an action on a specific, existing resource. For example, a user trying to `GetPhoto` or `DeleteDocument`.

This is the most straightforward pattern. The principal, action, and resource map intuitively from the API request:

```
principal = App::User::"alice"
action    = App::Action::"GetPhoto"
resource  = App::Photo::"photo-123"
```

### Resource creation

A principal creating a new resource that doesn't exist yet. For example, `UploadPhoto` or `CreateEmailCampaign`.

Since the resource doesn't exist yet, you can't authorize against it. Instead, the resource in the authorization request is the **container** that the new resource will belong to. Depending on your application, this could be:

- The **tenant** (in multi-tenant setups)
- The **resource container** (a folder, album, project, etc.)
- The **application itself** (in single-tenant setups)

It may be more than one of these. For example, the resource for `UploadPhoto` could be the `Account` (tenant). But if the application models folders, it could be the `Folder` — and the folder's parent `Account` would be part of the entity hierarchy. If the application also models albums, then the `Album` and its parent `Account` would be included in the entity slice.

```
principal = App::User::"alice"
action    = App::Action::"UploadPhoto"
resource  = App::Folder::"alice-vacation-2024"
```

### Resource listing

A principal listing resources of a given type. For example, `ListPhotos` or `ListEmailCampaigns`.

Listing is similar to resource creation — you authorize against a container resource. However, it has an additional consideration: the action itself may need to encode the container level it's querying. Rather than a generic `ListPhotos`, depending on the application, a more precise action name might be `ListPhotosForAccount` or `ListPhotosForFolder`, because the action hard-wires which container-level resource it targets.

```
principal = App::User::"alice"
action    = App::Action::"ListPhotosForFolder"
resource  = App::Folder::"alice-vacation-2024"
```

One common approach for listing is to treat list permissions as all-or-nothing at the container level, and then mitigate security concerns by ensuring that list APIs only return metadata. If a caller wants the full resource, they must call the corresponding `Get` action, which is authorized individually for each resource.

### Batch read, update, or delete

A principal performing the same action on multiple resources at once. For example, a teacher submitting attendance (updating presence status for each student), or a user multi-selecting rows in a table and clicking "Delete."

These require **composite authorization** — authorizing the same principal for the single-resource action against each resource in the batch. You issue one authorization check per resource. In Cedar with Amazon Verified Permissions, this is done with `BatchIsAuthorized`.

```
// For each selected resource, authorize:
principal = App::User::"teacher-jones"
action    = App::Action::"RecordAttendance"
resource  = App::Student::"student-001"   // ...repeated for each student
```

Another example is moving a file from one folder to another — this requires authorization against both the source and destination containers (e.g., permission to remove from the source folder and permission to add to the destination folder).

For more on this pattern, see [Compound authorization is normal](../bestpractices/bp-compound-auth.html).


## Building entity slices

Each authorization pattern determines the code you write to fetch your entity slice and call `IsAuthorized`. For each action signature there is a different slice, which can seem overwhelming at first — until you recognize the repeating structure.

### The principal subslice

Every `IsAuthorized` call includes what you can think of as the **principal subslice**: the principal entity and its parents (team, org, tenant, etc.). This subslice is the same regardless of which API is called, and it can be cached for performance.

```
// The principal subslice is always the same for a given user
App::User::"alice" → parents: [App::Team::"design", App::Org::"acme", App::Tenant::"acme-corp"]
```

The principal subslice code is entirely reusable for account management actions too — for example, when a user is viewing or changing another user's roles. In that case, the *other user* is the resource, and their subslice is generated the same way as a principal subslice.

### The resource subslice

Every resource type has its own subslice pattern. For example, the `EmailCampaign` subslice might be:

1. Fetch the campaign from the database.
2. Read `campaign.organizationId` and fetch that organization.
3. Read `organization.tenantId` and fetch that tenant.

In practice, your application just needs a helper that performs these joins in one fetch and maps the nested result to normalized Cedar entity format.

### Composing slices

When an authorization request comes in:

1. Map the HTTP request to a Cedar action.
2. Once you know the action and principal type, you know the resource type — if you're following the best practice of [mapping actions to the business domain](../bestpractices/bp-map-actions.html), each action should be specific to one resource type.
3. Fetch the principal subslice (likely cached).
4. Fetch the resource subslice for that resource type.
5. Combine them into the entity slice and call `IsAuthorized`.

Each subslice is buildable and testable independently. The total number of subslice implementations you need equals the number of distinct resource types in your schema — not the number of API endpoints.
