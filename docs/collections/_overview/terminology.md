---
layout: default
title: Terms & concepts
nav_order: 3
---

# Cedar terms and concepts {#terminology}
{: .no_toc }

Cedar manages fine-grained permissions to support the authorization requirements for custom applications. To create Cedar policies successfully, you should understand the following concepts.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Authorization {#term-authorization}

*Authorization* is the process of determining if a specific user request to do something is allowed by the defined set of [policies](#term-policy). Authorization works by evaluating each incoming request against the set of policies provided to Cedar.

Authorization is preceded by *authentication*. Authentication is the process of verifying the principal's identity, meaning that they are really who they claim to be. Authentication can involve user names, passwords, multi-factor authentication \(MFA\) devices, or other means of proving identity. Once authenticated, a user or device becomes a *principal* that can make a request.

Cedar lets you describe permissions by creating [policies](#term-policy) as text documents that describe which principals are allowed to perform which *actions*, on which *resources*, and in a specific *context*.

When a principal attempts to do something in an application, the application generates an authorization request. Cedar [evaluates](#term-policy-evaluation) requests against the set of defined policies, producing a decision to **allow** or **deny** the request.

The following are a few common strategies for implementing authorization:

+ **[Role-based access control \(RBAC\)](https://wikipedia.org/wiki/Role-based_access_control)** – Cedar lets you define roles that receive a set of permissions granted by associating policies with the role. These roles can then be assigned to one or more identities. Each assigned identity acquires the permissions granted by the policies associated with the role. If the policies associated with a role are modified, it automatically impacts any identity assigned to that role. Cedar supports RBAC decisions by using [groups](#term-group) for your principals.
+ **[Attribute-based access control \(ABAC\)](https://wikipedia.org/wiki/Attribute-based_access_control)** – Cedar uses the attributes attached to the principal and the resource to determine the permissions. For example, a policy can state that all users that are tagged as the owner of a resource automatically have access. A different policy could state that only users that are members of the Human Resources (HR) department can access resources that are tagged as HR resources.

## Policy {#term-policy}

A policy is a statement that declares which principals are explicitly permitted, or explicitly forbidden, to perform an action on a resource. The collection of policies together define the authorization rules for your application.

A policy begins by specifying the ***effect***, to either `permit` or `forbid` any requests that match the scope and conditions specified in the policy.

The ***scope*** identifies the specific *principal* and *resource* to which the policy applies, and the *actions* that the principal can perform on the resource. The scope is mandatory.

Optionally, you can specify ***conditions*** that must be true for the policy to affect the request. These conditions take the form of `when` and `unless` clauses that evaluate the attributes of the principals, resources, and other elements that make up the context of the request. Conditions can check things like the value of tags attached to the principal and resource, the time of day the request is made, or the IP address from which the request is sent.

In Cedar, you can create a policy in one of two ways:

+ **Static policies** – Standalone, complete policies that require no additional processing and are ready to be used in authorization decisions by Cedar. For more information about creating a static policy, see [Basic policy construction](../policies/syntax-policy.html).
+ **Template-linked policies** – Policies created from [a policy template](#term-policy-template). This policy type consists of a template that has placeholders for the principal, resource, or both. The template is completed by replacing the placeholders with specific values. This completed template results in a template-linked policy that can be evaluated at runtime like a static policy.

## Policy evaluation {#term-policy-evaluation}

An authorization request is a request by an application for an authorization decision, asking the question "*Can this principal take this action on this resource in this context?*". To reach the decision, Cedar's authorization engine evaluates a request against each [policy](#term-policy), and combines the results. It ultimately produces an ***authorization response*** that consists of the decision (`Allow` or `Deny`), and the list of ***determining policies*** that are the reasons for that decision.

Your application must gather all of the relevant information and provide it to Cedar's authorization engine when making the request.

+ All of the details about the principal and resource entities. These details must include all of the entity data that are relevant to the request. For example, for a request to authorize a user named Juan to access a shared photo, the request must include the entities for the groups that Juan is a member of, the folder hierarchy where the photo resides, and any other relevant attributes of the user and photo.
+ Other details that are useful to the decision, including the transient or session-specific details, such as the IP address of the requesting computer and the list of valid IP ranges that make up the company's internal network, or whether the user authenticated using a multi-factor authentication \(MFA\) device. This additional information is called the *context*.
+ All of the policies that match any one or more of the principal, actions, and the resource specified in the request. We recommend that you include all policies to avoid the risk of missing a relevant policy.

The algorithmic details for how authorization decisions are made, and how individual policies are evaluated, are discussed in the [authorization](../auth/authorization.html) section of these docs.

## Policy template {#term-policy-template}

A policy template is a policy that has a placeholder for either the principal, the resource, or both. A policy template is useful when you have a common pattern for access that you need to apply to many resources, or many principals. You can't use a template in an authorization decision directly. Instead, you first associate a principal and resource with the template to create a template-linked policy that is complete and usable for authorization decisions.

For example, a policy template might allow commenting on any photo in an album unless that photo is tagged "Private". Instead of having to manually duplicate such a policy statement in a policy for every user who accesses the album, you can create a policy template.

A policy created from a policy template is called a template-linked policy. When you create a template-linked policy, you associate the policy template with the principal who needs access to the resource. Template-linked policies are dynamic. When you change the policy statement in a policy template, all policies created from that policy template use the new policy statement automatically in all authorization decisions from that moment on. This capability is useful when you need to apply the same permissions to many principal and resource pairs.

For more information about creating and using policy templates, see [Cedar policy templates](../policies/templates.html).

## Entity {#term-entity}

A [principal](../policies/syntax-policy.html#term-parc-principal), an [action](../policies/syntax-policy.html#term-parc-action), or a [resource](../policies/syntax-policy.html#term-parc-resource) that is part of your application are all represented in Cedar as *entities*. The shape of entities is defined in the [schema](../schema/schema.html) of your application

Entities are referenced by their type and identifier, together called the entity's *unique identifier* (UID). For example, `User::"jane"`, `Action::"ViewPhoto"`, and `UserGroup::"kevinFriends"` are all UIDs. Here, `User`, `UserGroup`, and `Action` are entity types, and `"jane"`, `"kevinFriends"`, and `"viewPhoto"` are entity identifiers. The `Action` entity type is specially reserved for use with actions, but otherwise you can define whatever entity types are required by your application scenario.

Entities have attributes that corespond to information that's known, such as information that's stored in a database. For example, an entity of type `Photo` might contain attributes like the following:

+ A `name` \(a [string](../policies/syntax-datatypes.html#datatype-string)\)
+ A `createdDate` \(a string containing a date\)
+ A `location` \(a [set](../policies/syntax-datatypes.html#datatype-set) of type [Decimal](../policies/syntax-datatypes.html#datatype-decimal) that represent coordinates\)
+ The `photographer` \(a reference to another entity representing the user who took the photo\).

When creating entities, you should define the attributes that are useful to your scenario.

For more details about entities, see [Entity](../policies/syntax-entity.html) in [Cedar syntax - elements of the policy language](../policies/syntax.html).

## Namespaces {#term-namespaces}

As software products increase in size and organizations grow, multiple services can be added to contribute to the overall implementation of an application or product portfolio. You can see this outcome happening when vendors offer several products to customers, or alternatively, in service meshes where multiple services contribute portions of an application.

When this situation occurs, Cedar entity definitions can become ambiguous. For example, consider a vendor that offers both a hosted database product and a hosted furniture design service. In this environment, a Cedar action entity such as `Action::"createTable"` is ambiguous; it could be about creating a database table or a new piece of furniture. Similarly, an entity UID such as `Table::"0d6169ca-b246-43a7-94b9-8a68a9e8f8b3"` could refer to either product.

This ambiguity can become an issue in circumstances such as the following:

+ When both services store their Cedar policies in a single policy store.
+ If policies are later aggregated into a central repository to explore cross-cutting questions about a customer’s access permissions throughout the portfolio of services.

To resolve this ambiguity, you can add *namespaces* to Cedar entities, including actions. A namespace is a string prefix for a type, separated by a pair of colons \(`::`\) as a delimiter.

```cedar
Database::Action::"createTable"
Database::Table::"c7b981f1-97e4-436b-9af9-21054a3b30f1"
Furniture::Action::"createTable"
Furniture::Table::"c7b981f1-97e4-436b-9af9-21054a3b30f1"
```

Namespaces can also be nested to arbitrary depth.

```cedar
ExampleCo::Database::Table::"c7b981f1-97e4-436b-9af9-21054a3b30f1"
ExampleCo::Furniture::Table::"c7b981f1-97e4-436b-9af9-21054a3b30f1"
ExampleCo::This::Is::A::Long::Name::For::Something::"12345"
```

## Groups and hierarchies {#term-group}

You can represent a group in Cedar by adding a [parent](../auth/entities-syntax.html) object when declaring an entity. All entities with the same parent can be considered members of that group. If you have an entity "A" that has a parent entity "B", then you can say that A is a member of B.

Because a group can include other groups as members, you can use groups to model a multi-tiered hierarchy. You're not limited to the generic concept of a group with a single collection of members.

In addition to the expected `User` as a member of a `UserGroup` for principals, you can also apply this approach to your resource types. For example, you can mimic the `File` in a `Folder` paradigm, with folders nested in other folders. You can also group actions, where an action like `viewPhoto` can be classified as a member of the `readOnly` actions collection.

You can use the [in](../policies/syntax-operators.html#operator-in) operator in a policy condition to check whether one entity has another entity in its hierarchy. For example, the following policy snippet uses the `in` operator twice to allow any user who is a member of `Group::"janeFriends"` to view any photo that is part of `Album::"janeTrips"`.

```cedar
permit (
    principal in Group::"janeFriends",
    action == Action::"ViewPhoto",
    resource in Album::"janeTrips"
);
```

## Schema {#term-schema}

A schema is a declaration of the structure of the entity types supported by your application, and the actions your application may provide in authorization requests. Cedar uses [JSON](https://json.org) to define a schema. You can use the schema to define the principals, resources, and actions used by your application. Each definition specifies the structure of the entity that your application recognizes. For example, a resource of type `Photo` could be defined to include both a  `Name` attribute that is a [string](../policies/syntax-datatypes.html#datatype-string), and a `LocationTaken` attribute that is a [record](../policies/syntax-datatypes.html#datatype-record). That record could include `Latitude` and `Longitude` values that are both [decimal](../policies/syntax-datatypes.html#datatype-decimal).

Cedar can use the schema to validate your authorization policies. Asking Cedar to validate your policies helps ensure that you don't create policies that reference an entity or attribute one way in the policy, and then reference that entity or attribute in a different way when you make authorization requests later. Validation also ensures that you use the right data types. For more information, see [Cedar policy validation against schema](../policies/validation.html).

For example, if the `age` attribute is defined in your schema as type [Long](../policies/syntax-datatypes.html#datatype-long), then the following line in a policy submitted to Cedar for validation generates an error.

```cedar
unless { principal.age > "21" }
```

Cedar determines from the schema that the `Age` attribute is type `Long`, and that digits with quotes around them are always of type `String`. This line fails validation because the [> comparison operator](../policies/syntax-operators.html#operator-greaterthan) works only with `Long` values and can't compare with a `String`. If you remove the quotes from around the `21` and resubmit the policy, Cedar successfully validates the policy.

Cedar doesn't require you to define a schema. However, if you don't define a schema, then Cedar doesn't have a way to ensure that the policies adhere to your intentions. If the structure or type of the entity or attribute inferred by a policy doesn't match the structure or type of the entity or attribute inferred by the parameters of an authorization request, then Cedar can generate errors or return incorrect authorization results. Because of this possibility, we recommend that you create schemas for your applications.

For details about the syntax required to define a schema, see [Cedar schema format](../schema/schema.html).
