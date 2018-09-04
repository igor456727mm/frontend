
const initialState = {
  current: 'ru',
  list: [{ name: 'en', code: 'en' }],
  translations: {

  }
}

const lang = (state = initialState, action) => {
  switch (action.type) {
    case 'LOAD_LANG_LIST':
      return { ...state, list: action.list }
      break;
    case 'CHANGE_LANG':
      if(action.translation) state.translations[action.key] = action.translation
      window.dispatchEvent(new Event('CHANGE_LANG'))
      return { ...state, current: action.key }
    default:
      return state
  }
}

export default lang
