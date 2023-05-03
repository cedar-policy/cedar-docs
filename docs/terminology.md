---
layout: default
title: Terms & concepts
nav_order: 3
---

# Cedar terms and concepts<a name="terminology"></a>
{: .no_toc }

Cedar manages fine-grained permissions to support the authorization requirements for custom applications. To create Cedar policies successfully, you should understand the following concepts.

<details markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Authorization<a name="term-authorization"></a>

*Authorization* is the process of determining if a specific user request to do something is allowed by the defined set of [policies](#term-policy). Authorization works by evaluating each incoming request against the set of policies provided to Cedar.

Authorization is preceded by *authentication*. Authentication is the process of verifying the principal's identity meaning that they are really who they claim to be. Authentication can involve user names, passwords, multi-factor authentication \(MFA\) devices, or other means of proving identity. Once authenticated, a user or device becomes a *principal* that can make a request. 

Cedar lets you describe permissions by creating [policies](#term-policy) as text documents that describe which principals are allowed to perform which *actions*, on which *resources*, and in a specific *context*. 

When a principal attempts to do something in an application, the application generates an authorization request. Cedar [evaluates](#term-policy-evaluation) requests against the set of defined policies. Each evaluation results in a decision to **allow** or **deny** the request. 

## Policy<a name="term-policy"></a>

A policy is a statement that declares which principals are explicitly permitted, or explicitly forbidden, to perform an action on a resource. The collection of policies together define the authorization rules for your application.

A policy begins by specifying the ***effect***, to either `permit` or `forbid` any requests that match the scope and conditions specified in the policy.

The ***scope*** identifies the specific *principal* and *resource* to which the policy applies, and the *actions* that the principal can perform on the resource. The scope is mandatory. 

Optionally, you can specify ***conditions*** that must be true for the policy to affect the request. These conditions take the form of `when` and `unless` clauses that evaluate the attributes of the principals, resources, and other elements that make up the context of the request. Conditions can check things like the value of tags attached to the principal and resource, the time of day the request is made, or the IP address from which the request is sent. 

In Cedar, you can create a policy in one of two ways:
+ **Static policies** – Standalone, complete policies that require no additional processing and are ready to be used in authorization decisions by Cedar. For more information about creating a static policy, see [Basic policy construction](syntax-policy.md).
+ **Template-linked policies** – Policies created from [a policy template](#term-policy-template). This policy type consists of a template that has placeholders for the principal, resource, or both. The template is completed by replacing the placeholders with specific values. This completed template results in a template-linked policy that can be evaluated at run time like a static policy.

You can use a variety of strategies to construct the policies. Some of the common strategies are the following:
+ **[Role-based access control \(RBAC\)](https://wikipedia.org/wiki/Role-based_access_control)** – Cedar lets you define roles that are associated with a set of permissions. These roles can then be assigned to one or more identities. Each assigned identity acquires the permissions associated with the role. If the permissions associated with a role are modified, it automatically impacts any identity assigned to that role. Cedar supports RBAC decisions by using [groups](#term-group) for your principals.
+ **[Attribute-based access control \(ABAC\)](https://wikipedia.org/wiki/Attribute-based_access_control)** – Cedar uses the attributes attached to the principal and the resource to determine the permissions. For example, a policy can state that all users that are tagged as the owner of a resource automatically have access. A different policy could state that only users that are members of the HR department can access resources that are tagged as HR resources.

## Policy evaluation<a name="term-policy-evaluation"></a>

An authorization request is a request by an application for an authorization decision, asking the question '*can this principal take this action on this resource in this context?*’. To reach the decision, Cedar evaluates a request against each [policy](#term-policy). That evaluation produces one of the following intermediate results:
+ **Allow** – the evaluated policy is a `Permit` policy. All elements in the scope matched the request. All `when` conditions evaluated to `true` and all `unless` conditions evaluated to `false`. This is an *explicit* Allow.
+ **Deny** – the evaluated policy is a `Forbid` policy. All elements in the scope matched the request. All `when` conditions evaluated to `true` and all `unless` conditions evaluated to `false`. This is an *explicit* Deny.
+ **No result** – either one or more elements in the scope or one or more context conditions failed to match the request. In this case, this policy doesn't contribute to the final, overall decision. Other policies that exist in the policy store determine whether the final result of the evaluation is allow or deny.

Cedar combines the intermediate results into a final result as determined by applying these rules:

1. The evaluation begins with a default implicit Deny. If nothing overrides this in steps 2 or 3, Deny becomes the final result in step 4.

1. If ***any*** matching policy evaluates to an *explicit* Deny, then the final result is **Deny**. A single explicit Deny result ***always*** overrides any number of Allow results.

1. If ***at least one*** matching policy evaluates to an explicit Allow ***AND*** ***no*** policy evaluates to an explicit Deny, then the final result is **Allow**. An explicit Allow overrides the default implicit Deny.

1. If no policy evaluates to Allow, then the final result is the default implicit **Deny**. 

Your application must gather all of the relevant information and provide it to the Cedar for a decision. You provide this information in two parts:
+ All of the details about the principal and resource entities must be provided to Cedar as the *slice*. The slice is the set of policies and entity data that are relevant to the request. For example, for a request to authorize a user named Juan to access a shared photo, the slice must include a list of the groups that Juan is a member of, the folder hierarchy where the photo resides, and any other relevant attributes of the user and photo. For example, in Verified Permissions, you provide this in the `SliceComplement` parameter of an [IsAuthorized](https://docs.aws.amazon.com/verified-permissions/latest/apireference/API_IsAuthorized.html) operation.
+ Other details that might be useful to the decision, such as the IP address of the requesting computer and the list of valid IP ranges that make up the company's internal network, or whether the user authenticated using a multi-factor authentication \(MFA\) device. This additional information is called the *context*. For Verified Permissions, you provide this as the `Context` parameter of the [IsAuthorized](https://docs.aws.amazon.com/verified-permissions/latest/apireference/API_IsAuthorized.html) operation. These details can be accessed by the `when` and `unless` clauses of a policy.

All of the policies that match any one or more of the principal, action, or resource are called the ***applicable policies*** and must be included in the slice, along with all of the relevant entities, for the evaluation to return the expected results. If the request is for `User::"bob"` to perform `Action::"readFile"` on resource `File::"vacationPhoto.jpg"`, then only policies that reference those entities need to be included in the slice provided for evaluation. A policy that allows Alice to write to a different file isn't applicable to the request and therefore doesn't need to be included in the slice.

The evaluation results in an ***authorization response*** that consists of the decision \(Allow or Deny\), and the list of ***determining policies*** that resulted in the allow or deny decision returned by Cedar.

For example, consider the following set of policies:
+ **P1**: Jane can perform any action on photo `vacation.jpg`.

  ```
  permit( 
      principal == User::"jane", 
      action, 
      resource == Photo::"vacation.jpg"
  )
  ```
+ **P2**: Kevin has a group `kevinFriends` that can view any of Kevin's photos when they are tagged `Holiday`

  ```
  permit(
      principal in UserGroup::"kevinFriends",
      action == Action::"ViewPhoto",
      resource
  )
  when {
      resource.tags.contains("Holiday")
  }
  ```
+ **P3**: Users are forbidden to view photos tagged Private, unless they are the owner of the photo

  ```
  forbid(
      principal,
      action == Action::"ViewPhoto",
      resource
  )
  when { resource.tags.contains("private") }
  unless { principal == resource.owner }
  ```
+ **P4**: Users can perform `UpdatePassword` for an `Account` when they are the owner of the account 

  ```
  permit(
      principal,
      action == Action::"UpdatePassword",
      resource
  )
  when { principal == account.owner }
  ```

With this set of policies, Cedar can evaluate the request "can the user `jane` perform the action `View` on the photo `vacation.jpg`?" This example assumes that the slice includes the following details about the entities:
+ `jane` is a member of the group `kevinsFriends`
+ The photo vacation.jpg is:
  + Owned by `kevin`
  +  ***Not*** tagged `Holiday`
  + Tagged `Private`

In this example scenario, P1, P2, and P3 are all considered **relevant** and should be included in the slice provided to Cedar because they all relate to `jane` viewing `vacation.jpg`.

P1 and P3 are **applicable policies** because the policy scopes match, and the `when` and `unless` clauses match the context of the authorization request. P2 is not **applicable** because the photo is not tagged `Holiday`.

Cedar returns P3 as the **determining policy** because it results in an explicit Deny that overrides the Allow from P1. The final response is **Deny**.

## Policy template<a name="term-policy-template"></a>

A policy template is a policy that has a placeholder for either the principal, the resource, or both. A policy template is useful when you have a common pattern for access that you need to apply to many resources, or many principals. You can't use a template in an authorization decision directly. Instead, you first associate a principal and resource with the template to create a template-linked policy that is complete and usable for authorization decisions.

For example, a policy template might allow commenting on any photo in an album unless that photo is tagged "private". Instead of having to manually duplicate such a policy statement in a policy for every user who accesses the album, you can create a policy template. 

A policy created from a policy template is called a template-linked policy. When you create a template-linked policy, you associate the policy template with the principal who needs access to the resource. Template-linked policies are dynamic; if you ever change the policy statement in a policy template, all policies created from that policy template automatically use the new policy statement in all authorization decisions from that moment on. This is useful when you need to apply the same permissions to many principal and resource pairs.

For more information about creating and using policy templates, see [Cedar policy templates](templates.md).

## Entity<a name="term-entity"></a>

A [principal](syntax-policy.md#term-parc-principal), an [action](syntax-policy.md#term-parc-action), or a [resource](syntax-policy.md#term-parc-resource) that is part of your application are all represented in Cedar as *entities*. 

An entity in Cedar specifies a type, such as `User`, `Photo`, `Album`, `Group`, or `Account`. You can define whatever entity types that are required by your application scenario.

Entities have attributes that describe the entity in some way. For example, an entity of type `Photo` might contain attributes like a `name` \(a [string](syntax-datatypes.md#datatype-string)\), a `createdDate` \(a string containing a date\), a `location` \(a [set](syntax-datatypes.md#datatype-set) of type [Decimal](syntax-datatypes.md#datatype-decimal) that represent coordinates\), and the `photographer` \(a reference to another entity representing the user who took the photo\). Define the attributes that are useful to your scenario.

For more details about entities, see [Entity](syntax-entity.md) in the [Cedar syntax - elements of the policy language](syntax.md) section of this guide.

## Groups and hierarchies<a name="term-group"></a>

You can represent a group in Cedar by adding a `parent` attribute to an entity. All entities with the same parent can be considered members of that group. If you have an entity "A" that has a parent entity "B", then you can say that A is a member of B. 

Because a group can include other groups as members, you can use groups to model a multi-tiered hierarchy; you're not limited to the generic concept of a group with a single collection of members. 

In addition to the expected `User` as a member of a `UserGroup` for principals, you can also apply this to your resource types. For example, you can mimic the `File` in a `Folder` paradigm, with folders nested in other folders. It can also apply to actions, where an action like `viewPhoto` can be classified as a member of the `ReadOnly` actions collection.

You can use the [in](syntax-operators.md#operator-in) operator in a policy condition to check whether one entity has another entity in its hierarchy. For example, the following policy snippet uses the `in` operator twice to allow any user who is a member of `Group::"janeFriends"` to view any photo that is part of `Album::"janeTrips"`.

```
permit(
    principal in Group::"janeFriends",
    action in Action::"view",
    resource in Album::"janeTrips"
);
```

## Schema<a name="term-schema"></a>

A schema is a declaration of the structure of the entity types supported by your application and for which you want Cedar to provide authorization services. Cedar uses [JSON](https://json.org) to define a schema. You can use the schema to define the principals, resources, and actions used by your application. Each definition specifies the structure of the entity that your application recognizes. For example, a resource of type `Photo` could be defined to include both `Name` attribute that is a [string](syntax-datatypes.md#datatype-string), and a `LocationTaken` attribute that is a [record](syntax-datatypes.md#datatype-record). That record could include `Latitude` and `Longitude` values that are both [decimal](syntax-datatypes.md#datatype-decimal).

Cedar can use the schema to validate your authorization policies. Validation helps ensure that you don't create a policy that references an entity or attribute one way, and then reference that entity or attribute in a different way when you make authentication requests later. It also ensures that you use the right data types. For example, if the `Age` attribute is defined in your schema as type [Long](syntax-datatypes.md#datatype-long), then the following line in a policy submitted to Cedar for validation generates an error.

```
unless { principal.Age > "21" }
```

Cedar knows from the schema that the `Age` attribute is type Long, and also knows that digits with quotes around them are always of type String. This line fails validation because the [> comparison operator](syntax-operators.md#operator-greaterthan) works only with `Long` values and can't compare with a `String`. If you remove the quotes from around the `21` and resubmit the policy, Cedar successfully validates the policy.

Cedar doesn't require you to define a schema, but if you don't then Cedar doesn't have a way to ensure that the policies adhere to your intentions. If the structure or type of the entity or attribute inferred by a policy doesn't match the structure or type of the entity or attribute inferred by the parameters of an authorization request, then Cedar can generate errors or return incorrect authorization results. Because of this, we recommend that you create schemas for your applications.

When you submit policies to Cedar, validation can be performed in either Strict or Permissive mode. Strict mode is the default. Strict mode rejects policies for a wider array of errors than permissive mode. For example, consider the following clause snippet:

```
if ... then principal else resource
```

Strict mode requires that the `principal` and `resource` must be same type, while permissive mode accepts a policy where they are of different types.

For details about the syntax required to define a schema, see [Cedar schema format](schema.md).