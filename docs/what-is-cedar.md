---
layout: default
title: What is Cedar?
nav_order: 2
---

# What is the Cedar policy language?<a name="what-is-cedar"></a>
{: .no_toc }

This guide is a reference for Version 2.0 of the Cedar policy language.

Cedar is a language for writing authorization policies and making authorization decisions based on those policies. When you create an application, you need to ensure that only authorized users can access the application, and can do only what each user is authorized to do.

Cedar is the policy language used by [several AWS authorization services](#related-services). By using one of these services in your application, you offload the authorization decisions from your application and separate the business logic behind your authorization decisions from your code. In your application's code, you preface requests made to your operations with a call to the authorization service, asking "Is this request authorized?". Then, the application can either perform the requested operation if the decision is "allow", or return an error message if the decision is "deny".

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Overview<a name="cedar-overview"></a>

To make secure authorization decisions that you can trust, Cedar uses the following elements:
+ **Authorization policies** – Policies describe who \(the ***principal***\) is allowed to perform which ***actions***, on which ***resources***, and in what ***context***. For example, a policy might state that only members of the `janeFriends` group \(the principal\) can view and comment \(the action\) on the photos in the `janeVacation` album \(the resource\). Another example policy might state that only the employees of a company \(the principals\) can read \(the actions\) only their own Human Resources records \(the resources\), and only during regular business hours \(the context\). Another policy for a medical application might state that only a doctor currently associated with a patient can create a referral to a different doctor. For more information, see [Policy](terminology.md#term-policy) in [Cedar terms and concepts](terminology.md).
+ **Schema** – Schema defines the types of entities recognized by the application. These entities consist of the same principals, resources, and actions referenced in policies. For example, in a media sharing application, the schema might define a "user" and the concept of nested "groups" that a user can belong to. It might also define a "photo" and the concept of nested "albums" that can contain photos. Each principal and resource can also have properties defined, such as Name, Address, Age, and any other properties relevant to the scenario. Finally, the schema lets you define the actions that your application supports. Cedar doesn't use the schema during the evaluation of requests. Instead, it uses the schema to validate the policies only when you create or update them. This approach helps ensure that your validation decisions are based on correctly designed policies that reflect your intentions for the application. For more information, see [Schema](terminology.md#term-schema) in [Cedar terms and concepts](terminology.md).
+ **Entities** – The specific entities that relate to the authorization decision you want to evaluate. For example, for a query to find out if `User::jane` is allowed to perform `Action::viewPhoto` on the `Photo::GoldenGateBridge.jpg`, then Cedar must have access to all of those entities and any related entities. This should include any groups that Jane is a member of, and the albums that contain the specified picture. The query must also have access to all of those entities' attributes. This collection of information about the relevant entities is called the *entity slice* and must be provided to Cedar as part of the request, along with the policies to evaluate.
+ **Context** – Additional information representing transient data that Cedar policies can include in the evaluation decision. This information can include session-specific elements, such as the time the request was made, the IP address the request was sent from, and whether the user authenticated using multi-factor authentication \(MFA\) when signing in. Policies can use these elements to support requirements such as only allowing access during business hours, only allowing access from a recognized address in the company network's IP address range, or allowing sensitive administrator operations only when the user authenticated with MFA.

Cedar evaluates each request against the provided policies to make an allow or deny decision. The policies are completely separate from your application's code. This design ensures that your security team can update permissions for your application without having to touch the application's code. No compiling is required. A change to a policy results in an immediate change in the logic used to authorize requests. 

## Are you a first-time Cedar user?<a name="first-time-user"></a>

If you are a first-time user of Cedar, we recommend that you begin by reading the following sections:
+ Review and become familiar with the [terms and concept associated with Cedar](terminology.md).
+ Review and become familiar with the [scenario upon which the examples in this guide are based](scenario.md).
+ Learn [basic Cedar policy syntax and its construction](syntax-policy.md).
+ Learn how to [define a Cedar schema that can validate your policies](schema.md) and ensure you're getting the evaluation results you intend.

## Features of Cedar<a name="feature-overview"></a>

Cedar provides several important features.

### Policy-based<a name="policy-based"></a>

Cedar policies are written as rules that specify the conditions under which access to resources is to be allowed or denied. You define a policy as a set of statements that include conditions that evaluate the attributes of the requester, the resource being accessed, and the context of the request.

### Supports attributes on entities and sessions <a name="attribute-based"></a>

Cedar policies can use attributes, which are key-value pairs that represent various aspects of the principal, the resource, and the caller's current session which defines the context of the request. Attributes can include information such as user roles, resource types, time of day, location, and any other relevant contextual information.

### Expressive<a name="feature-expressive"></a>

Cedar is a simple yet expressive language that is designed to support common authorization use cases, such as role-based access control \(RBAC\) and attribute-based access control \(ABAC\). The language supports logical operators such as AND, OR, and NOT on Boolean values, in addtition to common operators on other types, such as comparison operators on integers. This broad set of operators helps provide fine-grained control over access decisions.

### Policies are separate from your application's code<a name="feature-dynamic"></a>

The Cedar evaluation engine evaluates policies dynamically. This design supports making changes in access control requirements that take effect immediately, and without requiring system-wide updates or downtime. This approach helps you to quickly and easily adapt to changing business rules or environmental conditions.

### High performing<a name="feature-performant"></a>

Cedar is fast and scalable. The policy structure allows your policies to be indexed for quick retrieval. The design also supports fast, scalable, real-time evaluation with bounded latency.

### Human-readable<a name="feature-readable"></a>

Cedar policies are designed to be easy to read and understand, making them accessible to both technical and non-technical stakeholders involved in defining access control policies. This helps facilitate collaboration and communication among different stakeholders in a distributed system.

## Services that use Cedar<a name="related-services"></a>

The following AWS services use Cedar as their authorization policy language. For more information about how each service uses Cedar, and any service-specific considerations, see the documentation for each service.
**Amazon Web Services \(AWS\)**
+ **Amazon Verified Permissions** – Verified Permissions provides authorization and permissions management as a service that you use when you write your own custom applications. You can define a schema that fully describes your principals and resources, and the actions that the principals can perform on the resources. Then, you can define Cedar policies that provide granular permissions, fully controlling which principals can perform which actions against which resources and under which conditions. For more information, see the [Amazon Verified Permissions User Guide](https://docs.aws.amazon.com/verified-permissions/latest/userguide/).
+ **AWS Verified Access** – With AWS Verified Access, you can provide secure access from your devices to your applications without requiring the use of a virtual private network \(VPN\). Verified Access evaluates each incoming application request and helps ensure that users and the devices they use can access each application only when they meet the specified security requirements. For more information, see the [AWS Verified Access User Guide](https://docs.aws.amazon.com/verified-access/latest/ug/).
