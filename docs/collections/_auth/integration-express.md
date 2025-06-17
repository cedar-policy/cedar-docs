---
layout: default
parent: Integrations
title: Using Express
nav_order: 1
has_children: false
---

# Integrate Cedar with Express applications

The Cedar Express integration provides a middleware-based approach to implementing authorization in your Express.js applications. With this integration, you can protect your API endpoints using fine-grained authorization policies without modifying your existing route handlers. The integration handles authorization checks automatically by intercepting requests, evaluating them against your defined policies, and ensuring that only authorized users can access protected resources.

This standardized integration with Cedar requires 90% less code compared to developers writing their own integration patterns, saving developers time and effort and improving application security posture by reducing the amount of custom integration code.

This topic walks you through setting up the Express integration, from creating a policy store to implementing and testing the authorization middleware. By following these steps, you can add robust authorization controls to your Express application with minimal code changes.

The following GitHub repos are referenced throughout this topic:

- [cedar-policy/authorization-for-expressjs](https://github.com/cedar-policy/authorization-for-expressjs) - The Cedar authorization middleware for Express.js

## Prerequisites

Before you implement the Express integration, ensure you have:

- [Node.js](https://nodejs.org/) and [npm](https://docs.npmjs.com/) installed
- An [Express.js](https://expressjs.com/) application
- An OpenID Connect (OIDC) identity provider (optional for testing)

## Setting up the integration

Let's walk through how to secure your application APIs using Cedar with the new package for Express.

### Step 1: Add the Cedar Authorization Middleware package

The Cedar Authorization Middleware package will be used to generate a Cedar schema, create sample authorization policies, and perform the authorization in your application.

```bash
npm i --save @cedar-policy/authorization-for-expressjs
```

### Step 2: Generate Cedar schema from your APIs

A Cedar schema defines the authorization model for an application, including the entity types in the application and the actions users are allowed to take. Your policies are validated against this schema when you run the application.

The `authorization-for-expressjs` package can analyze the OpenAPI specification of your application and generate a Cedar schema. Specifically, the paths object is required in your specification.

If you don't have an OpenAPI spec, you can generate one using the tool of your choice. There are a number of open source libraries to do this for Express; you may need to add some code to your application, generate the OpenAPI spec, and then remove the code. Alternatively, some generative AI-based tools such as the Amazon Q Developer CLI are effective at generating OpenAPI spec documents.

You can generate a Cedar schema by running, replacing `openapi.json` with the file of your schema and `YourNamespace` with the namespace of our choice:

```bash
npx @cedar-policy/authorization-for-expressjs generate-schema --api-spec openapi.json --namespace YourNamespace --mapping-type SimpleRest
```

This will generate a schema file named `v4.cedarschema.json` in the package root.

### Step 3: Define authorization policies

If no policies are configured, Cedar denies all authorization requests. We will add policies that grant access to APIs only for authorized user groups.

Generate sample Cedar policies:

```bash
npx @cedar-policy/authorization-for-expressjs generate-policies --schema v4.cedarschema.json
```

This will generate sample policies in the /policies directory. You can then customize these policies based on your use cases. For example:

```cedar
// Defines permitted administrator user group actions
permit (
    principal in YourNamespace::UserGroup::"<userPoolId>|administrator",
    action,
    resource
);

// Defines permitted employee user group actions
permit (
    principal in YourNamespace::UserGroup::"<userPoolId>|employee",
    action in
        [YourNamespace::Action::"GET /resources",
         YourNamespace::Action::"POST /resources",
         YourNamespace::Action::"GET /resources/{resourceId}",
         YourNamespace::Action::"PUT /resources/{resourceId}"],
    resource
);
```
Note: If you specified an `operationId` in the OpenAPI specification, the action names defined in the Cedar Schema will use that `operationId` instead of the default `<HTTP Method> /<PATH>` format. In this case, ensure the naming of your Actions in your Cedar Policies matches the naming of your Actions in your Cedar Schema.

For large applications with complex authorization policies, it can be challenging to analyze and audit the actual permissions provided by the many different policies. Cedar also provides the Cedar Analysis CLI to help developers perform policy analysis on their policies.

### Step 4: Update the application code to call Cedar and authorize API access

The application will use the Cedar middleware to authorize every request against the Cedar policies. First, add the package to the project and define the `CedarInlineAuthorizationEngine` and `ExpressAuthorizationMiddleware`. This block of code can be added to the top of the `app.js` file:

```javascript
const { ExpressAuthorizationMiddleware, CedarInlineAuthorizationEngine } = require('@cedar-policy/authorization-for-expressjs');

const policies = [
    fs.readFileSync(path.join(__dirname, 'policies', 'policy_1.cedar'), 'utf8'),
    fs.readFileSync(path.join(__dirname, 'policies', 'policy_2.cedar'), 'utf8')
];

const cedarAuthorizationEngine = new CedarInlineAuthorizationEngine({
    staticPolicies: policies.join('\n'),
    schema: {
        type: 'jsonString',
        schema: fs.readFileSync(path.join(__dirname, 'v4.cedarschema.json'), 'utf8'),
    }
});

const expressAuthorization = new ExpressAuthorizationMiddleware({
    schema: {
        type: 'jsonString',
        schema: fs.readFileSync(path.join(__dirname, 'v4.cedarschema.json'), 'utf8'),
    },
    authorizationEngine: cedarAuthorizationEngine,
    principalConfiguration: {
        type: 'custom',
        getPrincipalEntity: principalEntityFetcher
    },
    skippedEndpoints: [
        {httpVerb: 'get', path: '/login'},
        {httpVerb: 'get', path: '/api-spec/v3'},
    ],
    logger: {
        debug: s => console.log(s),
        log: s => console.log(s),
    }
});
```

Next, add the Express Authorization middleware to the application:

```javascript
const app = express();

app.use(express.json());
app.use(verifyToken());   // validate user token
// ... other pre-authz middlewares

app.use(expressAuthorization.middleware);

// ... other middlewares
```

### Step 5: Add application code to configure the user

The Cedar authorizer requires user groups and attributes to authorize requests. The authorization middleware relies on the function passed to `getPrincipalEntity` in the initial configuration to generate the principal entity. You need to implement this function to generate the user entity:

```javascript
async function principalEntityFetcher(req) {
    const user = req.user;   // it's common practice for the authn middleware to store the user info from the decoded token here
    const userGroups = user["groups"].map(userGroupId => ({
        type: 'PetStoreApp::UserGroup',
        id: userGroupId       
    }));
    return {
        uid: {
            type: 'PetStoreApp::User',
            id: user.sub
        },
        attrs: {
            ...user,
        },
        parents: userGroups 
    };
}
```

## Troubleshooting

If you have authorization failures, try the following:

- Ensure your schema is correctly formatted
- Check that your policies are correctly formatted
- Validate that your JWT tokens are valid
- Enable debug logging for more detailed information

## Next steps

After implementing the basic integration, consider:

- Implementing custom mappers for specific authorization scenarios
- Setting up monitoring and logging for authorization decisions
- Creating additional policies for different user roles
