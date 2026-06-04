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


### Open endpoints

A principal performing an action that isn't scoped to any specific resource or container. For example, `Login`, `Signup`, or `ResetPassword`. The principal's identity is not trusted — the caller may be unauthenticated or presenting unverified credentials.

These endpoints don't operate on a user-owned resource — they're entry points to the application itself. The resource in the authorization request is the **application** (or service) entity.

```
principal = App::User::"alice"
action    = App::Action::"Login"
resource  = App::Application::"myApp"
```

This pattern is useful when you want Cedar policies to control access to the application as a whole — for example, restricting login to users whose accounts are in good standing, or limiting signup to specific email domains.

### Implicit-scope endpoints

A principal performing an action where the resource is implicitly derived from the principal itself. For example, `GetDashboardData`, `GetMyProfile`, or `ListMyNotifications`.

These endpoints don't accept a resource identifier in the request — the business logic extracts the user from the JWT and returns data scoped to that user. Since the resource is implicit in the principal, you model the action's resource type as the **application** entity, same as open endpoints.

```
principal = App::User::"alice"
action    = App::Action::"GetDashboardData"
resource  = App::Application::"myApp"
```

This pattern is useful when the endpoint's access control question is simply "is this principal allowed to use this feature?" rather than "is this principal allowed to access this specific resource?"

## Building entity slices

Each call to `IsAuthorized` requires a single entity slice — the list of entities (with their attributes and parent relationships) that the authorization engine needs to evaluate policies. The entity slice you send depends on which authorization pattern the request follows.

While each request has one combined entity slice, you can think of it as composed of reusable parts:

**The principal slice** is the portion of the entity slice that represents the principal and its parents (roles, groups, tenant, etc.). This portion is relatively stable - a user doesn't change roles or groups that often, and never changes tenant. This means you can get the result once and cache for a while in order to improve performance. More importantly, the _code_ to fetch the principal slice for a particular user is fixed. Given a user id, you need to fetch that user from the db, then fetch that user's roles, then fetch that user's tenant, then convert all three to cedar entity format. The function that does this can be thought of a reusable building block to build the parent hierarchy for the User type.

**The resource slice** is the portion that represents the resource and its parents (containers, tenant, etc.). This varies depending on the resource type and the specific resource being accessed. For example, if the resource being targeted by the request is a `Tenant`, then no db query might be necessary (the request contains the tenant id). But if the resource being targeted by the request is `EmailMessage` you might need to fetch the `EmailCampaign` that the message belongs to, and the tenant that this campaign is under.

To build the full entity slice for any request, you fetch the principal slice, fetch the resource slice, and merge them together. The authorization pattern tells you what the resource slice looks like.

### Composing slices

When an authorization request comes in:

1. Map the HTTP request to a Cedar action.
2. Once you know the action and principal type, you know the resource type — if you're following the best practice of [mapping actions to the business domain](../bestpractices/bp-map-actions.html), each action should be specific to one resource type.
3. Fetch the principal slice (might be cached).
4. Fetch the resource slice for that resource type and specific resource.
5. Merge them into the final entity slice and call `IsAuthorized`.

Each slice builder is usable and testable independently. The total number of resource slice builder implementations you need depends on the number of distinct resource types in your schema and the access patterns available for each. In general, you will have significantly fewer resource slices than API endpoints.

## Case study: Email marketing platform

This section walks through a complete example showing how authorization patterns map to entity slices for each action in an application.

### The schema

Consider an email marketing platform with the following Cedar schema:

```cedar
namespace EmailApp {
    entity Tenant = {
        planTier: String,
        maxUsers: Long
    };

    entity Role = {};

    entity User in [Role, Tenant] = {
        email: String,
        displayName: String
    };

    entity EmailCampaign in [Tenant] = {
        name: String,
        status: String
    };

    entity EmailMessage in [EmailCampaign, Tenant] = {
        subject: String,
        recipientCount: Long
    };

    entity Application = {};

    action login appliesTo { principal: [User], resource: [Application] };
    action signup appliesTo { principal: [User], resource: [Application] };
    action getDashboardData appliesTo { principal: [User], resource: [Application] };

    action createEmailCampaign appliesTo { principal: [User], resource: [Tenant] };
    action getEmailCampaign appliesTo { principal: [User], resource: [EmailCampaign] };
    action updateEmailCampaign appliesTo { principal: [User], resource: [EmailCampaign] };
    action deleteEmailCampaign appliesTo { principal: [User], resource: [EmailCampaign] };
    action listEmailCampaigns appliesTo { principal: [User], resource: [Tenant] };

    action createEmailMessage appliesTo { principal: [User], resource: [EmailCampaign] };
    action getEmailMessage appliesTo { principal: [User], resource: [EmailMessage] };
    action updateEmailMessage appliesTo { principal: [User], resource: [EmailMessage] };
    action deleteEmailMessage appliesTo { principal: [User], resource: [EmailMessage] };
    action listEmailMessages appliesTo { principal: [User], resource: [EmailCampaign] };
}
```

