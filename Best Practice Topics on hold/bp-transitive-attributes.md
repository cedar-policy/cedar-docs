---
layout: default
title: Transitive attributes
parent: Best practices
nav_order: 7
---

# Tip: Modeling transitive attributes
{: .no_toc }

The decision between group-based or attribute-based access controls isn’t always a clear-cut dichotomy. Sometimes, it is helpful to combine both. To illustrate, consider a tree-based filesystem in which a parent folder can be labeled with an attribute such as `"visibility": "public"` that should transitively apply to all files contained within the folder:

<!--   GET THIS WORKING TO IMPROVE IMAGE

![\[Entities in a hierarchy automatically inherit the parent entity's attributes.\]](<img width="60%" src="images/transitive-attributes.png"/>)-->

![\[Entities in a hierarchy automatically inherit the parent entity's attributes.\]](images/transitive-attributes.png)

Because the attribute from the parent entity is inherited by the child entity, you can express policies like the following example.

```cedar
permit (
  principal,
  action == Action::"readFile", 
  resource
)
when {
  // This works because the attribute value from the parent Folder is transitively
  // applied to individual Files within the Folder.
  resource.visibility == "public" 
};
```

You might then ask the question "How are attribute values propagated across a hierarchy? Who does the propagation, when, and how?" The answer is that this is the role of the code that generates the who provides details about the entities to the authorization API. Recall that the entity information contains extra information about entities needed by the authorization evaluator. The extra information includes the parent-child relationships, the entity attributes, and whether to copy attribute values from a parent and inject them into child entities.

However, supporting transitive attributes can introduce complexity. One of the situations to watch for is conflicts across the inheritance space, such as nested folders, where one parent overrides the value inherited from its own parent. You have to choose whether to allow inheritance in a situation like this, and set rules that determine which attribute value is ultimately inherited by the child entity.

<!--![\[Decision about inheriting an attribute from conflicting parents.\]](<img width="60%" src="images/transitive-attributes-2.png">)-->

![\[Decision about inheriting an attribute from conflicting parents.\]](images/transitive-attributes-2.png)

Similarly, applications that allow inheritance from multiple parents at the same level must also consider conflicting values.

<!--![\[Decision about inheriting from conflicting multiple parents.\]](<img width="60%" src="images/transitive-attributes-3.png">)-->

![\[Decision about inheriting from conflicting multiple parents.\]](images/transitive-attributes-3.png)

The conflict resolution logic is an application-specific decision that depends upon the meaning of the attributes and the expectations that customers would have within the application.

While these risks are important to consider, attribute propagation remains a valid and frequently useful tool to simplify policy management, especially in situations where conflicts can be minimized and therefore the inheritance rules become trivial.
