---
layout: default
title: Policy validation
nav_order: 5
---

# Cedar policy validation against schema<a name="validation"></a>
{: .no_toc }

As with all code, it is possible to make mistakes that result in the code not behaving as expected. For example, the following is a well-formed Cedar policy according to syntax rules, but with a number of typos and type errors. This policy assumes that there is a namespace `ExampleCo` in the schema that defines the valid principals, actions, and resources. 

```
permit (
    principal == ExampleCo::Uzer::"12345",   // should be "User", not "Uzer"
    action == ExampleCo::Action::"ReadFile", // should be "readFile", not "ReadFile"
    resource == ExampleCo::User::"67890"     // "readFile" isn't a valid operation on a User
)
when {
    principal.isAcctive           // should be "isActive", not "isAcctive"
      &&
    principal.username > 2        // comparing a string against a number
};
```

Cedar can't know whether this policy is right or wrong by examining it in isolation. For example, Cedar does not know if the policy author meant Uzer or User because both are well-formed names. If the policy were subsequently evaluated during an authorization decision, Cedar would return diagnostic warnings about undefined attributes and invalid comparisons of strings and integers. But, if one weren’t looking for these diagnostics, an end-user would merely observe that the policy had no impact; it was ignored.

If no other policy grants access, Cedar returns a default decision of `DENY`. However, it can be frustrating when a policy isn’t behaving as expected. To avoid this frustration, it is better to learn that a policy is invalid when you're creating it, so mistakes can be fixed.

