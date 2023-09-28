---
layout: default
title: Policy validation
nav_order: 5
---

# Cedar policy validation against schema {#validation}
{: .no_toc }

Cedar policies are code, and as with all code it is possible to make mistakes that mean the code will not behave as expected. For example, the following is a well-formed Cedar policy according to syntax rules, but with a number of typos and type errors.

```cedar
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

Cedar can't know whether this policy is right or wrong by examining it in isolation. For example, Cedar does not know if the policy author meant `Uzer` or `User` because both are well-formed names. If the policy were subsequently evaluated during an authorization decision, it either would not match at all due to the mistakes in the policy scope (e.g., if there are no entities of type `Uzer` then the first comparison would always be false), or if the scope's errors were corrected the evaluator would return diagnostics about accessing undefined attributes and performing invalid comparisons of strings and integers. Ultimately, the policy will have no impact: policies that always evaluate to `false` or exhibit errors during evaluation are ignored.

If no policy grants access, Cedar returns a default decision of `DENY`. However, it can be frustrating when a policy isn’t behaving as expected. To avoid this frustration, it is better to learn that a policy is invalid when you're creating it, so mistakes can be fixed before they have an impact on your application's operation.

This capability is provided by Cedar **validation**. To validate a policy, Cedar needs information about the application. It needs to know the correct names of entity types, the attributes they possess, and the allowed parent/child relationships. It also needs to know which actions are allowed, and the expected types of the principal, resource, and context components that are part of requests made with this action. All of this information is provided to Cedar by defining a [**schema**](../overview/terminology.html#term-schema).

This topic provides a brief overview of schemas and how they work to provide validation. For a full description of the schema format with a sample schema, see [Cedar schema format](../schema/schema.html).

{: .warning }
>If you change your schema, any policies that you validated before the change might no longer be valid. Those policies can then generate errors during authorization queries if you include entities that match the updated schema in your request. 
> Policies that result in errors aren't included in the authorization decision, possibly leading to unexpected results. Therefore, we strongly recommend that you review your policies to see which might be affected by the schema change, and edit those policies so that they accurately reflect the entities that you now include in your evaluation requests.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Example of schema-based validation {#schema-intro}

The following is an example of a basic Cedar schema.

```json
{
    "ExampleCo::Personnel": {
        "entityTypes": {
            "Employee": {
                "shape": {
                    "type": "Record",
                    "attributes": {
                        "name": { "type": "String" },
                        "jobLevel": { "type": "Long" },
                        "numberOfLaptops": {
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

+ The entities defined in this schema exist in the namespace `ExampleCo::Personnel`. References to those entities _within policies_ require the namespace prefix, e.g., `ExampleCo::Personnel::Employee`. References to those entities _within the schema_, within the namespace declaration, need no namespace prefix, e.g., we write just `Employee` in the `principalTypes` part, rather than `ExampleCo::Personnel::Employee`.
+ Every entity of type `Employee` in the store has an attribute `name` with a value that is a Cedar `String`, an attribute `jobLevel` with a value that is a Cedar `Long`, and an optional attribute `numberOfLaptops` that is also a Cedar `Long`.
+ Any authorization request from the application that specifies action `Action::"remoteAccess"` is expected to specify only principals that are of type `Employee` (with no restriction on the type of a request's resource).

Consider the following policy.

```cedar
permit (
    principal,
    action == ExampleCo::Personnel::Action::"remoteAccess",
    resource
)
when {
    principal.numberOfLatpops < 5 &&        // (1)
    principal.name > 3 &&                   // (2)
    principal.jobLevel == "somethingelse"   // (3)
};
```

The Cedar validator knows that any request that triggers evaluation of this policy must have action `Action::"remoteAccess"`. According to our example schema, such a request must have a principal of type `Employee` (the resource can be anything, or unspecified). With this knowledge, validation will report an error or warning on each of the comparisons 1 through 3 in the `when` clause for the following reasons:

1. **Validation error** &ndash; The policy tries to access an attribute that isn’t defined for `Employee` types. In this case, the error is because of a typo (`numberOfLatpops` instead of `numberOfLaptops`).

1. **Validation error** &ndash; The left operand of `>` is of type `String`. However, `>` only accepts operands of type `Long`, so this policy always raises a runtime error.

1. **Validation error** &ndash; The left operand of `==` is always of type `Long` and the right operand is always a `String`. Because the `==` operator always returns false if its operands have different runtime types, this comparison always returns false. Although this comparison won't raise a runtime error during evaluation, it probably isn’t what the policy author intended and so is flagged as a validation error.

## Supported validation checks {#validation-supported-checks}

The validator compares a policy with a schema to look for inconsistencies. From these inconsistencies, the validator detects the following errors:

+ **Unrecognized entity types** &ndash; For example, misspelling `File` as `Filee`.
+ **Unrecognized actions** &ndash; For example, misspelling `Action::"viewFile"` as `Action::"viewFiel"`.
+ **Action applied to unsupported principal or resource** &ndash; For example, saying a `File` can `View` a `User`.
+ **Improper use of in or ==** &ndash; For example, stating `principal in Folder::"folder-name"` when a principal can't be a `File`.
+ **Unrecognized attributes** &ndash; For example, `principal.jobbLevel` has a typo and should be `jobLevel`.
+ **Unsafe access to optional attributes** &ndash; For example, `principal.numberOfLaptops` where `numberOfLaptops` is an optional attribute declared with `"required": false`. Such tests should be guarded by including a [`has`](../policies/syntax-operators.html#operator-has) check as the left side of the shortcut [&&](../policies/syntax-operators.html#operator-and) expression. For example, as in `principal has numberOfLaptops && principal.numberOfLaptops > 1`.
+ **Type mismatch in operators** &ndash; For example, `principal.jobLevel > "14"` is an illegal comparison with a `String`.
+ **Cases that always evaluate to false, and thus never apply** &ndash; For example, `when { principal has manager && principal.manager == User::"Ethel" }` always evaluates to `false` when the type of `principal` will never have the `manager` attribute, as made clear in the schema, so the policy can never apply.

The schema can also specify the expected format of the context record for each `Action`. Making this specification lets Cedar also flag errors on references to context.

## Enforcement of validation rules: Expectations {#validation-enforcement}

As implied by the discussion above, we expect validation to be performed _before_ a policy is used by the authorization engine to decide authorization requests. Indeed, the Cedar authorization APIs do not perform validation at the same time that a request is evaluated. Rather, validation is an entirely separate API which can be invoked when policies are loaded or created.

We expect that **all authorization requests adhere to the rules given in the schema** used to validate the policies. In particular:

+ For a request with components _PARC_ (principal, action, resource, context), the _A_ component must be an action enumerated in the `actions` part of the schema, and the _PRC_ components will have the types given with _A_ in the schema. Our example schema above states that _A_ must always be `ExampleCo::Personnel::Action::"remoteAccess"` (since it's the only action given in the schema), and for this action _P_ must be an entity of type `ExampleCo::Personnel::Employee`, _R_ can be any entity (or omitted entirely), and _C_ must be the empty record `{}` (since no information about the context is given).
+ The entities used when evaluating the request must have the structure given in the `entityTypes` part of the schema. Our example schema above states that `ExampleCo::Personnel::Employee` entities have at least two attributes (`name` and `jobLevel`) and optionally have a third (`numberOfLaptops`), each with the types given (`String`, `Long`, and `Long`, respectively). Schemas may also specify the expected hierarchical relationships among entities (not shown in the example).

If these expectations are not met then a policy that the validator accepts as valid may fail with an error when evaluated, causing it to be ignored. To see why, consider the following policy, which passes validation when using our example schema.

```cedar
permit (principal, action, resource)
when {
    principal.name == "superuser" ||
    principal.jobLevel > 8
};
```

This policy states that any principal whose `name` is `"superuser"` or whose `jobLevel` is greater than 8 can perform any action on any resource. According to our example schema, all principals are expected to have type `Employee`, which is the only principal type given for the sole action listed.

Now suppose we submitted the following authorization request:

+ _P_ = `ExampleCo::Personnel::Employee::"Rick"`
+ _A_ = `ExampleCo::Personnel::Action::"remoteAccess"`
+ _R_ = _omitted_
+ _C_ = `{}`
+ The attributes of entity `ExampleCo::Personnel::Employee::"Rick"` are the record `{ "firstName": "Rick", "jobLevel" : "admin" }`

For this request the _PARC_ components conform to the schema, but the attributes of entity `ExampleCo::Personnel::Employee::"Rick"` do not: The schema prescribes that attributes `name` and `jobLevel` must be present, and the latter is mapped to value of type `Long`, but neither is true of the entity given in the request. If we evaluated the policy on this request the policy's `when`-condition expression `principal.name == "superuser"` would fail with a message like _ExampleCo::Personnel::Employee::"Rick" does not have the required attribute: name_. If we changed the entity in the request so that `firstName` was instead `name` as required by the schema, evaluation would fail on `principal.jobLevel > 8` with a message like _type error: expected long, got string_.

By default, it is entirely up to the application to make sure that authorization requests are well-formed according to the schema's expectations. However, a future feature (described in [RFC 11](https://github.com/cedar-policy/rfcs/pull/11)) will allow applications to _optionally_ validate that the _PAR_ parts of a _PARC_ request adhere to the expectations given in the schema. Applications can also choose to use schema-based parsing to ensure that JSON data used to describe entities and/or a request's context _C_ match the prescriptions of the schema. For example, schema-based parsing would catch the issue above by flagging `{ "firstName": "Rick", "jobLevel" : "admin" }` as an invalid entity of type `Employee` (assuming _C_ was created by parsing a JSON representation of the context data). If an application writer is sure that requests will always match the schema's expectations by construction, they can elect to skip these steps.

You can think of a schema as a contract between the application and the policies: If the application provides requests and data that follow the prescriptions in the schema, then evaluating policies validated against that schema will surely avoid several classes of error. (The [end of this section](#validation-benefits-of-schema) discusses in detail what errors are and are not precluded by validation.)

Note that this contract implies that if an application's schema changes then so has its authorization model, i.e., the actions and/or entities it may submit to the Cedar authorization engine, and their structure. Policies still in effect may need to be revalidated to make sure they are consistent with these changes.

## Benefits of validation and schemas {#validation-benefits-of-schema}

Performing validation before using your policies gives you a significant benefit, called _validation soundness_: If your policies are deemed valid, they are sure not to exhibit most errors that could arise during request evaluation, for requests that adhere to the expectations defined by the schema. We have formally _proved_ validation soundness as part of the novel [verification guided development](https://www.amazon.science/blog/how-we-built-cedar-with-automated-reasoning-and-differential-testing) process we used to build Cedar. In particular, we implemented a version of the validator in the [Dafny verification-aware programming language](https://dafny.org), and used [automated reasoning](https://www.amazon.science/blog/a-gentle-introduction-to-automated-reasoning) to prove the validation soundness property. Then we performed extensive _differential testing_ to make sure that our Rust implementation of the validator behaves the same as the Dafny version does.

Validation soundness ensures the absence of most, but not all errors that could arise during policy evaluation. The only errors that are not precluded are the following:

+ **Errors due to integer overflow**. In Cedar when you add two large `Long` numbers together the result may be too big to fit in 64 bits. Rather than wrap around (e.g., producing a negative number) as in many languages, Cedar throws an error. Validation does not currently attempt to detect this possibility, but we are developing such detection as a future feature.
+ **Errors due to missing entities**. If a policy references an entity that does not exist in the entities used to evaluate the policy, any attempt to access that entity's attributes will fail. This could happen with an entity literal (e.g., `User::"Rick".name == "rick"`) or with an entity passed in as a principal or resource (e.g., `principal.name == "rick"`, or `principal.manager.name == "Vijay"` where `principal.manager` should be an entity). Request validation ([RFC 11](https://github.com/cedar-policy/rfcs/pull/11)) and schema-based JSON parsing do not confirm the existence of entities.
+ **Errors due to incorrect [Extension](../schema/schema.html#schema-entitytypes-shape-extension) values** (in non-strict mode). IP addresses and decimals are constructed by calling a function, either `ip()` or `decimal()`, with a string. For policies that pass non-literal strings to these functions, there is a risk that the string is not well-formed, and thus evaluating it will produce an error. For example, if we had a policy with the expression `ip(principal.IPAddr)` and `principal.IPAddr` happened to be the string `"XYZ"` then evaluating the policy would fail with an error. However, by default the validator runs in a _strict_ mode that forbids passing non-literal strings to extension function constructors; in this mode, the expression above will fail to validate with the error _extension constructors may not be called with non-literal expressions_. An expression like `ip("XYZ")` in a policy will fail to validate (regardless of mode).

All other errors (as enumerated [earlier](#supported-validation-checks)) will never happen.

We close by noting that defining a schema is useful for purposes other than validation.

+ Because a schema describes the properties of an authorization system, they can serve as an input to other tooling, such as documentation generators.
+ Schemas can be used to generate policy editor interfaces in situations where end-users manage fine-grained rules through point-and-click selections.
+ Analytics engines that query a body of policies to answer questions might rely on the existence of a schema to produce the most accurate reports.
+ Sample solutions for authorization scenarios are typically expressed using a schema file. For example, you can answer the question "How can I model situation XYZ?" with a schema that describes the modeling approach.

Although you can get started in Cedar without using a schema, we encourage you to define and use one, especially as your project moves beyond initial prototyping and toward a production release.
