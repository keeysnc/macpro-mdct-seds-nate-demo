import dynamoDb from "../../libs/dynamodb-lib";

export async function getUsersEmailByRole(role) {
  const params = {
    TableName:
      process.env.AUTH_USER_TABLE_NAME ?? process.env.AuthUserTableName,
    Select: "ALL_ATTRIBUTES",
    ExpressionAttributeNames: { "#r": "role" },
    ExpressionAttributeValues: { ":role": role },
    FilterExpression: "#r = :role",
  };
  const result = await dynamoDb.scan(params);
  if (result.Count === 0) {
    return [];
  }

  return result.Items.map((userInfo) => ({
    state: userInfo.states,
    email: userInfo.email,
  }));
}

// retrieve all states have NOT submitted their data yet
// (in other words - all states with ‘in progress’ reports for the prior quarter)
export async function getUncertifiedStates(year, quarter) {
  // house the list of states from the state forms
  const params = {
    TableName:
      process.env.STATE_FORMS_TABLE_NAME ?? process.env.StateFormsTableName,
    Select: "ALL_ATTRIBUTES",
    ExpressionAttributeNames: {
      "#Unceritifiedstatus": "status",
      "#theYear": "year",
      "#theQuarter": "quarter",
    },
    ExpressionAttributeValues: {
      ":status": "In Progress",
      ":year": year,
      ":quarter": quarter,
    },
    FilterExpression:
    "#Unceritifiedstatus = :status AND #theYear = :year AND #theQuarter = :quarter",
  };

  // data returned from the database which contains the database Items
  const result = await dynamoDb.scan(params);

  if (result.Count === 0) {
    return [
      {
        message:
          "At this time, There are no states which is currrently status: In Progress in this current quarter",
      },
    ];
  }

  return result.Items.map((stateInfo) => stateInfo.state_id).filter(
    (stateId, i, stateIds) => i === stateIds.indexOf(stateId)
  );
}

export async function getQuestionsByYear(specifiedYear) {
  const questionParams = {
    TableName:
      process.env.FORM_QUESTIONS_TABLE_NAME ??
      process.env.FormQuestionsTableName,
    ExpressionAttributeNames: {
      "#theYear": "year",
    },
    ExpressionAttributeValues: {
      ":specifiedYear": parseInt(specifiedYear),
    },
    FilterExpression: "#theYear = :specifiedYear",
  };

  let questionResult;

  try {
    questionResult = await dynamoDb.scan(questionParams);
    console.log("getQuestionsByYear result", questionResult);
  } catch (e) {
    console.log("getQuestionsByYear failed");
    throw e;
  }

  return questionResult.Items;
}

export async function getStatesList() {
  const stateParams = {
    TableName: process.env.STATES_TABLE_NAME ?? process.env.StatesTableName,
  };

  let stateResult;

  try {
    stateResult = await dynamoDb.scan(stateParams);
    console.log("getStatesList", stateResult);
  } catch (e) {
    console.log("getStatesList failed");
    throw e;
  }

  return stateResult.Items;
}

export async function getFormDescriptions() {
  const formDescriptionParams = {
    TableName: process.env.FORMS_TABLE_NAME ?? process.env.FormsTableName,
  };

  let formDescription;
  try {
    formDescription = await dynamoDb.scan(formDescriptionParams);
    console.log("getFormDescriptions", getFormDescriptions);
  } catch (e) {
    console.log("getFormDescription failed");
    throw e;
  }

  return formDescription.Items;
}

export async function getFormResultByStateString(stateFormString) {
  const params = {
    TableName:
      process.env.FORM_ANSWERS_TABLE_NAME ?? process.env.FormAnswersTableName,
    ExpressionAttributeValues: {
      ":state_form": stateFormString,
    },
    FilterExpression: "state_form = :state_form",
  };

  const result = await dynamoDb.scan(params);

  return result.Items;
}
