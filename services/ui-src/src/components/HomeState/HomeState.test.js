import React from "react";
import HomeState from "./HomeState";
import { mount } from "enzyme";
import { Accordion } from "@trussworks/react-uswds";

describe("Test HomeState.js", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<HomeState />);
  });

  test("Should render the home state classname", () => {
    expect(wrapper.find(".page-home-state").length).toBe(1);
  });
  test("Should render the report list classname", () => {
    expect(wrapper.find(".quarterly-report-list").length).toBe(1);
  });
  test("Should include a Accordion component", () => {
    expect(wrapper.containsMatchingElement(<Accordion />)).toEqual(true);
  });
});