### The principal slice

For every request in this application, the principal slice is constructed in the same way. Given a user `alice` who belongs to the `admin` role in tenant `acme`:

```json
[
    {
        "uid": { "type": "EmailApp::User", "id": "alice" },
        "attrs": { "email": "alice@acme.com", "displayName": "Alice" },
        "parents": [
            { "type": "EmailApp::Role", "id": "admin" },
            { "type": "EmailApp::Tenant", "id": "acme" }
        ]
    },
    {
        "uid": { "type": "EmailApp::Role", "id": "admin" },
        "attrs": {},
        "parents": []
    },
    {
        "uid": { "type": "EmailApp::Tenant", "id": "acme" },
        "attrs": { "planTier": "enterprise", "maxUsers": 100 },
        "parents": []
    }
]
```

This slice is fetched once and reused for several authorization requests for `alice`, with a cache policy that depends on the application's specific needs.


### Open endpoint actions

#### login, signup

**Pattern:** Open endpoint — the resource is the application itself.

**HTTP requests:**
```
POST /login
{ "email": "alice@acme.com", "password": "..." }

POST /signup
{ "email": "bob@newcorp.com", "displayName": "Bob" }
```

**Resource slice:** Just the application entity. The application entity is a synthetic entity — it doesn't correspond to a database record, so no fetch is needed. You simply construct it in code with a fixed identifier.

**IsAuthorized request:**

```
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"login"
resource  = EmailApp::Application::"emailApp"
entities  = principalSlice + resourceSlice
```

Where the resource slice is:

```json
[
    {
        "uid": { "type": "EmailApp::Application", "id": "emailApp" },
        "attrs": {},
        "parents": []
    }
]
```

#### getDashboardData

**Pattern:** Implicit-scope endpoint — the resource is the application. The data returned is scoped to the calling user, but the resource identifier is not part of the request.

**HTTP request:**
```
GET /dashboard-data
```

**Resource slice:** Just the application entity (synthetic, no DB fetch).

**IsAuthorized request:**

```
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"getDashboardData"
resource  = EmailApp::Application::"emailApp"
entities  = principalSlice + resourceSlice
```

Where the resource slice is:

```json
[
    {
        "uid": { "type": "EmailApp::Application", "id": "emailApp" },
        "attrs": {},
        "parents": []
    }
]
```

### EmailCampaign actions

#### createEmailCampaign

**Pattern:** Resource creation — the resource is the tenant.

**HTTP request:**
```
POST /tenants/acme/campaigns
{ "name": "Spring Sale" }
```

