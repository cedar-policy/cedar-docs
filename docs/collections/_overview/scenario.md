---
layout: default
title: Example scenario
nav_order: 4
---

# Cedar example scenario used in this guide<a name="scenario"></a>
{: .no_toc }

**Conventions used in this guide**  
In this guide, entity type names are always spelled using *PascalCase*, with the first letter of each word capitalized. For example, `UserGroup`.  
Individual entity and attribute names are spelled using *camelCase*, with only the first letter of the second and following words capitalized. For example, `janeFriends`.

The examples in this guide use the following hypothetical photo sharing application, called *PhotoFlash*. This application provides users with the ability to store, organize, and share their photos. Users can upload photos to their *PhotoFlash* account and organize them into albums. Albums can be nested in other albums and photos can belong to multiple albums. Users can also add custom metadata, such as the names of people visible, to each photo in the form of tags. Then, users can search for photos based on the attached metadata, such as searching for any photos that were taken after a certain date or at a certain geographic location.

*PhotoFlash* users can share their photos and albums with other *PhotoFlash* users or user groups. In the previous illustration, a user named **jane** created groups to represent her family \(`janeFamily`\), friends \(`janeFriends`\), and coworkers \(`janeCoworkers`\). She can then populate those groups with other *PhotoFlash* users, and specify how members of those groups can access her photos and albums. User groups are as flexible as albums; they can be nested, and a user can belong to multiple groups.

![\[A user named Jane has an account that contains her albums and photos, and groups of users that she created.\]](images/AVP-BASICS.jpg)

{: .important }
>This guide includes examples that use simple entity identifiers, such as `jane` or `bob` for the name of an entity of type `User`. This approach makes the examples more readable.
>
>However, in a production system, it's critical for security reasons that you use unique values that can't be reused. We recommend that you use values like [universally unique identifiers \(UUIDs\)](https://wikipedia.org/wiki/Universally_unique_identifier). For example, a user `jane` leaves the company. Later, you let someone else use the name `jane`. That new user gets access automatically to everything granted by policies that still reference `User::"jane"`. Cedar can't distinguish between the new user and the previous user.
>
> This warning applies to both principal and resource identifiers. Always use identifiers that are guaranteed unique and never reused to ensure that you don't grant access unintentionally because of the presence of an old identifier in a policy.  
>
>Where this guide does show a UUID for an entity, it also shows the entity's display name as a comment to make the policies easier to understand. For example:  
>
>```cedar
>principal == User::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE11111", // alice
>```

The photos have metadata, such as a `created` date timestamp, and each photo can optionally have user-defined tags attached, such as the tags `private`, `work`, and `fun`.

Based on group membership, Jane can allow certain users to perform specific actions on her *PhotoFlash* resources. For example, the following policy allows members of the group `janeFriends` to view and comment on any photo in the album `janeTrips`. Because the `in` operator works transitively, it also applies to any photos in albums that are nested within the album `janeTrips`. Therefore, this example also allows access to the pictures in albums `janeVacation` and `conference`.

```cedar
// Jane's friends can view all photos in her janeTrips album

permit (
    principal in Group::"janeFriends",
    action in [Action::"view", Action::"comment"], 
    resource in Album::"janeTrips"
);
```

Any action that isn't explicitly permitted is denied. You can also choose to *always* deny some actions as a matter of service-wide security or design constraints, even if a user explicitly tries to allow those actions. For example, the following policy ensures that no user other than the owner of the account that contains the resource can perform any action if that resource is tagged `private`. The following policy doesn't specify any specific principal, action, or resource. The policy matches *any* request automatically and denies access if either the `when` or `unless` expressions evaluate to `true` for that request.

```cedar
// Only the owner can access any resource tagged "private"

forbid ( principal, action, resource )
when { resource.tags.contains("private") }    // assumes that resource has "tags"
unless { resource in principal.account };     // assumes that principal has "account"
```

The order of the `when` and `unless` clauses matters in the case where one or more of them generate errors. Cedar evaluates the `when` and `unless` clauses in the order in which they appear in the policy. In the previous example, consider a scenario where the `when` and `unless` clauses generate separate errors. The order determines which error you actually see. If only one clause causes an error, the order can have an impact on the resulting evaluation, but not authorization, behavior.
