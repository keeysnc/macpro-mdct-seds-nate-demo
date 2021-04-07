import React from "react";
import { mount } from "enzyme";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";

import AddUser from "./AddUser.js";
import stateListMock from "../../provider-mocks/stateListMock";

let store;
let wrapper;

const mockStore = configureMockStore([]);

describe("Test AddUser.js", () => {
  beforeEach(() => {
    store = mockStore(stateListMock);
    wrapper = mount(
      <Provider store={store}>
        <AddUser />
      </Provider>
    );
  });

  test("Check the main div, with classname AddUser, exists", () => {
    expect(wrapper.find(".page-header").length).toBe(1);
  });

  test("Check the Main component exists", () => {
    expect(wrapper.find(".addUserMain").length).toBe(1);
  });

  test("Check that the User List link is available", () => {
    expect(wrapper.find(".userList").length).toBe(2);
  });

  test("Check the EUA ID input component renders", () => {
    expect(wrapper.find(".euaID").length).toBe(1);
  });

  test("Check the Role Selector drop-down renders", () => {
    expect(wrapper.find(".selectRole").length).toBe(1);
  });

  /* Will need to come back to this test as this drop-down is not shown until a Role is selected
   test("Check the State Selector drop-down renders", () => {
        expect(wrapper.find(".selectState").length).toBe(1);
    });
    */

  test("Check the Add User button renders", () => {
    expect(wrapper.find(".createUser").length).toBe(2);
  });
});