**Resource slice:** Just the tenant. In this application, we've modeled some attributes for the tenant entity in the schema. Because of that, it's presumed we need to fetch the tenant from the db (if there are attributes modeled in the schema it should be because they're relevant to authorization).

**IsAuthorized request:**

```
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"createEmailCampaign"
resource  = EmailApp::Tenant::"acme"
entities  = principalSlice + resourceSlice
```

Where the resource slice is:

```json
[
    {
        "uid": { "type": "EmailApp::Tenant", "id": "acme" },
        "attrs": { "planTier": "enterprise", "maxUsers": 100 },
        "parents": []
    }
]
```

In an application where the Tenant's attributes are not relevant to authorization, we wouldn't need to fetch the tenant from the DB. We would just construct a cedar entity with empty attributes like so: 
```json
[
    {
        "uid": { "type": "EmailApp::Tenant", "id": "tenantIdFromUdlParams" },
        "attrs": {},
        "parents": []
    }
]
```

#### listEmailCampaigns

**Pattern:** Resource listing — the resource is the tenant.

**HTTP request:**
```
GET /tenants/acme/campaigns
```

**Resource slice:** Just the tenant. Same slice-building logic as above.

**IsAuthorized request:**

```
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"listEmailCampaigns"
resource  = EmailApp::Tenant::"acme"
entities  = principalSlice + resourceSlice
```

Where the resource slice is:

```json
[
    {
        "uid": { "type": "EmailApp::Tenant", "id": "acme" },
        "attrs": { "planTier": "enterprise", "maxUsers": 100 },
        "parents": []
    }
]
```

Note that this action named `"listEmailCampaigns"` is implied to be specific to this tenant. An equally suitable action name might be `"listEmailCampaignsForTenant"`.

#### getEmailCampaign, updateEmailCampaign, deleteEmailCampaign

**Pattern:** Single-resource read/update/delete — the resource is the campaign.

**HTTP requests:**
```
GET /campaigns/campaign-001
PUT /campaigns/campaign-001
DELETE /campaigns/campaign-001
```

**Resource slice:** The campaign entity and its parent tenant.

**IsAuthorized request:**

```
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"getEmailCampaign"
resource  = EmailApp::EmailCampaign::"campaign-001"
entities  = principalSlice + resourceSlice
```

Where the resource slice is:

```json
[
    {
        "uid": { "type": "EmailApp::EmailCampaign", "id": "campaign-001" },
        "attrs": { "name": "Spring Sale", "status": "draft" },
        "parents": [
            { "type": "EmailApp::Tenant", "id": "acme" }
        ]
    },
    {
        "uid": { "type": "EmailApp::Tenant", "id": "acme" },
        "attrs": {},
        "parents": []
    }
]
```

### EmailMessage actions

#### createEmailMessage

**Pattern:** Resource creation — the resource is the parent campaign (the container the message will belong to).

**HTTP request:**
```
POST /campaigns/campaign-001/messages
{ "subject": "Don't miss our sale!", "recipientCount": 5000 }
```

**Resource slice:** The campaign and its parent tenant.

**IsAuthorized request:**

```
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"createEmailMessage"
resource  = EmailApp::EmailCampaign::"campaign-001"
entities  = principalSlice + resourceSlice
```

Where the resource slice is:

```json
[
    {
        "uid": { "type": "EmailApp::EmailCampaign", "id": "campaign-001" },
        "attrs": { "name": "Spring Sale", "status": "draft" },
        "parents": [
            { "type": "EmailApp::Tenant", "id": "acme" }
        ]
    },
    {
        "uid": { "type": "EmailApp::Tenant", "id": "acme" },
        "attrs": {},
        "parents": []
    }
]
```

#### listEmailMessages

**Pattern:** Resource listing — the resource is the parent campaign. Same slice-building logic as above.

**HTTP request:**
```
GET /campaigns/campaign-001/messages
```

**Resource slice:** The campaign and its parent tenant.

**IsAuthorized request:**

```
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"listEmailMessages"
resource  = EmailApp::EmailCampaign::"campaign-001"
entities  = principalSlice + resourceSlice
```

Where the resource slice is:

```json
[
    {
        "uid": { "type": "EmailApp::EmailCampaign", "id": "campaign-001" },
        "attrs": { "name": "Spring Sale", "status": "draft" },
        "parents": [
            { "type": "EmailApp::Tenant", "id": "acme" }
        ]
    },
    {
        "uid": { "type": "EmailApp::Tenant", "id": "acme" },
        "attrs": {},
        "parents": []
    }
]
```

Note that it is implied that this action named `"listEmailMessages"` is specific to a campaign. An equally suitable action name might be `"listEmailMessagesForCampaign"`.

#### getEmailMessage, updateEmailMessage

**Pattern:** Single-resource read/update/delete — the resource is the message.

**HTTP requests:**
```
GET /messages/msg-042
PUT /messages/msg-042
```

**Resource slice:** The message entity and its parents (campaign, tenant).

**IsAuthorized request:**

```
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"getEmailMessage"
resource  = EmailApp::EmailMessage::"msg-042"
entities  = principalSlice + resourceSlice
```

Where the resource slice is:

```json
[
    {
        "uid": { "type": "EmailApp::EmailMessage", "id": "msg-042" },
        "attrs": { "subject": "Don't miss our sale!", "recipientCount": 5000 },
        "parents": [
            { "type": "EmailApp::EmailCampaign", "id": "campaign-001" },
            { "type": "EmailApp::Tenant", "id": "acme" }
        ]
    },
    {
        "uid": { "type": "EmailApp::EmailCampaign", "id": "campaign-001" },
        "attrs": { "name": "Spring Sale", "status": "active" },
        "parents": [
            { "type": "EmailApp::Tenant", "id": "acme" }
        ]
    },
    {
        "uid": { "type": "EmailApp::Tenant", "id": "acme" },
        "attrs": {},
        "parents": []
    }
]
```

Note that in this case, the resource slice for an `EmailMessage` is composable with the resource slice for the `EmailCampaign`. This may allow for code simplification in some cases.

#### deleteEmailMessage

**Pattern:** This is a single cedar action, but it actually corresponds to a batch-delete endpoint. The user selects one or more messages and deletes them at once. This requires composite authorization: one authorization check per message. It's modeled as a single action in Cedar, but the API models it as a batch action.

**HTTP request:**
```
DELETE /messages?messagelist=msg-043,msg-044,msg-045
```

**Resource slice:** For each message in the list, you need the message entity and its parents. You then issue one authorization call per message.

**IsAuthorized request (per message):**

```
// For each message in the list, authorize:
principal = EmailApp::User::"alice"
action    = EmailApp::Action::"deleteEmailMessage"
resource  = EmailApp::EmailMessage::"msg-043"   // ...repeated for msg-044, msg-045
entities  = principalSlice + resourceSlice
```

Where the resource slice for each message is:

```json
[
    {
        "uid": { "type": "EmailApp::EmailMessage", "id": "msg-043" },
        "attrs": { "subject": "Welcome email", "recipientCount": 1000 },
        "parents": [
            { "type": "EmailApp::EmailCampaign", "id": "campaign-001" },
            { "type": "EmailApp::Tenant", "id": "acme" }
        ]
    },
    {
        "uid": { "type": "EmailApp::EmailCampaign", "id": "campaign-001" },
        "attrs": { "name": "Spring Sale", "status": "active" },
        "parents": [
            { "type": "EmailApp::Tenant", "id": "acme" }
        ]
    },
    {
        "uid": { "type": "EmailApp::Tenant", "id": "acme" },
        "attrs": {},
        "parents": []
    }
]
```

We can make performance optimizations in this case. For example, we might allow batch-deleting only if all the emails belong to the same campaign. We can then fetch all the email messages in parallel, then validate that they all belong to the same campaign id, then only fetch the campaign and tenant one time.

If the request comes in trying to delete three messages and the request is valid, we will call cedar three times. Each response tells you which specific messages the principal is authorized to delete — your application can then proceed with only those deletions, or reject the entire request if any are denied.

### Summary

| HTTP endpoint | Authorization pattern | Slices fetched |
|---|---|---|
| `POST /login` | Open endpoint | principalSlice + applicationSlice |
| `POST /signup` | Open endpoint | principalSlice + applicationSlice |
| `GET /dashboard-data` | Implicit-scope endpoint | principalSlice + applicationSlice |
| `POST /tenants/:id/campaigns` | Resource creation | principalSlice + tenantSlice |
| `GET /tenants/:id/campaigns` | Resource listing | principalSlice + tenantSlice |
| `GET /campaigns/:id` | Single-resource RUD | principalSlice + emailCampaignSlice |
| `PUT /campaigns/:id` | Single-resource RUD | principalSlice + emailCampaignSlice |
| `DELETE /campaigns/:id` | Single-resource RUD | principalSlice + emailCampaignSlice |
| `POST /campaigns/:id/messages` | Resource creation | principalSlice + emailCampaignSlice |
| `GET /campaigns/:id/messages` | Resource listing | principalSlice + emailCampaignSlice |
| `GET /messages/:id` | Single-resource RUD | principalSlice + emailMessageSlice |
| `PUT /messages/:id` | Single-resource RUD | principalSlice + emailMessageSlice |
| `DELETE /messages?messagelist=...` | Batch RUD | principalSlice + emailMessageSlice (per message) |

This application has **13 HTTP endpoints** but only **5 slice builders**:

1. `principalSlice` — fetches the user, their roles, and their tenant
2. `applicationSlice` — a synthetic entity constructed in code (no DB fetch needed)
3. `tenantSlice` — fetches the tenant
4. `emailCampaignSlice` — fetches the campaign and its parent tenant (can potentially reuse tenantSlice)
5. `emailMessageSlice` — fetches the message, its parent campaign, and the tenant (can potentially reuse emailCampaignSlice)

Every authorization request in the application is composed by combining the principal slice with one of the three resource slices. The authorization pattern determines which resource slice to use.
