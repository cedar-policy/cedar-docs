---
layout: default
title: Security
nav_order: 10
---

# Cedar security<a name="security"></a>
{: .no_toc }

This section provides information about security as it relates to the Cedar policy language.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Shared responsibility<a name="security-shared-responsibility"></a>

Security is a shared responsibility between Cedar and its users. It is the responsibility of Cedar to correctly evaluate policies to arrive at an authorization decision. It is the responsibility of users of Cedar to correctly define policies that implement their authorization model. Although Cedar provides tools such as the policy validator to validate your policies against the schema, it is ultimately the user's responsibility to write policies correctly.

## Security of Cedar<a name="security-cedar"></a>

It is the responsibility of Cedar to implement the Cedar policy language correctly as described in this guide.

We, members of the Cedar development team, ensure Cedar’s correctness and security by developing several artifacts:

1. **A formal model** implemented in Dafny. Dafny is an open-source, verification-aware programming language. The Dafny model consists of executable definitions of Cedar’s components which represent the semantics of Cedar, and *properties* of those components. Dafny verifies that the properties hold. It gives us confidence that our definition of the ground truth is correct.

1. **A production authorization engine** written in Rust. We use only the `safe` subset of Rust, giving us memory safety, type safety, and data-race safety.

1. **A differential testing engine** that can test automatically that \#1 and \#2 have the same semantics.

![\[How Cedar is verified as correct and secure.\]](images/security-of-cedar.png)

In particular, Cedar provides two properties about authorization queries:
+ *default-deny* &ndash; Authorization queries result in a `Deny` unless an explicit `permit` policy evaluates to `true`. 
+ *forbid-trumps-permit* &ndash; A single `forbid` policy evaluating to `true` results in a `Deny`.

## Security of applications using Cedar<a name="security-of-apps"></a>

It is the responsibility of applications using Cedar to implement their authorization logic correctly using Cedar policies. To do this, application developers must understand the semantics of Cedar policies. Developers should understand the risks associated with an incorrectly implemented authorization model and take appropriate steps to mitigate those risks. We will provide customers with tools to help them author correct and secure policies, such as policy validation, semantic analysis, and policy templates.

### Understanding Cedar semantics<a name="security-cedar-semantics"></a>

To create correct authorization policies, developers must understand the semantics of Cedar. This guide contains a detailed description of every feature of the language and how it is evaluated. It also includes several examples.

Developers must understand how the results of evaluating individual policies are combined to reach an authorization decision. In particular, note the following:
+ **default-deny** &ndash; Authorization queries will result in a `Deny` unless an explicit `permit` policy evaluates to `true`.
+ **forbid-overrides-permit** &ndash; A single `forbid` policy evaluating to true results in a `Deny`.
+ An error in a policy results in that policy being ignored for the purpose of an evaluation decision. (*skip-on-error* semantics)

### Validating your Cedar policies against your schema<a name="security-validate-against-schema"></a>

Cedar users can check that policies are consistent with a *schema*. The schema defines the expected structure and type of Cedar entities represented in requests. In particular, the schema defines the set of entity types and how they are used (as actions, principals, or resources), how entities can be grouped into a hierarchy, and what attributes the entities have. Users can validate a policy before adding it to the store. By providing a schema, policies that pass validation don't result in runtime errors when they are run against schema-compliant entities and requests.

The Cedar validator can detect the many types of bugs, including the following:
+ **Detect unrecognized entity types and actions** &ndash; For example, misspelling “Album” as “Albom” or “viewPhoto” as “viewPhoot”.
+ **Detect actions being applied to unsupported principals and resources** &ndash; For example, saying that a `Photo` can `View` a `User`.
+ **Detect improper use of *in* or *==*** &ndash; For example, writing `principal in Album::"trip"` when principal cannot be a `Photo`.
+ **Detect unrecognized attributes** &ndash; For example, referencing `principal.jobbLevel` when the attribute should be `jobLevel`.
+ **Type mismatches in attributes** &ndash; For example, `principal.hireDate + 3` (Illegal to add integers and dates)
+ **Detect optional attributes referenced without an existence check.** &ndash; For example, `principal.optionalValue < 100` instead of `principal has optionalValue && principal.optionalValue < 100`
+ **Detect invalid parameters to the constructors of extension types.** &ndash; For example, `IP("3.45.1111.43")` isn’t a valid IP address.

