import jsonpath from "jsonpath";
import {
  answers,
  questions,
  tabs,
  statusData
} from "./singleFormTestVariables";
import singleFormReducer, {
  gotFormData,
  UPDATE_ANSWER,
  getFormData
} from "./singleForm";
import configureStore from "redux-mock-store";

const initialState = {
  questions: [],
  answers: [],
  statusData: {},
  tabs: []
};

describe("Single Form Reducer, default values", () => {
  test("Should return default questions array", () => {
    const store = singleFormReducer(undefined, {});
    expect(store.questions).toEqual([]);
  });

  test("Should return default answers array", () => {
    const store = singleFormReducer(undefined, {});
    expect(store.answers).toEqual([]);
  });

  test("Should return default tabs array", () => {
    const store = singleFormReducer(undefined, {});
    expect(store.tabs).toEqual([]);
  });
  test("Should return default status object", () => {
    const store = singleFormReducer(undefined, {});
    expect(store.statusData).toEqual({});
  });
  test("Should return default state when not given an action type", () => {
    const store = singleFormReducer(undefined, {});
    expect(store).toEqual(initialState);
  });
});

describe("Single Form Reducer, with populated with values", () => {
  let initialState;
  let mockInputTemplate;

  beforeEach(() => {
    initialState = {
      questions: questions,
      answers: answers,
      statusData: statusData,
      tabs: tabs
    };

    mockInputTemplate = [
      {
        col2: null,
        col3: null,
        col4: null,
        col5: null,
        col6: null
      },
      {
        col2: null,
        col3: null,
        col4: null,
        col5: null,
        col6: null
      },
      {
        col2: null,
        col3: null,
        col4: null,
        col5: null,
        col6: null
      }
    ];
  });

  test("Should return an updated array of answers in state if provided with input", () => {
    const inputQuestionID = "AL-2021-1-21E-0612-03";
    const inputData = {
      col2: 1,
      col3: 1,
      col4: 2,
      col5: 3,
      col6: 5
    };
    // Lets mix up the fake input, specific to this test
    mockInputTemplate[0] = inputData;

    const store = singleFormReducer(initialState, {
      type: UPDATE_ANSWER,
      answerArray: mockInputTemplate,
      questionID: inputQuestionID
    });

    const foundAnswer = jsonpath.query(
      store.answers,
      `$..[?(@.answer_entry == "${inputQuestionID}")]`
    )[0];
    const answerRows = foundAnswer.rows;

    expect(answerRows[1].col5).toEqual(3);
  });

  test("Should return an updated array of answers in state if provided with input", () => {
    const inputQuestionID = "AL-2021-1-21E-0612-09";
    const inputData = {
      col2: 28,
      col3: 4,
      col4: 93,
      col5: 413,
      col6: 27
    };
    // Lets mix up the fake input, specific to this test
    mockInputTemplate[1] = inputData;

    const store = singleFormReducer(initialState, {
      type: UPDATE_ANSWER,
      answerArray: mockInputTemplate,
      questionID: inputQuestionID
    });

    const foundAnswer = jsonpath.query(
      store.answers,
      `$..[?(@.answer_entry == "${inputQuestionID}")]`
    )[0];
    const answerRows = foundAnswer.rows;
    expect(answerRows[2].col2).toEqual(28);
  });

  test("Should return an updated array of answers in state if provided with input", () => {
    const inputQuestionID = "AL-2021-1-21E-0105-08";
    const inputData = {
      col2: 10,
      col3: 30,
      col4: 50,
      col5: 70,
      col6: 90
    };
    // Lets mix up the fake input, specific to this test
    mockInputTemplate[2] = inputData;

    const store = singleFormReducer(initialState, {
      type: UPDATE_ANSWER,
      answerArray: mockInputTemplate,
      questionID: inputQuestionID
    });

    const foundAnswer = jsonpath.query(
      store.answers,
      `$..[?(@.answer_entry == "${inputQuestionID}")]`
    )[0];
    const answerRows = foundAnswer.rows;

    expect(answerRows[3].col6).toEqual(90);
  });

  test("Should return default state when not given an action type", () => {
    const store = singleFormReducer(initialState, {});
    expect(store).toEqual(initialState);
  });
});

describe("Single Form Reducer, component parts", () => {
  const mockStore = configureStore([]);
  const initialState = {
    questions: questions,
    answers: answers,
    statusData: statusData,
    tabs: tabs
  };

  test("should dispatch an action via action creators", () => {
    const store = mockStore(initialState);
    store.dispatch(gotFormData({}));

    const actions = store.getActions();
    const expectedPayload = {
      type: "LOAD_SINGLE_FORM",
      formObject: {}
    };
    expect(actions).toEqual([expectedPayload]);
  });

  test("thunks should return a function", () => {
    const returnedValue = getFormData("AL", "2021", "1", "21E");
    expect(typeof returnedValue).toEqual("function");
  });
});