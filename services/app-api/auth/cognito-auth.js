import { CognitoIdentityServiceProvider } from "aws-sdk";

import { localUser } from "./local-user";

export function parseAuthProvider(authProvider) {
  // Cognito authentication provider looks like:
  // cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx,cognito-idp.us-east-1.amazonaws.com/us-east-1_aaaaaaaaa:CognitoSignIn:qqqqqqqq-1111-2222-3333-rrrrrrrrrrrr
  // Where us-east-1_aaaaaaaaa is the User Pool id
  // And qqqqqqqq-1111-2222-3333-rrrrrrrrrrrr is the User Pool User Id
  try {
    const parts = authProvider.split(":");
    const userPoolIdParts = parts[parts.length - 3].split("/");

    const userPoolId = userPoolIdParts[userPoolIdParts.length - 1];
    const userPoolUserId = parts[parts.length - 1];

    const userInfoObject = {
      status: "success",
      userId: userPoolUserId,
      poolId: userPoolId,
    };

    return userInfoObject;
  } catch (e) {
    const errorObject = {
      status: "error",
      errorMessage:
        "Error (parseAuthProvider): parseAuth doesnt have enough parts",
      detailedErrorMessage: e,
    };

    return errorObject;
  }
}

function userAttrDict(cognitoUser) {
  const attributes = {};

  if (cognitoUser.UserAttributes) {
    cognitoUser.UserAttributes.forEach((attribute) => {
      if (attribute.Value) {
        attributes[attribute.Name] = attribute.Value;
      }
    });
  }

  return attributes;
}

// userFromCognitoAuthProvider hits the Cogntio API to get the information in the authProvider
export async function userFromCognitoAuthProvider(authProvider) {
  let userObject = {};

  switch (authProvider) {
    case "offlineContext_cognitoAuthenticationProvider":
      userObject = localUser;
      break;

    default:
      const userInfo = parseAuthProvider(authProvider);

      // calling a dependency so we have to try
      try {
        const cognito = new CognitoIdentityServiceProvider();
        const userResponse = await cognito
          .adminGetUser({
            Username: userInfo.userId,
            UserPoolId: userInfo.poolId,
          })
          .promise();

        console.log("????userResponse from cognito:");
        console.log(userResponse);

        // we lose type safety here...
        const attributes = userAttrDict(userResponse);

        userObject = {
          status: "success",
          email: attributes.email,
          name: attributes.given_name + " " + attributes.family_name,
          state: attributes["custom:state_code"],
          role: "STATE_USER",
        };
      } catch (e) {
        const errorObject = {
          status: "error",
          errorMessage:
            "Error (userFromCognitoAuthProvider): cannot retrieve user info",
          detailedErrorMessage: e,
        };

        return errorObject;
      }
      break;
  }

  return userObject;
}