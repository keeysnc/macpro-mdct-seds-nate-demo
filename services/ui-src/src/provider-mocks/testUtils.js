import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { reducers } from "../store/storeIndex";

export const findByTestAttribute = (wrapper, val) => {
  return wrapper.find(`.${val}`);
};

export const storeFactory = initialState => {
  return createStore(reducers, initialState, applyMiddleware(thunk));
};
