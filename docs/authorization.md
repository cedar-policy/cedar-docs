---
layout: default
title: How Cedar authorization works
nav_order: 5
---

# How Cedar authorization works<a name="how-cedar-authorization-works"></a>
{: .no_toc }

Each time a user of your application wants to perform an action on a protected resource, the application needs to invoke the Cedar authorization engine (or _authorizer_, for short) to check if this request is allowed.
The authorizer will consider the request against the application's store of policies in order to make a decision, `Allow` or `Deny`. Here we discuss the Cedar authorizer's nuts and bolts, to see how it decides the answer to a particular request.

## Request creation<a name="request-creation"></a>

A Cedar _authorization request_ asks the question "*Can this principal take this action on this resource in this context?*". More formally, an authorization request has four parts, abbreviated _PARC_:
+ _P_ is the principal, 
+ _A_ is the action, 
+ _R_ is the resource, and 
+ _C_ is the request context. 

_P_, _A_, and _R_ are [entity references](terminology.md#term-entity), while _C_ is a record.

Conceptually, you should imagine that the authorizer is able to consider _all_ of your application's policies and entity data while evaluating a request. As a practical matter, making all policies and entity data available may be too difficult or too expensive. In that case, your application will need to determine which policies and entity data are _relevant_ to properly handling the request.

## Request authorization<a name="request-authorization"></a>

Given an authorization request, Cedar’s authorizer returns `Allow` if the request is granted or `Deny` if it is rejected, along with some diagnostics. How does it make this decision?

### Algorithm<a name="request-authorization-algorithm"></a>

First, the authorizer _evaluates_ each of the policies to determine if the policy _satisfies_ the request. We discuss the details of evaluation below, but for now we just need to know what the evaluator could return:
+ `true`, when the policy satisfies the request;
+ `false`, when the policy does not satisfy the request; or
+ `error`, when there is an error when evaluating the policy on the request data.

After evaluating each policy, the authorizer combines the results to make an authorization decision. It does so by applying the following rules:

1. If any `forbid` policy evaluates to `true`, then the final result is `Deny`.

2. Else, if any `permit` policy evaluates to `true`, then the final result is `Allow`.

3. Otherwise (i.e., no policy is satisfied), the final result is `Deny`.

The authorizer returns an _authorization response_, which includes its decision along with some diagnostics. These diagnostics include the _determining policies_ and any _error conditions_. If the decision is `Allow`, the determining policies are the `permit` policies that satisfy the request (rule 2). Otherwise, the determining policies are the `forbid` policies, if any, that satisfy the request (rules 1 and 3). Whatever the final result, if the evaluation of any policies resulted in `error`, then the IDs of the erroneous policies are included in the diagnostics, too, along with the particulars of the errors.

### Discussion<a name="request-authorization-discussion"></a>

Cedar's authorization algorithm has three useful properties:

1. **default deny**: no request with be authorized (decision `Allow`) unless there is a specific `permit` policy that grants it; by default, the decision will be `Deny`. 
1. **forbid overrides permit**: even if a `permit` policy is satisfied, any satisfied `forbid` policy will _override_ it, producing a `Deny` decision. 
1. **skip on error**: if a policy's evaluation returns `error`, the policy does not factor into the authorization response; it is skipped.

Why was Cedar's authorization algorithm designed to satisfy these properties? The first two properties make Cedar policies easier to understand. Since `permit` policies are the only way access is granted, readers just have to understand what each policy says, not what it does not. Because `forbid` policies _always_ deny access, readers can understand them independently of any `permit` policies created now or in the future; `forbid` policies effectively define permission "guardrails" that `permit` policies cannot cross. 

The reasoning for the skip-on-error property is more involved, and is discussed in this [blog post](https://cedarland.blog/design/why-ignore-errors/content.html) written by one of the Cedar designers. An alternative authorization algorithm we considered would be to `Deny` a request when any policy evaluation exhibits an error. While this may sound good at first, deny-on-error raises concerns of _safety_: An application that was working fine with 100 policies might suddenly start denying _all_ requests if the 101st policy has an error in it. Skip-on-error avoids this dramatic failure mode, and more flexible: Applications can always choose to look at the authorization response's diagnostics and take a different decision if an evaluated policy produces errors.

## Policy evaluation<a name="policy-evaluation"></a>

As just discussed, to reach its decision the Cedar authorizer's algorithm _evaluates_ a request _PARC_ against each policy it is given. Evaluation returns whether or not the policy is satisfied by the request (`true`/`false`), or whether an error occurred during evaluation (`error`). How does evaluation work?

### Expression evaluation<a name="expression-evaluation"></a>

The key component of policy evaluation is _expression_ evaluation. Each constraint in the policy scope is an expression. Each `when` clause also contains an expression, as does each `unless` clause. Evaluating a policy requires evaluating its constituent expressions. Example expressions include `resource.tags.contains("private")`, `action == Action::"viewPhoto"`, `principal in Team::"admin"`, and `resource in principal.account`. 

As with a typical programming language, evaluating an expression simplifies, or "executes", the expression until no further simplification is possible. The final result is either a Cedar _value_ -- like `true`, `1`, `User::"Alice"`, or `"blue"` -- or it is an `error`. Evaluating an expression with no variables is straightforward. The expression `2+2` evaluates to `4`. Expression `Action::"viewPhoto" == Action::"viewPhoto"` evaluates to `true`. Expression `if false then "blue" else "green"` evaluates to `"green"`. See [here](syntax-operators.md#syntax-operators) for complete descriptions of the various operators you can use in Cedar expressions.

What about expressions that have variables `principal`, `action`, `resource`, and `context` in them? To evaluate such expressions we must first _bind_ any variables that appear in them to values of the appropriate type. Then we evaluate the expressions with those values in place of the variables. 

For example, consider the expression `action == Action::"viewPhoto"`. If we bind the `action` variable to the entity `Action::"viewPhoto"`, then the result is `true`. That's because replacing `action` with `Action::"viewPhoto"` gives expression `Action::"viewPhoto" == Action::"viewPhoto"` which is obviously `true`.

As another example, consider the expression `resource.tags.contains("Private")`. If we bind variable `resource` to the entity `Photo::"vacation94.jpg"` we get `Photo::"vacation94.jpg".tags.contains("Private")`. Evaluating further, we need to look up `Photo::"vacation94.jpg"` in our entities data, and then extract its `tags` attribute. If that attribute contains a set with the string `"Private"` in it, we'll get `true`; if it's a set without `"Private"` we'll get `false`; otherwise `tags` is either not a valid attribute or contains a non-set, so we will get `error`.

### Policy satisfaction<a name="policy-satisfaction"></a>

Determining whether a policy satsifies a request is a straightforward use of expression evaluation. To explain it, let's introduce some notation. For a policy _c_:
+ _Principal(c)_ is the constraint involving `principal` in _c_'s [policy scope](terminology.md#term-policy). If there is no constraint on `principal`, then _Principal(c)_ is just `true`
+ _Action(c)_ is the constraint involving `action` in _c_'s policy scope, or `true` if there is no constraint
+ _Resource(c)_ is the constraint involving `resource` in _c_'s policy scope, or `true` if there is no constraint
+ _Conds(c)_ is the list of `when` and `unless` expressions in _c_

Here's how we evaluate a policy _c_ with respect to a _PARC_ request. First we test whether _c_ **matches** the request, as follows:
1. Bind `principal` to _P_ in expression _Principal(c)_ and evaluate it
1. Bind `action` to _A_ in expression _Action(c)_ and evaluate it
1. Bind `resource` to _R_ in expression _Resource(c)_ and evaluate it

If all three steps evaluate to `true`, then _c_ matches the request. Otherwise it does not. (As it turns out, Cedar's design ensures that none of these three steps can possibly evaluate to `error`.)

If _c_ matches the request, we evaluate its conditions _Conds(c)_ in order. We bind the `principal`, `action`, `resource`, and `context` variables to the _PARC_ values when we do so. If all of the `when` conditions evaluate to `true`, and all of the `unless` conditions evaluate to `false`, then policy _c_ satsifies the request, and the final evaluation result is `true`. If evaluating any condition expression yields `error` then policy evaluation halts at that point (any remaining conditions are skipped), and `error` is returned as the final result. Otherwise, `false` is returned.

## Detailed Example<a name="policy-evaluation-example"></a>

To illustrate policy evaluation, let's consider whether a set of four policies authorizes the following request: "Can the user `jane` perform the action `viewPhoto` on the photo `vacation.jpg`?" Precisely, the request is:
+ _P_ = `User::"jane"`
+ _A_ = `Action::"viewPhoto"`
+ _R_ = `Photo::"vacation.jpg"`
+ _C_ = `{}` (the empty record)

Let's assume that the entities data includes the following details:
+ Entity `User::"jane"` is a member of `Group::"kevinsFriends"`
+ Entity `Photo::"vacation.jpg"` has the following attributes:
  + `.owner` is `User::"kevin"`
  + `.tags` is `["Private","Work"]` (i.e., a set containing the strings `"Private"` and `"Work"`)

Now let's evaluate each of the four policies against this request.

+ **P1** – Jane can perform any action on photo `vacation.jpg`.

  ```
  permit( 
      principal == User::"jane", 
      action, 
      resource == Photo::"vacation.jpg"
  );
  ```
  This policy is **satisfied**.
    - _Principal_(P1) is `principal == User::"jane"`, so after binding `principal` to `User::"jane"` (the _P_ in the request), the expression evaluates to `true`
    - _Action_(P1) is simply `true` since there is no action constraint
    - _Resource_(P1) is `resource == Photo::"vacation.jpg"`, so after binding `resource` to `Photo::"vacation.jpg"` (the _R_ in the request), the expression evaluates to `true`
    - _Conds(c)_ is empty, so they are trivially `true`

+ **P2** – A member of group `kevinFriends` can view any of Kevin's photos when they are tagged `Holiday`

  ```
  permit(
      principal in UserGroup::"kevinFriends",
      action == Action::"viewPhoto",
      resource
  )
  when {
      resource.tags.contains("Holiday")
  };
  ```
  This policy is **not satisfied**: While it matches the request, its **_condition evaluates to `false`_**.
    - _Principal_(P1) is `principal in UserGroup::"kevinFriends"`, so after binding `principal` to `User::"jane"` (the _P_ in the request), the expression evaluates to `true` because `User::"jane"` is a member of `Group::"kevinsFriends"`
    - _Action_(P1) is `action == Action::"viewPhoto"`, so after binding `action` to `Action::"viewPhoto"` the expression evaluates to `true`
    - _Resource_(P1) is simply `true` since there is no resource constraint
    - _Conds(c)_ is the list containing `when` expression `resource.tags.contains("Holiday")`. After binding `resource` to `Photo::"vacation.jpg"` (the _R_ in the request), the expression evaluates to `false` because the `.tags` attribute of `Photo::"vacation.jpg"` is `["Private","Work"]`, i.e., it does not contain `"Holiday"`.

+ **P3** – Users are forbidden from viewing any photos tagged `Private` unless they are the owner of the photo.

  ```
  forbid(
      principal,
      action == Action::"viewPhoto",
      resource
  )
  when { resource.tags.contains("Private") }
  unless { principal == resource.owner };
  ```
  This policy is **satisfied**.
    - The policy matches the request: `principal` and `resource` are unconstrained, and _Action(c)_ evaluates to `true` because _A_ is `Action::"viewPhoto"`;
    - the policy's `when` condition is `true` because the `.tags` attribute of `Photo::"vacation.jpg"` contains `"Private"`; and
    - its `unless` condition is `false` because the `.owner` attribute of `Photo::"vacation.jpg"` (which is `User::"kevin"`) is not equal to _P_ (which is `User::"jane"`).

+ **P4** – Users can perform `updateTags` on a resource, like a `Photo` or `Album`, when they are the owner of the resource

  ```
  permit(
      principal,
      action == Action::"updateTags",
      resource
  )
  when { principal == resource.owner };
  ```
  This policy is **not satisfied**.
    - The policy **_fails to match the request_** because while `principal` and `resource` are unconstrained, _Action(c)_ evaluates to `false` because binding `action` to _A_ yields expression `Action::"viewPhoto" == Action::"updatePassword"`.

In sum:
+ `permit` policy P1 evaluates to `true`
+ `permit` policy P2 evaluates to `false`
+ `forbid` policy P3 evaluates to `true`
+ `permit` policy P4 evaluates to `false`

Combining these policy evaluation results, the Cedar authorizer returns a decision of `Deny`, where the determining policy is P3. This result follows from rule 1 of our [authorization logic](#request-authorization-algorithm): "If any forbid policy evaluates to `true`, then the final result is `Deny`" (and the determining policies are the satisfied `forbid` policies).
