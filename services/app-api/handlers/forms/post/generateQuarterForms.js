import handler from "../../../libs/handler-lib";
import dynamoDb from "../../../libs/dynamodb-lib";
import {
  getFormDescriptions,
  getQuestionsByYear,
  getStatesList,
  findExistingStateForms,
  fetchOrCreateQuestions,
  getQuarter,
} from "../../shared/sharedFunctions";

/**
 * Generates initial form data and statuses for all states given a year and quarter
 */

export const main = handler(async (event, context) => {
  let noMissingForms = true;

  // *** if this invocation is a pre-warm, do nothing and return
  if (event.source === "serverless-plugin-warmup") {
    console.log("Warmed up!");
    return null;
  }

  // at top of file, or in some config file
  const retryFailLimit = 5;
  const failureList = [];

  // Batch write all items, rerun if any UnprocessedItems are returned and it's under the retry limit
  const batchWriteAll = async (tryRetryBatch) => {
    // Attempt first batch write
    const { UnprocessedItems } = await dynamoDb.batchWrite(tryRetryBatch.batch);

    // If there are any failures and under the retry limit
    if (UnprocessedItems.length && tryRetryBatch.noOfRetries < retryFailLimit) {
      const retryBatch = {
        noOfRetries: tryRetryBatch.noOfRetries + 1,
        batch: UnprocessedItems,
      };
      return await batchWriteAll(retryBatch);
    } else if (tryRetryBatch.noOfRetries >= retryFailLimit) {
      // exceeded failure limit
      console.error(
        `Tried batch ${
          tryRetryBatch.noOfRetries
        } times. Failing batch ${JSON.stringify(tryRetryBatch)}`
      );
      failureList.push({ failure: JSON.stringify(tryRetryBatch) });
    }
  };

  const determineAgeRanges = (questionId) => {
    const year = questionId.split("-")[0];
    const form = questionId.split("-")[1];

    let ageRanges;
    if (
      parseInt(year) === 2020 ||
      parseInt(year) === 2019 ||
      parseInt(year) === 2018
    ) {
      switch (form) {
        case "GRE":
          ageRanges = [
            { key: "0018", label: "Conception through age 18 years" },
          ];
          break;
        case "21PW":
          ageRanges = [
            { key: "1964", label: "Age 19 years through age 64 years" },
          ];
          break;
        case "64-21E":
          ageRanges = [
            { key: "0001", label: "Birth through age 12 months" },
            { key: "0105", label: "Age 1 year through age 5 years" },
            { key: "0612", label: "Age 6 years through age 12 years" },
            { key: "1318", label: "Age 13 years through age 18 years" },
          ];
          break;
        case "21E":
          ageRanges = [
            { key: "0000", label: "Conception to birth" },
            { key: "0001", label: "Birth through age 12 months" },
            { key: "0105", label: "Age 1 year through age 5 years" },
            { key: "0612", label: "Age 6 years through age 12 years" },
            { key: "1318", label: "Age 13 years through age 18 years" },
          ];
          break;
        case "64-EC":
          ageRanges = [
            { key: "0001", label: "Birth through age 12 months" },
            { key: "0105", label: "Age 1 year through age 5 years" },
            { key: "0612", label: "Age 6 years through age 12 years" },
            { key: "1318", label: "Age 13 years through age 18 years" },
            { key: "1920", label: "Age 19 years through age 20 years" },
          ];
          break;
      }
    }
    return ageRanges;
  };

  // Get year, if none is specified, base on current month, the year is either this or next
  const getSpecifiedYear = (currentDate) => {
    // If the current Month is October or later, use Next year
    if (currentDate.getMonth() >= 9) {
      return currentDate.getFullYear() + 1;
    }
    return currentDate.getFullYear();
  };

  // Get year and quarter from request, or the current date for automated jobs
  const currentDate = new Date();
  let specifiedYear;
  let specifiedQuarter;

  // If a data object is sent use those values.
  if (event.body && event.body !== "undefined") {
    let data = JSON.parse(event.body);
    if (data) {
      specifiedYear = parseInt(data.year);
      specifiedQuarter = data.quarter;
    }
  }

  // If no year, use current year sent in data object
  if (!specifiedYear) {
    specifiedYear = getSpecifiedYear(currentDate);
  }

  // If no quarter provided in data object, determine what quarter it is
  if (!specifiedQuarter) {
    specifiedQuarter = getQuarter(currentDate);
  }

  // Search for existing stateForms
  const foundForms = await findExistingStateForms(
    specifiedYear,
    specifiedQuarter
  );

  // Pull list of states
  let allStates = await getStatesList();

  if (!allStates.length) {
    return {
      status: 500,
      message: `Could not retrieve state list.`,
    };
  }

  // Pull list of form descriptions
  const allFormDescriptions = await getFormDescriptions();

  if (!allFormDescriptions.length) {
    return {
      status: 500,
      message: `Could not retrieve form descriptions.`,
    };
  }

  // Add All StateForm Descriptions
  const putRequestsStateForms = [];

  // Loop through all states
  for (const state in allStates) {
    // Loop through form descriptions for each state
    for (const form in allFormDescriptions) {
      // Build lengthy strings
      const stateFormString = `${allStates[state].state_id}-${specifiedYear}-${specifiedQuarter}-${allFormDescriptions[form].form}`;

      if (!foundForms.includes(stateFormString)) {
        noMissingForms = false;
        // Add item to array for batching later
        putRequestsStateForms.push({
          PutRequest: {
            Item: {
              state_form: stateFormString,
              status_date: new Date().toISOString(),
              year: specifiedYear,
              state_comments: [{ type: "text_multiline", entry: "" }],
              form_id: allFormDescriptions[form].form_id,
              last_modified_by: "seed",
              status_modified_by: "seed",
              created_by: "seed",
              validation_percent: "0.03",
              status_id: 2,
              form: allFormDescriptions[form].form,
              program_code: "All",
              state_id: allStates[state].state_id,
              not_applicable: false,
              created_date: new Date().toISOString(),
              form_name: allFormDescriptions[form].form_name,
              last_modified: new Date().toISOString(),
              quarter: specifiedQuarter,
              status: "In Progress",
            },
          },
        });
      }
    }
  }
  // Begin batching by groups of 25
  const batchArrayFormDescriptions = [];
  const batchSize = 25;
  for (let i = 0; i < putRequestsStateForms.length; i += batchSize) {
    batchArrayFormDescriptions.push(
      putRequestsStateForms.slice(i, i + batchSize)
    );
  }

  // Generate a flat array of the state forms being added
  let stateFormsBeingGenerated = batchArrayFormDescriptions
    .map((e) => {
      return e.map((element) => {
        return element.PutRequest.Item.state_form;
      });
    })
    .flat();

  // Get tableName
  const formDescriptionTableName =
    process.env.STATE_FORMS_TABLE_NAME ?? process.env.StateFormsTableName;

  // Loop through batches and write to DB
  for (let i in batchArrayFormDescriptions) {
    const batchRequest = {
      RequestItems: {
        [formDescriptionTableName]: batchArrayFormDescriptions[i],
      },
    };

    // Process this batch
    await batchWriteAll({ batch: batchRequest, noOfRetries: 0 });
  }

  // -----------------------------------------------------------------

  // Pull list of questions
  let allQuestions;

  const questionsFromQuestionTable = await getQuestionsByYear(specifiedYear);

  // If questions not found, fetch/create them from template table
  if (!questionsFromQuestionTable.length) {
    let createdQuestions = await fetchOrCreateQuestions(
      specifiedYear,
      specifiedQuarter
    );

    if (createdQuestions.status !== 200) {
      // Return error message without payload
      const { status, message } = createdQuestions;
      return { status, message };
    }
    allQuestions = createdQuestions.payload;
  } else {
    allQuestions = questionsFromQuestionTable;
  }

  // Add All StateForm Descriptions
  const putRequestsFormAnswers = [];

  // Loop through all states, then all questions to return a new record with correct state info
  for (const state in allStates) {
    // Loop through each question

    for (const question in allQuestions) {
      // Get age range array
      let ageRanges =
        allQuestions[question].age_ranges ??
        determineAgeRanges(allQuestions[question].question);
      // Loop through each age range and insert row
      for (const range in ageRanges) {
        // Get reusable values
        const currentState = allStates[state].state_id;
        const currentForm = allQuestions[question].question.split("-")[1];
        const currentAgeRangeId = ageRanges[range].key;
        const currentAgeRangeLabel = ageRanges[range].label;
        const currentQuestionNumber =
          allQuestions[question].question.split("-")[2];
        const answerEntry = `${currentState}-${specifiedYear}-${specifiedQuarter}-${currentForm}-${currentAgeRangeId}-${currentQuestionNumber}`;
        const questionID = `${specifiedYear}-${currentForm}-${currentQuestionNumber}`;
        const stateFormID = `${currentState}-${specifiedYear}-${specifiedQuarter}-${currentForm}`;

        // If the stateFormID is in the array of newly created forms, the questions/answers will be created
        if (stateFormsBeingGenerated.includes(stateFormID)) {
          noMissingForms = false;
          putRequestsFormAnswers.push({
            PutRequest: {
              Item: {
                answer_entry: answerEntry,
                age_range: currentAgeRangeLabel,
                rangeId: currentAgeRangeId,
                question: questionID,
                state_form: stateFormID,
                last_modified_by: "seed",
                created_date: new Date().toISOString(),
                rows: allQuestions[question].rows,
                last_modified: new Date().toISOString(),
                created_by: "seed",
              },
            },
          });
        }
      }
    }
  }

  // Begin batching by groups of 25
  const batchArrayFormAnswers = [];
  const batchSizeFA = 25;
  for (let i = 0; i < putRequestsFormAnswers.length; i += batchSizeFA) {
    batchArrayFormAnswers.push(
      putRequestsFormAnswers.slice(i, i + batchSizeFA)
    );
  }

  // This will only be true if neither !foundForms.includes statements pass,
  // Everything was found in the list, nothing is to be created
  if (noMissingForms) {
    return {
      status: 204,
      message: `All forms, for Quarter ${specifiedQuarter} of ${specifiedYear}, previously existed. No new forms added`,
    };
  }

  // Get tableName
  const formAnswersTableName =
    process.env.FORM_ANSWERS_TABLE_NAME ?? process.env.FormAnswersTableName;

  // Loop through batches and write to DB
  for (let i in batchArrayFormAnswers) {
    const batchRequest = {
      RequestItems: {
        [formAnswersTableName]: batchArrayFormAnswers[i],
      },
    };

    // Process this batch
    await batchWriteAll({ batch: batchRequest, noOfRetries: 0 });
  }

  if (failureList.length > 0) {
    return {
      status: 500,
      message: `Failed to write all entries to database.`,
    };
  }

  return {
    status: 200,
    message: `Forms successfully created for Quarter ${specifiedQuarter} of ${specifiedYear}`,
  };
});
