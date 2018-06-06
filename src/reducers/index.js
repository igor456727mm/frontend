import { combineReducers, createStore } from 'redux'
import user from "./user";
import lang from "./lang";
import config from './config'

const reducers = combineReducers({
  user,
  lang,
  config
});

const store = window.store = createStore(reducers, {})
export default store
