---
layout: default
title: Minimize number of entity types
parent: Best practices
nav_order: 4
---

# Best practice: Minimize the number of entity types

{: .no_toc }

Entity types in Cedar are similar to concepts in other programming languages such as `class` or `struct`. They define the particular shape of something. For example, this guide has references sample types with names such as “User”, “File”, “Photo”, and so on.

The addition of new entity types to an application increases the complexity of the application's authorization model. This means, for example, that a new entity type can imply new resource types and new actions. It can also mean new types of principals. From the perspective of customers, auditors, security engineers, and others with a desire to deeply understand and inspect the authorization properties of an application, the creation of entity types increases the surface area for inspection. This increase can be regarded as a significant change to an application’s risk model. Entity types should be introduced when this change is justified, such as when launching new features and capabilities. 

Avoid a proliferation of entity types for other purposes. For example, Entity types should not be used as a resource-isolation mechanism by defining types such as `Account1`, `Account2`, and so on. Resource isolation can be achieved through other means, such as by using namespaces.

A common practice when choosing the granularity of an entity type is to correlate one-to-one with the source authorities. This reflects the fact that entities are often pre-existing concepts in an application, already defined and managed by existing software. These existing concepts are typically evident in data models, API definitions, source code, and so on. The lowest friction path to bring these concepts into a Cedar authorization model is to represent them as they already exist in the applcation , perhaps with filtering and normalization on attributes to construct a clean basis for authorization.
