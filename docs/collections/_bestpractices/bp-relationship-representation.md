---
layout: default
title: Representing relationships
nav_order: 4
---

# Best practice: Use attributes or templates to represent relationships
{: .no_toc }

There are two main ways to express relationships between resources. When to use one or the other depends on whether or not the relation is already stored in your application database and used for other reasons such as compliance. If it is, take the [attribute-based approach](#attribute-based). If not, then take the [template-based approach](#template-based).

<details open markdown="block" id="toc">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Attribute-based relationships {#attribute-based}

Attributes can be used as an *input* to the authorization decision to represent a relationship between a principal and one or more resources.

This pattern is appropriate where the relationship is tracked and managed for purposes beyond just permissions management. For example, recording the primary account holder is required for financial compliance with *Know Your Customer* rules. Permissions are derived from these relationships. The relationship data is managed outside of the authorization system, and fetched as an input when making an authorization decision. 

The following example shows how a relationship between a user `Alice` and a number of accounts on which she is the primary account holder could be represented:

```Cedar
// Using a user attribute to represent the primary account holder relationship 
{
  "id": "df82e4ad-949e-44cb-8acf-2d1acda71798",
  "name": "alice",  
  "email": "alice@example.com",  
  "primaryOnAccounts": [
    "Account::\"c943927f-d803-4f40-9a53-7740272cb969\"",
    "Account::\"b8ee140c-fa09-46c3-992e-099438930894\""
  ]
}
```
And, subsequently using the attribute within a policy:

```Cedar
// Derived relationship permissions
  permit (
    principal,
    action in Action::"primaryAccountHolderActions",
    resource
  )when {
    resource in principal.primaryOnAccounts
  };
```

Conversely, the same relationship could be represented as an attribute on the resource called `primaryAccountHolders` that contains a set of users.

If there are multiple relationship types between principals and resources, then these should be modeled as different attributes. For example, if accounts can also have authorized signatories, and these individuals have different permissions on the account, then this would be represented as a different attribute.

In the above case, `Alice` might also be an authorized signatory on a third account. The following example shows how this could be represented:
```Cedar
// Using user attributes to represent the primary account holder and authorized signatory relationships 
{
  "id": "df82e4ad-949e-44cb-8acf-2d1acda71798",
  "name": "alice",  
  "email": "alice@example.com",  
  "primaryOnAccounts": [
    "Account::\"c943927f-d803-4f40-9a53-7740272cb969\"",
    "Account::\"b8ee140c-fa09-46c3-992e-099438930894\""
  ],
  "authorizedSignatoryOnAccounts": [
    "Account::\"661817a9-d478-4096-943d-4ef1e082d19a\""
  ]
}
```

The following are the corresponding policies:

```Cedar
// Derived relationship permissions

  permit (
    principal,
    action in Action::"primaryAccountHolderActions",
    resource
  )when {
    resource in principal.primaryOnAccounts
  };
  permit (
    principal,
    action in Action::"authorizedSignatoryActions",
    resource
  )when {
    resource in principal.authorizedSignatoryOnAccounts
  };
```
## Template-based relationships {#template-based}
If the relationship between resources exists solely for the purpose of permissions management then it’s appropriate to store this relationship as a template-linked policy, or template. You can also think of these templates as roles that are assigned on a specific resource.

For example, in a document management system, the document owner, `Alice`, may choose to grant permission to another user, `Bob`, to contribute to the document. This establishes a contributor relationship between Bob and Alice’s document. The sole purpose of this relationship is to grant permission to edit and comment on the document, and hence this relationship can be represented as a template. In these cases the recommended approach is to create a template for each type of relationship. In the following examples there are two relationship types, `Contributor` and `Reviewer`, and therefore two templates.
The following templates can be used to create template-linked policies for individual users.
```Cedar
  // Managed relationship permissions - Contributor template
  permit (
    principal == ?principal,  
    action in Action::"DocumentContributorActions",
    resource in ?resource
  );
    
  // Managed relationship permissions - Reviewer template
  permit (
    principal == ?principal,  
    action in Action::"DocumentReviewerActions",
    resource in ?resource
  );
```
The following templates can be used to create template-linked policies for groups of users. The only difference from the templates for individual users is that use of the `in` operator instead of the `==`.
```Cedar
  // Managed relationship permissions - Contributor template
  permit (
    principal in ?principal,  
    action in Action::"DocumentContributorActions",
    resource in ?resource
  );

  // Managed relationship permissions - Reviewer template
  permit (
    principal in ?principal,  
    action in Action::"DocumentReviewerActions",
    resource in ?resource
  );
```
You can then use these templates to create policies, like the following ones, representing managed relationship permissions each time access is granted to a document.
```Cedar
  //Managed relationship permissions
  permit (
    principal in User::"df82e4ad-949e-44cb-8acf-2d1acda71798",  
    action in Action::"DocumentContributorActions",
    resource in Document::"c943927f-d803-4f40-9a53-7740272cb969"
  );

  permit (
    principal in UserGroup::"df82e4ad-949e-44cb-8acf-2d1acda71798",
    action in Action::"DocumentReviewerActions",
    resource == Document::"661817a9-d478-4096-943d-4ef1e082d19a"
  );

  permit (
    principal in User::"df82e4ad-949e-44cb-8acf-2d1acda71798",
    action in Action::"DocumentContributorActions",
    resource in Folder::"b8ee140c-fa09-46c3-992e-099438930894"
  );
```
