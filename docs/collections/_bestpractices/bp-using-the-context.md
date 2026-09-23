---
layout: default
title: Using the context
nav_order: 13
---

# Best practice: Don't use the context field to hold information about the principal, action, and resource
{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

Cedar policy statements include four variables named principal, action, resource, and context. Each variable should be used for its purpose. For example, information about the resource should not be populated in the principal.

We recommend that you avoid using the context field to store information that is more naturally associated with the principal or resource. The context field is intended for information unique to a particular request, such as http headers, time of day, the caller's authentication or device posture, or information about the request parameters.

In addition, context can be used for information that is not naturally affiliated with other entities, such as whether an open support case exists that allows the principal to act upon the resource.

## When context IS the right choice

### Action-specific request data

Context is most useful for data that is specific to *this instance* of an action — information that characterizes the request itself rather than the principal or resource. For example, if a user is sharing a folder with another user, the identity of the recipient is a property of the request, not of the principal or the resource:

```
principal  = MyApp::User::"alice"
action     = MyApp::Action::"shareDriveFolder"
resource   = MyApp::Drive::"alice/documents/designs"
context    = {
    "sharingWith": {
        "type": "MyApp::User",
        "id": "bob"
    }
}
entities   = [
    MyApp::User::"alice",    // ...and alice's parents
    MyApp::User::"bob",      // ...and bob's parents
    MyApp::Drive::"alice/documents/designs"
]
```

A policy can then reference the context to make decisions about the sharing target:

```cedar
// Allow sharing with anyone in the same department
permit(
    principal,
    action == MyApp::Action::"shareDriveFolder",
    resource
)
when {
    context.sharingWith in MyApp::Department::"engineering"
};
```

Notice that the recipient entity (`MyApp::User::"bob"`) is included in the entities list so that the authorization engine can resolve its group memberships and attributes. The context provides the *reference* to the entity; the entities list provides the data needed to evaluate policies against it.

### Agents acting on behalf of a principal

If your application involves agents (automated systems, service accounts, or AI assistants) acting on behalf of a user, the context can help model this relationship. There are two valid patterns depending on your authorization needs:

**Pattern 1: Agent as principal, user in context.** Use this when the agent's own permissions matter — for example, when you want to restrict what actions an agent is allowed to perform regardless of who it's acting for.

```
principal  = MyApp::Agent::"scheduling-bot"
action     = MyApp::Action::"createMeeting"
resource   = MyApp::Calendar::"alice/work"
context    = { "onBehalfOf": { "type": "MyApp::User", "id": "alice" } }
```

**Pattern 2: User as principal, agent in context.** Use this when the user's permissions are what matter, but you want policies that can restrict or audit which agents are allowed to act on their behalf.

```
principal  = MyApp::User::"alice"
action     = MyApp::Action::"createMeeting"
resource   = MyApp::Calendar::"alice/work"
context    = { "viaAgent": { "type": "MyApp::Agent", "id": "scheduling-bot" } }
```

Choose the pattern based on which entity's permissions should be the primary authorization decision. In either case, include both the agent and the user in the entities list so their attributes and group memberships are available for policy evaluation.
