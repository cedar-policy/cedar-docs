---
layout: default
title: What is Cedar?
nav_order: 2
---

# Welcome to the Cedar policy language {#welcome-to-cedar}
{: .no_toc }

This guide is a reference for [Version 3.0](other/doc-history.html) of the Cedar policy language.

Cedar is a language for writing authorization policies and making authorization decisions based on those policies. When you create an application, you need to ensure that only authorized users can access the application, and can do only what each user is authorized to do.

Using Cedar, you can decouple your business logic from the authorization logic. In your application's code, you preface requests made to your operations with a call to Cedar's authorization engine, asking "Is this request authorized?". Then, the application can either perform the requested operation if the decision is "allow", or return an error message if the decision is "deny".

In addition to supporting the authorization requirements for your own custom applications directly, Cedar is the policy language for several [authorization services](#related-services). These services take the separation of business logic and authorization logic one step further: The services host the Cedar policies, and provide APIs for managing those policies and carrying out authorization decisions on behalf of all of your applications. They handle the heavy lifting so your applications don't have to.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Introduction {#cedar-intro}

To make secure authorization decisions that you can trust, Cedar uses the following elements:

+ **Authorization policies** – Policies describe who \(the ***principal***\) is allowed to perform which ***actions***, on which ***resources***, and in what ***context***. For example, a policy might state that only members of the `janeFriends` group \(the principals\) can view and comment \(the actions\) on the photos in the `janeVacation` album \(the resources\). Another example policy might state that the employees of a company \(the principals\) can read \(the actions\) only their own Human Resources records \(the resources\), and only during regular business hours \(the context\). A policy for a medical application might state that only a doctor currently associated with a patient can create a referral to a different doctor. For more information, see [Policy](overview/terminology.html#term-policy) in [Cedar terms and concepts](overview/terminology.html).
+ **Entities** – Entities are application data that Cedar needs to see to make authorization decisions. For example, a request might ask if `User::"jane"` is allowed to perform `Action::"viewPhoto"` on the `Photo::"GoldenGateBridge.jpg"`. Here, `User`, `Action`, and `Photo` are all different types of entity, and the quoted strings are specific identifiers. To decide this request, Cedar's authorization engine must have access to these specific entities and any related entities, such as any groups that Jane is a member of, and any albums that contain the specified picture. The engine must also have access to all of those entities' attributes. This collection of information about the relevant entities must be provided to the authorization engine as part of the request, along with the policies to evaluate.
+ **Schema** – A schema defines the types of entities recognized by the application, and which are also the principals, resources, and actions referenced in policies. For example, in a media sharing application, the schema might define a `User` and the concept of nested "groups" that a `User` can belong to. It might also define a "photo" and the concept of nested "albums" that can contain photos. Each principal and resource can also have attributes defined, such as Name, Address, Age, and any others relevant to the scenario. Finally, the schema also defines the actions that the application supports, such as viewing photos or reading HR records. Cedar doesn't use the schema when evaluating an authorization request. Instead, it uses the schema to validate the policies only when you create or update them. This approach helps ensure that your authorization decisions are based on correctly designed policies that reflect your intentions for the application. For more information, see [Schema](overview/terminology.html#term-schema) in [Cedar terms and concepts](overview/terminology.html).
+ **Context** – The context is a part of a request that consists of transient data. The context can include session-specific elements, such as the time the request was made, the IP address the request was sent from, and whether the user authenticated using multi-factor authentication \(MFA\) when signing in. Policies can reference these elements to support requirements such as only allowing access during business hours, only allowing access from a recognized address in the company network's IP address range, or allowing sensitive administrator operations only when the user authenticated with MFA.

Cedar evaluates each request against the provided policies and entities to make an allow or deny decision. The policies are completely separate from your application's code. This design ensures that your security team can update permissions for your application without having to touch the application's code. A change to a policy can result in an immediate change in the logic used to authorize requests.

## Are you a first-time Cedar user? {#first-time-user}

If you are a first-time user of Cedar, we recommend that you begin by reading the following sections:

+ Review and become familiar with the [terms and concept associated with Cedar](overview/terminology.html).
+ Review and become familiar with the [scenario upon which the examples in this guide are based](overview/scenario.html).
+ Learn [basic Cedar policy syntax and its construction](policies/syntax-policy.html).
+ Learn how to [define a Cedar schema that can validate your policies](schema/schema.html) and ensure you're getting the evaluation results you intend.

## Resources for getting started {#additional-resources}

If you want to see Cedar in action, implement Cedar as a service, or work with an example application while you learn, check out these additional resources.

+ Build policies and experiment with Cedar authorization with the [Cedar playground](https://www.cedarpolicy.com/en/playground).
+ Set up an example application with [cedar-examples on GitHub](https://github.com/cedar-policy/cedar-examples/).
+ Create a managed Cedar policy store with [Amazon Verified Permissions](https://aws.amazon.com/verified-permissions/).
+ Join the [cedar-policy Slack](https://communityinviter.com/apps/cedar-policy/cedar-policy-language).

For more links, see [cedar-policy on GitHub](https://github.com/cedar-policy).

## Features of Cedar {#feature-overview}

Cedar provides several important features.

#### Policy-based {#policy-based}

Cedar policies are written as rules that specify the conditions under which access to resources is to be allowed or denied. You define a policy as a set of statements that include conditions that evaluate the attributes of the requester, the resource being accessed, and the context of the request.

#### Supports attributes on entities and sessions  {#attribute-based}

Cedar policies can use attributes, which are key-value pairs that represent various aspects of the principal, the resource, and the caller's current session which defines the context of the request. Attributes can include information such as user roles, resource types, time of day, location, and any other relevant contextual information.

#### Expressive {#feature-expressive}

Cedar is a simple yet expressive language that is designed to support common authorization use cases, such as role-based access control \(RBAC\) and attribute-based access control \(ABAC\). The language supports logical operators such as AND, OR, and NOT on Boolean values, in addition to common operators on other types, such as comparison operators on integers. This broad set of operators helps provide fine-grained control over access decisions.

#### Policies are separate from your application's code {#feature-dynamic}

The Cedar evaluation engine evaluates policies dynamically. This design supports making changes in access control requirements that take effect immediately, and without requiring system-wide updates or downtime. This approach helps you to quickly and easily adapt to changing business rules or environmental conditions.

#### High performing {#feature-performant}

Cedar is fast and scalable. The policy structure allows your policies to be indexed for quick retrieval. The design also supports fast, scalable, real-time evaluation with bounded latency.

#### Human-readable {#feature-readable}

Cedar policies are designed to be easy to read and understand, making them accessible to both technical and non-technical stakeholders involved in defining access control policies. This helps facilitate collaboration and communication among different stakeholders in a distributed system.

## Services that use Cedar {#related-services}

For a list of some of the services that use Cedar as their policy language, see [Cedar Integrations](https://www.cedarpolicy.com/en/integrations)