Writing a schema and using the policy validator can give you increased confidence that you’ve written your authorization policies correctly. It is your responsibility to write a schema that correctly models your data. It is the responsibility of Cedar to ensure that the validator is correct. We achieve a high confidence in the correctness of the validator by formally modeling it using Dafny. We have proved the correctness of the validation algorithm, and we use differential testing to ensure the production validator matches the behavior of the formal model. For more information, see [Cedar policy validation against schema](validation.md).

## Security best practices for applications using Cedar<a name="security-best-practices"></a>

Some security best practices for applications that use Cedar are as follows:

* Policies should follow the principle of least privilege. Grant only the permissions required to perform the task at hand.

* Be careful about who you allow to modify your policies. We’ve endeavored to make Cedar a safe environment in which to evaluate polcies, there are always risks when it comes to running arbitrary code submitted by users. Here is a collection of things to keep in mind if you plan on executing arbitrary cedar policies from end users.
  * Cedar has no facilities for I/O, so Cedar policies are unable to do activities like reading files or talking to the network.
  * The execution of one Cedar policy cannot effect the execution of another policy. 
  * While all Cedar policies are guaranteed to terminate, a malicious user could attempt to submit very lengthy policies, incurring either storage or performance costs. If you are executing arbitrary Cedar policies, we recommend placing a length limit on them.
  * Cedar provides on authorization &ndash; determining what an authenticated user can do. However, Cedar does ***not*** perform authentication &ndash; verifying the identity of the users who attempt to access your application. You application must provide authentication services separately and then proceed with authorization only using successfully authenticated users.

* Write a schema and have Cedar validate it to ensure your authorization policies don't encounter runtime errors.

* Put all authorization logic in your Cedar policies. Don’t spread authorization logic around different locations in your application.

* Use policy templates where applicable to avoid duplicating authorization logic. This approach also provides a single location for future changes. \(*Don’t-Repeat-Yourself*\)

* If you create policies dynamically, avoid using string concatenation. Instead, use policy templates. Creating policies with string concatenation is error-prone and insecure. If an attacker gained control of the inputs to concatenation, they could achieve code injection. 
   {: .note }
   >Here, "code injection" refers to injection of Cedar code, not arbitrary code execution. It is the responsibility of the Cedar library to prevent arbitrary code injection.
   
   For For example, consider a policy dynamically created as shown here:
   ```
   let src = "permit(" + input + ", Action::\"view\", resource) when { principal.level > 3 };"let policy = parse(src);addToPolicySet(policy);
   ```
   You could provide a good value for `input`, such as `User::"alice"`. That value works fine and produces the following policy in variable `src`.
   ```
   permit(User::"alice", Action::"view", resource) when { principal.level > 3 };
   ```
   But, if an attacker could somehow control the value for `input`, they could achieve `Cedar` code injection. For example, if the attacker set `input` to the following.
   ```
   "principal,action,resource); //"
   ```
   The completed policy in **src** would look like the following example.
   ```
   "permit(principal,action,resource); //,Action::{\"view\", resource) when { principal.level > 3 };
   ```
   That policy permits all actions on all resources by anyone, regardless of level.

* Use unique, immutable, and non-recyclable IDs for entity identifiers. An example of a mutable identifier is a username or group name in a workforce directory, where the value of the name can change. For example, consider the following policy.

   ```
   permit (principal == User::"alice",action in ...,resource in ...);
   ```

   Imagine that Alice leaves the organization, and another user named Alice joins the organization. If the new Alice reuses the "alice" username, then she would attain the permissions of any lingering policies that hadn’t been removed. 

   For these reasons, policies must refer to only *unique, normalized, immutable, and non-recyclable* identifiers. We recommend that you use UUIDs or similar formats that meet the same criteria, such as sequence numbers or URNs.

   ```
   permit (
       principal == User::"2dad2883-cba1-4a1e-b212-a6c0a5290dad", // "Alice"
       action in ...,
       resource in ...
   );
   ```

* Ensure that data used for authorization decisions, such as policies, entities, or context information, can't be accessed or modified by potential attackers.

* Normalize input data prior to invoking the authorization APIs.