This capability is provided by Cedar validation. To validate a policy, Cedar needs information about the system. It needs to know the correct names of entity types, the attributes they possess, the allowed parent/child relationships, and whether the entities can act as principals, resources, or both. All of this information is provided to Cedar by defining a [schema](terminology.md#term-schema).

This topic provides a brief overview of schemas and how they work to provide validation. For a full description of the schema format with a sample schema, see [Cedar schema format](schema.md). 

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Introduction to the schema<a name="schema-intro"></a>

The following is an example of a basic Cedar schema.

```
{
    "ExampleCo::Personnel": {
        "entityTypes": {
            "Employee": {
                "shape": {
                    "type": "Record",
                    "attributes": {
                        "name": { "type": "String" },
                        "jobLevel": { "type": "Long" },
                        "numberOfLaptops ": {
                            "type": "Long",
                            "required": false
                        }
                    }
                }
            }
        },
        "actions": {
            "remoteAccess": {
                "appliesTo": {
                    "principalTypes": ["Employee"]
                }
            }
        }
    }
}
```

This schema specifies the following:
+ The entities defined in this schema exist in the namespace `ExampleCo::Personnel`.
+ Every entity of type `Employee` in the store has an attribute `name` with a value that is a Cedar `String`, an attribute `jobLevel` with a value that is a Cedar `Long`, and an optional attribute `numberOfLaptops` that is also a Cedar `Long`.
+ Any query that specifies action `Action::"remoteAccess"` can specify only principals that are of type `Employee`.

Consider the `when` clause of the following policy.

```
permit (
    principal,
    action == ExampleCo::Personnel::Action::remoteAccess,
    resource
)
when {
    principal.numberOfLatpops < 5 &&        // (1)
    principal.jobLevel > "something" &&     // (2)
    principal.jobLevel == "somethingelse"   // (3)
};
```

Based on the previous sample schema, the Cedar validator can infer that the principal is an `Employee`; therefore, it must have a `jobLevel` attribute. With this knowledge, validation will report an error or warning on each of the comparisons 1 through 3 for the following reasons:

1. **Validation error** &ndash; The policy contains an attribute that isn’t present in the schema. In this case, the error is because of a typo (`Latpop` instead of `Laptop`).

1. **Validation error** &ndash; The right operand of `>` is a `String`. However, `>` only accepts values of type `Long`, so this policy always raises a runtime error.

1. The left operand of `==` is always a `Long` and the right operand is always a `String`. Because the `==` operator returns false if its operands have different runtime types, this comparison always returns false. Although this comparison doesn't raise a runtime error, it probably isn’t what the policy author intended.

## Supported validation checks<a name="validation-supported-checks"></a>

The validator compares a policy with a schema to look for inconsistencies. From these inconsistencies, the validator detects the following errors:
+ **Unrecognized entity types** &ndash; For example, misspelling `File` as `Filee`.
+ **Unrecognized actions** &ndash; For example, misspelling `Action::"viewFile"` as `Action::"viewFiel"`.
+ **Action applied to unsupported principal or resource** &ndash; For example, saying a `File` can `View` a `User`.
+ **Improper use of in or ==** &ndash; For example, stating `principal in Folder::"folder-name"` when a principal can't be a `File`.
+ **Unrecognized attributes** &ndash; For example, `principal.jobbLevel` has a typo and should be `jobLevel`.
+ **Unsafe access to optional attributes** &ndash; For example, `principal.numberOfLaptops` where `numberOfLaptops` is an optional attribute declared with `"required": false`. Such tests should be guarded by including a [`has`](syntax-operators.md#operator-has) check as the left side of the shortcut [&&](syntax-operators.md#operator-and) expression. For example, as in `principal has numberOfLaptops && principal.numberOfLaptops > 1`.
+ **Type mismatch in operators** &ndash; For example, `principal.jobLevel > "14"` has an illegal comparison of a `Long` with a `String`.
+ **Cases that always evaluate to false, and thus never apply** &ndash; For example, `when { ["hello"].contains (1) }` always evaluates to `false` so the policy can never apply.

The schema can also specify the expected format of the context record for each `Action`. Making this specification lets Cedar also flag errors on references to context.

## Enforcement of validation rules<a name="validation-enforcement"></a>

When a schema is provided to Cedar, the service automatically performs validation against that schema whenever you create or edit a policy or policy template. If a newly submitted policy doesn't comply with the schema, Cedar returns an error message that contains a list of the validation failures.

{: .note }
>Schemas don't impact the runtime behavior of authorization for existing static policies and policy templates. Validation occurs *only* when initially creating or updating a static policy or policy template. After Verified Permissions accepts a policy, that policy continues to behave the same even if the schema changes over time. You can revalidate against an updated schema by editing the policy in some way and saving that change.   
>Validation is intended only as a debugging and diagnostic mechanism inside the administrative tools for policy creation and editing.

## Namespaces<a name="validation-namespaces"></a>

As software products increase in size and organizations grow, multiple services can be added to contribute to the overall implementation of an application or product portfolio. You can see this outcome happening when vendors offer several products to customers, or alternatively, in service meshes where multiple services contribute portions of an application.

When this situation occurs, Cedar entity definitions can become ambiguous. For example, consider a vendor that offers both a hosted database product and a hosted furniture design service. In this environment, a Cedar expression such as `Action::"createTable"` is ambiguous; it could be creating a database table or a new piece of furniture. Similarly, an entity UID such as `Table::"0d6169ca-b246-43a7-94b9-8a68a9e8f8b3"` could refer to either product.

This ambiguity can become an issue in circumstances such as the following:
* When both services store their Cedar policies in a single policy store.
* If policies are later aggregated into a central repository to explore cross-cutting questions about a customer’s access permissions throughout the portfolio of services.

To resolve this ambiguity, you can add *namespaces* to Cedar entities and actions. A namespace is a string prefix for a type, separated by a pair of colons \(`::`\) as a delimiter.

```
Database::Action::"createTable"
Database::Table::"c7b981f1-97e4-436b-9af9-21054a3b30f1"
Furniture::Action::"createTable"
Furniture::Table::"c7b981f1-97e4-436b-9af9-21054a3b30f1"
```

Namespaces can also be nested to arbitrary depth.

```
ExampleCo::Database::Table::"c7b981f1-97e4-436b-9af9-21054a3b30f1"
ExampleCo::Furniture::Table::"c7b981f1-97e4-436b-9af9-21054a3b30f1"
ExampleCo::This::Is::A::Long::Name::For::Something::"12345"
```

Namespaces are declared in schema by including the namespace before the list of entities that are part of the namespace, as shown in the following example.

```
{
    "ExampleCo::Database": {
        "entityTypes": {
            "Table": {
                ...
            }
        },
        "actions": {
            "createTable": {
                ...
            }
        }
    }
}
```

Namespaces are automatically prepended to all types defined within the schema file. As a result, the previous schema causes the Cedar validator to expect the following types:

```
ExampleCo::Database::Table::"some_identifier"
ExampleCo::Database::Action::"createTable"
```

A common convention is for each application team to manage a schema for their namespace, without touching the namespaces owned by other application teams.

Cedar doesn't currently require that you specify a namespace. However, if you define a schema without a namespace and then later choose to add one, you need to update all of your policies to include the correct namespace, or authorization fails. You must also update the authorization requests you send to Cedar to include the namespace as part of the type identifiers.

For more information about using a namespace as part of your schema, see [`namespace`](schema.md#schema-namespace).

## Benefits of defining a schema<a name="validation-benefits-of-schema"></a>

Defining a schema is useful for purposes other than validation.

* Because a schema describes the properties of an authorization system, they can serve as an input to other tooling, such as documentation generators.
* Use a schema to generate policy editor interfaces in situations where end-users manage fine-grained rules through point-and-click selections.
* Analytics engines that query a body of policies to answer questions might rely on the existence of a schema to produce the most accurate reports.
* Sample solutions for authorization scenarios are typically expressed using a schema file. For example, you can answer the question "How can I model situation XYZ?" with a schema that describes the modeling approach.

Although you can get started in Cedar without using a schema, we encourage you to define and use one, especially as your project moves beyond initial prototyping and toward a production release.
